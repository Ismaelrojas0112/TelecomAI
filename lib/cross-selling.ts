import type { DiffResult } from "./diff-engine";

export type CrossSellOffer = {
  title: string;
  description: string;
  /** Precio real del catálogo (CATALOGO-OFERTAS.csv), no una cifra decorativa. */
  price: number;
  /** CHARGE CODE real de CATALOGO-OFERTAS.csv que respalda la oferta. */
  code: string;
};

const DATA_BONUS_CLASSIFICATIONS = new Set([
  "Bono Recurrente Cargo",
  "BONIFICACION / GRATUIDAD Fija",
]);

// Ofertas reales del catálogo (CATALOGO-OFERTAS.csv, cruzadas con
// FACTURACION-CLIENTES.csv para la descripción legible).
const RECONEXION_OFFER: CrossSellOffer = {
  // "Bono 10GB x1meses (VR S/13.74)", código RCD_PAQRE189. Bajo compromiso,
  // encaja como gesto tras resolver una reconexión.
  title: "Bono 10GB x 1 mes",
  description:
    "Ya que resolvimos tu consulta, tenemos disponible un Bono de 10GB por " +
    "S/.13.74 para tu línea este mes. ¿Te gustaría activarlo?",
  price: 13.74,
  code: "RCD_PAQRE189",
};

const FIN_DESCUENTO_OFFER: CrossSellOffer = {
  // "DSCT FIDELIZACION S/ 10", código FRIRDE_103. Descuento de fidelización
  // vigente, mismo tipo de beneficio que el que le acaba de vencer.
  title: "Nuevo descuento de fidelización",
  description:
    "Ya que resolvimos tu consulta: tu descuento anterior venció, pero " +
    "tenemos un nuevo descuento de fidelización de S/.10 disponible para tu " +
    "plan. ¿Te gustaría activarlo?",
  price: 10,
  code: "FRIRDE_103",
};

/**
 * Regla 2 (reconexión) — bases: FUNCIONALIDADES.md.
 * Solo se ofrece si (a) la consulta se resolvió satisfactoriamente y
 * (b) el cliente tuvo una reconexión y (c) no tiene ya un bono de datos
 * activo en su recibo actual (si no, no hay nada real que ofrecerle).
 *
 * Regla 1 (fin de descuento) — mismo criterio de resuelto + regla explícita,
 * disparada por la causa `fin_descuento` del diff engine.
 *
 * Si ambas causas están presentes a la vez, se prioriza la reconexión — es
 * el escenario garantizado, no el bonus.
 */
export function evaluateCrossSell(
  result: DiffResult,
  resolved: boolean
): CrossSellOffer | null {
  if (!resolved || !result.currentInvoice) return null;

  const hasReconexion = result.causes.some((c) => c.type === "reconexion");
  if (hasReconexion) {
    const yaTieneBonoDeDatos = result.currentInvoice.charges.some((c) =>
      DATA_BONUS_CLASSIFICATIONS.has(c.CHARGE_CODE_CLASSIFICATION)
    );
    return yaTieneBonoDeDatos ? null : RECONEXION_OFFER;
  }

  const hasFinDescuento = result.causes.some((c) => c.type === "fin_descuento");
  if (hasFinDescuento) {
    return FIN_DESCUENTO_OFFER;
  }

  return null;
}

const BENEFIT_CLASSIFICATIONS = new Set([
  "BONIFICACION / GRATUIDAD Fija",
  "Bono Recurrente Cargo",
]);

/**
 * "Efecto Efervescente" — al cerrar una interacción resuelta, recuerda un
 * beneficio que el cliente YA tiene en su recibo actual (dato real, no
 * inventado). Si no hay ninguno en su recibo, no se fuerza nada: se
 * devuelve null en vez de inventar un beneficio que no tiene.
 */
export function evaluateClosingReminder(
  result: DiffResult,
  resolved: boolean
): string | null {
  if (!resolved || !result.currentInvoice) return null;

  const benefit = result.currentInvoice.charges.find((c) =>
    BENEFIT_CLASSIFICATIONS.has(c.CHARGE_CODE_CLASSIFICATION)
  );
  if (!benefit) return null;

  return `Antes de cerrar: recuerda que tu plan actual ya incluye "${benefit.CHARGE_CODE_DESC}" — sácale provecho.`;
}
