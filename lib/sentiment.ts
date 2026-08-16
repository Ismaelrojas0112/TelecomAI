import { withKeyRotation } from "./gemini";

// Fuente: Database/prompt_analisis_sentimiento_claria.md. Clasificador
// INDEPENDIENTE del motor de redacción — llamada propia, sin compartir
// sesión/contexto, y solo ve el texto del mensaje (nunca datos financieros),
// tal como exige el documento.
const SENTIMENT_MODEL = "gemini-flash-lite-latest";

const SYSTEM_INSTRUCTION = `
Eres un clasificador de tono conversacional para el asistente de explicación
de facturación de Movistar. Tu única función es analizar el TEXTO del mensaje
del cliente y clasificar su temperatura emocional aparente. No calculas
montos, no explicas el recibo, no tomas decisiones de negocio — solo
clasificas tono.

## Qué debes evaluar
Analiza exclusivamente señales lingüísticas explícitas en el mensaje:
- Elección de palabras (quejas, insultos, agradecimientos, urgencia)
- Puntuación y mayúsculas (signos de exclamación repetidos, texto en mayúsculas)
- Marcadores de frustración explícitos ("ya llamé 3 veces", "esto es un abuso")
- Marcadores de conformidad o satisfacción explícitos ("ah ok, gracias", "entendido")

## Qué NO debes hacer
- No infieras estados psicológicos, diagnósticos ni intenciones no expresadas en el texto.
- No uses el historial de facturación ni montos para inferir sentimiento — solo el texto.
- No inventes señales que no estén presentes en el mensaje.
- No suavices tu clasificación para quedar bien — sé preciso.
- Si el mensaje es ambiguo o neutro (una simple pregunta informativa), clasifica como
  "neutral" — no fuerces una polaridad.

## Escala de temperatura (elige exactamente una)
- "positiva": agradecimiento, conformidad, tono cordial, cierre satisfecho.
- "neutral": pregunta informativa sin carga emocional explícita, primer contacto.
- "negativa": frustración, molestia, incredulidad ("no entiendo por qué me cobran esto").
- "critica": enojo explícito, amenaza de baja/cancelación, lenguaje agresivo,
  mención de reclamo formal o denuncia.

## Formato de salida
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown,
siguiendo exactamente este esquema:

{
  "temperatura": "positiva" | "neutral" | "negativa" | "critica",
  "confianza": 0.0-1.0,
  "senales_detectadas": ["lista breve de 1-3 señales textuales que motivaron la clasificación"],
  "requiere_atencion_prioritaria": true | false
}

"requiere_atencion_prioritaria" es true únicamente si temperatura es "critica",
o si es "negativa" con confianza >= 0.75.
`.trim();

export type Temperatura = "positiva" | "neutral" | "negativa" | "critica";

export type SentimentResult = {
  temperatura: Temperatura;
  confianza: number;
  senales_detectadas: string[];
  requiere_atencion_prioritaria: boolean;
};

const NEUTRAL_FALLBACK: SentimentResult = {
  temperatura: "neutral",
  confianza: 0,
  senales_detectadas: [],
  requiere_atencion_prioritaria: false,
};

const VALID_TEMPERATURAS: Temperatura[] = ["positiva", "neutral", "negativa", "critica"];

function isValidSentiment(value: unknown): value is SentimentResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    VALID_TEMPERATURAS.includes(v.temperatura as Temperatura) &&
    typeof v.confianza === "number" &&
    Array.isArray(v.senales_detectadas) &&
    typeof v.requiere_atencion_prioritaria === "boolean"
  );
}

/**
 * Clasifica el tono del mensaje del cliente. Corre en paralelo al resto del
 * pipeline (no bloquea la redacción de la explicación). Si falla por
 * cualquier motivo, cae en "neutral" sin atención prioritaria — nunca debe
 * romper la respuesta principal del asistente (ver sección 5 de la fuente).
 */
export async function classifySentiment(
  message: string,
  recentHistory?: string
): Promise<SentimentResult> {
  try {
    const response = await withKeyRotation((client) =>
      client.models.generateContent({
        model: SENTIMENT_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `## Mensaje del cliente a analizar\n${message}\n\n` +
                  `## Contexto conversacional reciente (opcional, últimos 2-3 turnos)\n${recentHistory ?? "(sin historial previo)"}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0,
          responseMimeType: "application/json",
        },
      })
    );

    const parsed: unknown = JSON.parse(response.text ?? "");
    if (!isValidSentiment(parsed)) {
      console.error("classifySentiment: respuesta con forma inesperada", parsed);
      return NEUTRAL_FALLBACK;
    }
    return parsed;
  } catch (err) {
    console.error("classifySentiment falló, usando fallback neutral:", err);
    return NEUTRAL_FALLBACK;
  }
}
