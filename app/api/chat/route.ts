import { NextResponse } from "next/server";
import { compareInvoices, type Cause, type DiffResult } from "@/lib/diff-engine";
import { generateExplanation } from "@/lib/gemini";
import {
  getConceptExplanation,
  getFallbackConceptExplanation,
  searchConcepts,
  type ConceptMatch,
} from "@/lib/concept-retrieval";
import { classifyFollowUp } from "@/lib/intent";
import { getSession, updateSession } from "@/lib/session-store";
import { evaluateCrossSell, evaluateClosingReminder } from "@/lib/cross-selling";
import { classifySentiment, type SentimentResult } from "@/lib/sentiment";

// Contrato de salida adaptado al frontend portado de app/components/Chat.tsx
// (repo del compañero). La lógica de negocio (diff engine, cross-selling,
// sesiones, Gemini) es la misma de siempre — solo cambia cómo se serializa
// la respuesta. Ver PLAN-IMPLEMENTACION.md, sección de integración de frontend.

type ChatRequestBody = {
  customer_key?: string;
  message?: string;
  conversation_id?: string;
  channel?: "web" | "whatsapp";
};

type EvidenceItem = { table: string; field: string; value: string };

type BreakdownItem = {
  concept: string;
  amount: string;
  previous_amount: string;
  date: string;
  evidence: EvidenceItem[];
};

type ChatAction = "pagar" | "ver_detalle" | "derivar_asesor" | "cross_sell";

type ChatResponseBody = {
  conversation_id: string;
  text: string;
  answer: string;
  breakdown: BreakdownItem[];
  actions: ChatAction[];
  cross_sell_offer: {
    title: string;
    description: string;
    price: string;
    source_offer_code: string;
  } | null;
  handoff: { reason: string; context: Record<string, string> } | null;
  closing_reminder: string | null;
  tone: "positiva" | "neutral" | "negativa" | "critica";
  generated_by: string;
};

function money(n: number): string {
  return n.toFixed(2);
}

/**
 * Evidencia real (no fabricada): apunta al archivo/campo de donde salió
 * cada cifra, para el panel "ver fuente del cálculo" del frontend.
 */
function causeToBreakdownItem(cause: Cause, currentCiclo: string): BreakdownItem {
  if (cause.type === "reconexion") {
    return {
      concept: "Reconexión",
      amount: money(cause.monto),
      previous_amount: "0.00",
      date: cause.fechaReconexion,
      evidence: [
        { table: "BRAINY_RECONEXIONESV3.csv", field: "Monto", value: money(cause.monto) },
        { table: "BRAINY_RECONEXIONESV3.csv", field: "FechaReconexion", value: cause.fechaReconexion },
        { table: "BRAINY_RECONEXIONESV3.csv", field: "FechaCorte", value: cause.fechaCorte },
      ],
    };
  }
  if (cause.type === "prorrateo") {
    return {
      concept: "Prorrateo",
      amount: money(cause.monto),
      previous_amount: "0.00",
      date: cause.fechaFin,
      evidence: [
        { table: "BRAINY_PRORRATEO_ALTASV3.csv", field: "suma_prorrateo", value: money(cause.monto) },
        { table: "BRAINY_PRORRATEO_ALTASV3.csv", field: "fecha_inicio_minima", value: cause.fechaInicio },
        { table: "BRAINY_PRORRATEO_ALTASV3.csv", field: "fecha_fin_maxima", value: cause.fechaFin },
      ],
    };
  }
  if (cause.type === "fin_descuento") {
    return {
      concept: `Fin de descuento: ${cause.descripcion}`,
      amount: money(cause.monto),
      previous_amount: "0.00",
      date: currentCiclo,
      evidence: [
        { table: "FACTURACION-CLIENTES.csv", field: "CHARGE_CODE_ID", value: cause.chargeCodeId },
        { table: "FACTURACION-CLIENTES.csv", field: "CHARGE_CODE_DESC", value: cause.descripcion },
      ],
    };
  }
  return {
    concept: cause.charge.chargeCodeDesc,
    amount: money(cause.charge.currentAmount),
    previous_amount: money(cause.charge.previousAmount),
    date: currentCiclo,
    evidence: [
      { table: "FACTURACION-CLIENTES.csv", field: "CHARGE_CODE_ID", value: cause.charge.chargeCodeId },
    ],
  };
}

