import fs from "fs";
import path from "path";
import type { Cause } from "./diff-engine";
import { embedText } from "./gemini";

/**
 * Las tres causas ya tienen su archivo curado en concepts/ (extraídos de
 * Database/kb-facturacion-movistar.md y -m2.md). Estos textos son un
 * RESUMEN conciso para inyectar en el prompt — el detalle completo (fórmulas,
 * casos resueltos, FAQ) vive en el .md correspondiente para cuando exista
 * la capa de búsqueda vectorial (data/embeddings.json, todavía no conectada).
 */
const CONCEPT_STUBS: Record<string, string> = {
  // Fuente: concepts/reconexion.md.
  reconexion:
    "Una reconexión es el cargo que se aplica cuando el servicio se reactiva " +
    "tras una suspensión por falta de pago. El período sin servicio nunca se " +
    "cobra: con Renta Vencida, el recibo se divide en dos tramos proporcionales " +
    "(antes del corte y después de la reconexión) y los días suspendidos se " +
    "omiten; con Renta Adelantada, como el mes ya se había pagado por " +
    "adelantado, esos días se devuelven con una Nota de Crédito en un recibo " +
    "posterior. En ambos casos, el cargo por reconexión aparece en el recibo " +
    "posterior a la reconexión, no en el del corte.",
  // Fuente: concepts/prorrateo.md.
  prorrateo:
    "Un prorrateo es el cobro proporcional a los días efectivamente usados, " +
    "no el mes completo — aparece típicamente en el primer recibo de una " +
    "alta nueva, cuando el servicio se activó a mitad de un ciclo de " +
    "facturación. Si el cliente tiene Renta Vencida, ese primer recibo " +
    "incluye solo el proporcional. Si tiene Renta Adelantada, el primer " +
    "recibo puede incluir además el mes siguiente cobrado por adelantado, " +
    "por lo que suele verse más alto que los recibos posteriores — eso no " +
    "es un cobro de más, es la suma de dos conceptos distintos en un solo " +
    "recibo. Desde el segundo recibo, la facturación vuelve a ser regular.",
  // Fuente: concepts/fin-descuento.md.
  fin_descuento:
    "Muchos planes incluyen un descuento temporal (por fidelización, " +
    "portabilidad o una campaña) que dura una cantidad fija de ciclos. Cuando " +
    "ese período termina, el descuento deja de aplicarse y el recibo vuelve " +
    "al monto normal del plan — no es un cobro nuevo, es la ausencia del " +
    "descuento que ya no corresponde. Si el descuento terminó a mitad de un " +
    "ciclo, el último recibo con descuento lo trae de forma proporcional a " +
    "los días vigentes (por eso se ve más chico que los anteriores), y el " +
    "salto al monto completo recién se nota en el siguiente recibo. El " +
    "descuento siempre aplicó solo sobre el cargo fijo del plan, nunca sobre " +
    "servicios adicionales, paquetes o cuotas de financiamiento de equipo.",
};

/** Explicación general del concepto detrás de una causa detectada por el diff engine. */
export function getConceptExplanation(cause: Cause): string | null {
  if (
    cause.type === "reconexion" ||
    cause.type === "prorrateo" ||
    cause.type === "fin_descuento"
  ) {
    return CONCEPT_STUBS[cause.type] ?? null;
  }
  return null;
}

/** Último recurso: ni el diff engine ni la búsqueda vectorial encontraron nada relevante. */
export function getFallbackConceptExplanation(): string {
  return (
    "No tengo información suficiente para responder eso con certeza. " +
    "Te recomiendo confirmarlo con un asesor para no darte un dato impreciso."
  );
}

// --- Bloque B: capa vectorial sobre concepts/*.md ---------------------------
// Cubre los 9 archivos que no tienen una causa dedicada en el diff engine
// (orientacion-recibo, notas-credito, cambio-de-plan, deuda-y-pagos,
// campana-descuento-deuda, fraccionamiento-deuda, bloqueo-equipo,
// movistar-total, atencion-identidad) — generado una vez por
// scripts/build-embeddings.ts, commiteado en data/embeddings.json.

type ConceptEmbedding = { file: string; content: string; embedding: number[] };
export type ConceptMatch = { file: string; content: string; score: number };

const EMBEDDINGS_PATH = path.join(process.cwd(), "data", "embeddings.json");
const MIN_SIMILARITY = 0.5;
const TOP_K = 2;

let embeddingsCache: ConceptEmbedding[] | null = null;

function loadEmbeddings(): ConceptEmbedding[] {
  if (embeddingsCache) return embeddingsCache;
  if (!fs.existsSync(EMBEDDINGS_PATH)) {
    console.error(
      `${EMBEDDINGS_PATH} no existe todavía — corré "npm run build-embeddings" primero.`
    );
    embeddingsCache = [];
    return embeddingsCache;
  }
  embeddingsCache = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, "utf8"));
  return embeddingsCache!;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Búsqueda semántica sobre concepts/*.md, para preguntas generales que no
 * calzan con una causa puntual del diff engine (ej. "¿qué es Movistar
 * Total?", "¿cómo pago una deuda fraccionada?"). Nunca lanza — si falla el
 * embedding de la pregunta (cuota, red), devuelve [] y el caller sigue con
 * lo que sí tenga (las causas del diff engine, si hay).
 */
export async function searchConcepts(query: string): Promise<ConceptMatch[]> {
  const embeddings = loadEmbeddings();
  if (embeddings.length === 0) return [];

  try {
    const queryVector = await embedText(query);
    return embeddings
      .map((entry) => ({
        file: entry.file,
        content: entry.content,
        score: cosineSimilarity(queryVector, entry.embedding),
      }))
      .filter((entry) => entry.score >= MIN_SIMILARITY)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);
  } catch (err) {
    console.error("searchConcepts falló, sin enriquecimiento vectorial:", err);
    return [];
  }
}
