import { GoogleGenAI } from "@google/genai";

// GEMINI_API_KEY ya tiene facturación activa en Google AI Studio/Cloud —
// sin límite de cuota gratuita, así que ya no hace falta rotar entre varias
// keys de respaldo (se usaron GEMINI_API_KEY_2/_3 mientras todas estaban en
// el free tier de 20 req/día; ver PLAN-IMPLEMENTACION.md). withKeyRotation
// se mantiene igual por el reintento ante 503 (saturación transitoria del
// modelo), que sigue siendo útil con una sola key.
const API_KEYS = [process.env.GEMINI_API_KEY].filter(
  (key): key is string => Boolean(key)
);

if (API_KEYS.length === 0) {
  throw new Error(
    "Falta al menos GEMINI_API_KEY en las variables de entorno (.env.local)"
  );
}

const clients = API_KEYS.map((apiKey) => new GoogleGenAI({ apiKey }));

const GENERATION_MODEL = "gemini-flash-latest";
const EMBEDDING_MODEL = "gemini-embedding-001";

const SYSTEM_INSTRUCTION = `
Eres el asistente de explicación de recibos de Movistar. Tu única tarea es
redactar, en español simple y empático, la explicación de la variación de un
recibo a partir de los datos que se te entregan en el contexto.

Reglas estrictas, sin excepción:
- Nunca inventes ni modifiques un monto, fecha o concepto. Usa exactamente
  los valores que vienen en el contexto — si no está en el contexto, no
  existe para ti.
- Si el contexto no alcanza para responder algo puntual, dilo explícitamente
  en vez de adivinar o rellenar con un supuesto razonable.
- Sé breve: 2-4 oraciones, tono cercano y claro, sin tecnicismos innecesarios
  ("prorrateo" y términos similares se explican, no se asumen entendidos).
- No ofrezcas productos, promociones ni descuentos salvo que el contexto te
  lo indique explícitamente como una oferta habilitada.
- Responde en texto plano, sin markdown (nada de **negritas**, títulos ni
  listas con guiones) — el mensaje se muestra tal cual en un chat.
`.trim();

function errorStatus(err: unknown): string | null {
  const message = err instanceof Error ? err.message : String(err);
  return message.match(/"status":"(\w+)"/)?.[1] ?? null;
}

/**
 * Prueba cada API key en orden. Un 503 (UNAVAILABLE, saturación transitoria
 * del modelo) reintenta una vez con la MISMA key, porque en la práctica se
 * resuelve solo. Un 429 (RESOURCE_EXHAUSTED, cuota agotada) no tiene sentido
 * reintentarlo en la misma key — pasa directo a la siguiente.
 *
 * Exportado para que otros módulos (ej. lib/sentiment.ts) reusen la misma
 * resiliencia sin duplicar la lógica de reintentos — no implica compartir
 * sesión ni contexto de prompt, cada llamada sigue siendo independiente.
 */
export async function withKeyRotation<T>(
  call: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (const client of clients) {
    const maxAttemptsThisKey = 2;
    for (let attempt = 1; attempt <= maxAttemptsThisKey; attempt++) {
      try {
        return await call(client);
      } catch (err) {
        lastError = err;
        const retryableOnSameKey =
          errorStatus(err) === "UNAVAILABLE" && attempt < maxAttemptsThisKey;
        if (!retryableOnSameKey) break;
      }
    }
  }

  throw lastError;
}

/**
 * Redacta la explicación final combinando los hechos ya calculados por el
 * diff engine (contexto) con la pregunta del cliente. El LLM solo redacta,
 * nunca calcula ni decide montos.
 */
export async function generateExplanation(
  context: string,
  question: string
): Promise<string> {
  const response = await withKeyRotation((client) =>
    client.models.generateContent({
      model: GENERATION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Contexto (hechos verificados, no los alteres):\n${context}\n\nPregunta del cliente:\n${question}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    })
  );
  return response.text ?? "";
}

/** Embedding de un texto — usado solo para la capa de conceptos/FAQ, nunca para montos. */
export async function embedText(text: string): Promise<number[]> {
  const response = await withKeyRotation((client) =>
    client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    })
  );
  return response.embeddings?.[0]?.values ?? [];
}