function buildContext(result: DiffResult, conceptMatches: ConceptMatch[]): string {
  const lines: string[] = [];

  if (!result.currentInvoice) {
    lines.push("No se encontró ningún recibo para esta cuenta.");
    return lines.join("\n");
  }

  lines.push(
    `Recibo actual: ${result.currentInvoice.invoiceNumber}, ciclo ${result.currentInvoice.ciclo}, total S/.${result.currentTotal.toFixed(2)}`
  );

  if (result.hasComparison && result.previousInvoice) {
    lines.push(
      `Recibo anterior: ${result.previousInvoice.invoiceNumber}, ciclo ${result.previousInvoice.ciclo}, total S/.${result.previousTotal.toFixed(2)}`
    );
    lines.push(`Diferencia entre ambos: S/.${result.delta.toFixed(2)}`);
  } else {
    lines.push(
      "Este es el primer recibo de la cuenta — no hay un recibo anterior con qué comparar."
    );
  }

  if (result.causes.length === 0) {
    lines.push("No se detectó ninguna causa de variación en este recibo.");
  }

  for (const cause of result.causes) {
    lines.push(`\nCausa detectada: ${JSON.stringify(cause)}`);
    const concept = getConceptExplanation(cause);
    if (concept) {
      lines.push(`Explicación general del concepto: ${concept}`);
    }
  }

  if (conceptMatches.length > 0) {
    lines.push(
      "\nConceptos generales de la base de conocimiento relacionados con la " +
        "pregunta del cliente (información de referencia general — no son montos " +
        "de este recibo, úsalos solo si de verdad responden lo que preguntó):"
    );
    for (const match of conceptMatches) {
      lines.push(`- ${match.content}`);
    }
  }

  return lines.join("\n");
}

function buildHandoffContext(
  reason: string,
  accountId: string,
  result: DiffResult,
  lastExplanationText: string | null,
  extra: Record<string, string> = {}
): { reason: string; context: Record<string, string> } {
  return {
    reason,
    context: {
      accountId,
      recibo: result.currentInvoice?.invoiceNumber ?? "N/A",
      total: money(result.currentTotal),
      causas: JSON.stringify(result.causes),
      yaExplicado: lastExplanationText ?? "",
      ...extra,
    },
  };
}

