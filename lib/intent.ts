export type FollowUpIntent = "satisfecho" | "confundido" | "quiere_asesor" | "otro";

/**
 * Clasificación determinista por palabras clave — a propósito no usa el LLM
 * acá: es una señal de control de flujo (dispara hand-off / cross-selling),
 * y debe ser predecible para la demo, no depender de una llamada externa.
 */
export function classifyFollowUp(message: string): FollowUpIntent {
  const lower = message.toLowerCase().trim();

  if (/asesor|hablar con (alguien|una persona)|humano|agente|representante/.test(lower)) {
    return "quiere_asesor";
  }

  if (
    /no entiendo|no entend|no me qued|sigo sin entender|no comprendo|explica(me)? de nuevo|explícame de nuevo|no me qued[oó] claro|sigo confundid/.test(
      lower
    )
  ) {
    return "confundido";
  }

  if (
    /^(gracias|muchas gracias|listo|entendido|ok|okay|perfecto|genial|ya entend|excelente|de acuerdo|vale|okey)\b/.test(
      lower
    )
  ) {
    return "satisfecho";
  }

  return "otro";
}