/** Datos de sentimiento listos para anexar a un payload de hand-off. */
function sentimentContext(sentiment: SentimentResult): Record<string, string> {
  return {
    temperatura: sentiment.temperatura,
    confianza: sentiment.confianza.toFixed(2),
    senales: sentiment.senales_detectadas.join("; "),
  };
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Body inválido, se esperaba JSON." }, { status: 422 });
  }

  const accountId = body.customer_key;
  const message = body.message;
  const sessionId = body.conversation_id ?? crypto.randomUUID();

  if (!accountId || !message) {
    return NextResponse.json({ detail: "Cliente y mensaje requeridos" }, { status: 422 });
  }

  // Clasificador de sentimiento (Database/prompt_analisis_sentimiento_claria.md):
  // se dispara ya para que corra mientras se resuelve el resto del pipeline —
  // es una llamada a Gemini independiente, solo ve este texto, nunca datos
  // financieros ni el prompt del motor de redacción.
  const sentimentPromise = classifySentiment(message);

  const result = compareInvoices(accountId);
  const session = getSession(sessionId, accountId);

  if (!result.currentInvoice) {
    const response: ChatResponseBody = {
      conversation_id: sessionId,
      text: "No encontré recibos para esta cuenta. Te voy a derivar con un asesor para que revise tu caso.",
      answer: "No encontré recibos para esta cuenta. Te voy a derivar con un asesor para que revise tu caso.",
      breakdown: [],
      actions: ["derivar_asesor"],
      cross_sell_offer: null,
      handoff: { reason: "cuenta_sin_recibos", context: { accountId } },
      closing_reminder: null,
      tone: "neutral",
      generated_by: "determinista",
    };
    return NextResponse.json(response);
  }

  const intent = classifyFollowUp(message);
  const sentiment = await sentimentPromise;

  // Gate de sentimiento — máxima prioridad, por encima de cualquier otra
  // rama: un mensaje "crítico" deriva de inmediato, sin ofertas, sin
  // importar qué haya dicho el clasificador de intención por palabras clave.
  if (sentiment.temperatura === "critica") {
    const text =
      "Entiendo tu molestia — te voy a derivar de inmediato con un asesor con todo el contexto de esta conversación.";
    const response: ChatResponseBody = {
      conversation_id: sessionId,
      text,
      answer: text,
      breakdown: [],
      actions: ["derivar_asesor"],
      cross_sell_offer: null,
      handoff: buildHandoffContext(
        "cliente_critico",
        accountId,
        result,
        session.lastExplanationText,
        sentimentContext(sentiment)
      ),
      closing_reminder: null,
      tone: sentiment.temperatura,
      generated_by: "determinista",
    };
    return NextResponse.json(response);
  }

  const negativaPersistente = sentiment.temperatura === "negativa" && sentiment.confianza >= 0.75;

  // Turno de cierre: ya se explicó algo antes y el cliente responde conforme.
  if (session.explained && intent === "satisfecho") {
    // Regla del Gate: el sentimiento nunca FUERZA una oferta, pero sí puede
    // bloquearla — un "gracias" con tono negativo no habilita cross-selling.
    const crossSellOffer =
      session.crossSellShown || negativaPersistente ? null : evaluateCrossSell(result, true);
    const closingReminder = evaluateClosingReminder(result, true);
    if (crossSellOffer) updateSession(sessionId, { crossSellShown: true });

    const actions: ChatAction[] = ["ver_detalle"];
    if (crossSellOffer) actions.push("cross_sell");

    const text = "¡De nada! Cualquier otra duda sobre tu recibo, contame.";
    const response: ChatResponseBody = {
      conversation_id: sessionId,
      text,
      answer: text,
      breakdown: [],
      actions,
      cross_sell_offer: crossSellOffer
        ? {
            title: crossSellOffer.title,
            description: crossSellOffer.description,
            price: money(crossSellOffer.price),
            source_offer_code: crossSellOffer.code,
          }
        : null,
      handoff: null,
      closing_reminder: closingReminder,
      tone: sentiment.temperatura,
      generated_by: "determinista",
    };
    return NextResponse.json(response);
  }

  // Hand-off: el cliente pide un humano, ya se explicó y sigue sin entender,
  // o el sentimiento sigue negativo con alta confianza tras la explicación.
  if (session.explained && (intent === "quiere_asesor" || intent === "confundido" || negativaPersistente)) {
    const reason = intent === "quiere_asesor"
      ? "cliente_pidio_asesor"
      : intent === "confundido"
        ? "cliente_no_entendio"
        : "cliente_negativo_persistente";
    const text =
      "Entendido, te voy a derivar con un asesor con todo el contexto de esta conversación para que no tengas que repetir nada.";
    const response: ChatResponseBody = {
      conversation_id: sessionId,
      text,
      answer: text,
      breakdown: [],
      actions: ["derivar_asesor"],
      cross_sell_offer: null,
      handoff: buildHandoffContext(
        reason,
        accountId,
        result,
        session.lastExplanationText,
        sentimentContext(sentiment)
      ),
      closing_reminder: null,
      tone: sentiment.temperatura,
      generated_by: "determinista",
    };
    return NextResponse.json(response);
  }

  // Flujo normal: explicar la variación del recibo actual. La búsqueda
  // vectorial corre siempre acá (independiente de si el diff engine encontró
  // una causa) — cubre preguntas generales tipo "¿qué es Movistar Total?"
  // que no tienen por qué coincidir con la causa detectada en este recibo.
  const conceptMatches = await searchConcepts(message);
  const context = buildContext(result, conceptMatches);
  const hasCauses = result.causes.length > 0;
  const hasConceptMatch = conceptMatches.length > 0;

  let explanationText: string;
  let generatedBy = "gemini";
  try {
    if (hasCauses || hasConceptMatch) {
      explanationText = await generateExplanation(context, message);
    } else {
      explanationText = getFallbackConceptExplanation();
      generatedBy = "determinista";
    }
  } catch (err) {
    console.error("Gemini generateExplanation falló:", err);
    explanationText =
      "Tuve un problema para redactar la explicación en este momento. " +
      "Te dejo los datos igual y podés reintentar en unos segundos.";
    generatedBy = "fallback-determinista";
  }

  updateSession(sessionId, {
    explained: hasCauses || hasConceptMatch,
    lastExplanationText: explanationText,
  });

  const breakdown = result.causes
    .filter(
      (c) =>
        c.type === "reconexion" ||
        c.type === "prorrateo" ||
        c.type === "fin_descuento"
    )
    .map((c) => causeToBreakdownItem(c, result.currentInvoice!.ciclo));

  const actions: ChatAction[] = ["ver_detalle"];
  if (result.currentTotal > 0) actions.push("pagar");
  if (!hasCauses && !hasConceptMatch) actions.push("derivar_asesor");

  const response: ChatResponseBody = {
    conversation_id: sessionId,
    text: explanationText,
    answer: explanationText,
    breakdown,
    actions,
    cross_sell_offer: null,
    handoff: null,
    closing_reminder: null,
    tone: sentiment.temperatura,
    generated_by: generatedBy,
  };

  return NextResponse.json(response);
}
