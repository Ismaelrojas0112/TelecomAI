import { NextResponse } from "next/server";
import {
  compareInvoices,
  getInvoicesForAccount,
  type Cause,
} from "@/lib/diff-engine";

type AnalysisEvidence = { table: string; record_id: string; field: string; value: string };
type AnalysisCause = {
  id: string;
  tipo: string;
  impacto: string;
  explicacion: string;
  evidencia: AnalysisEvidence[];
};

function money(n: number): string {
  return n.toFixed(2);
}

function formatCiclo(ciclo: string): string {
  if (ciclo.length !== 8) return ciclo;
  return `${ciclo.slice(0, 4)}-${ciclo.slice(4, 6)}-${ciclo.slice(6, 8)}`;
}

function causeToAnalysisEntry(
  cause: Cause,
  index: number,
  cicloActual: string
): AnalysisCause {
  if (cause.type === "reconexion") {
    return {
      id: `reconexion-${index}`,
      tipo: "reconexion",
      impacto: money(cause.monto),
      explicacion: `Se reconectó el servicio el ${cause.fechaReconexion} tras una suspensión por falta de pago (corte: ${cause.fechaCorte}). Este cargo cubre la reactivación.`,
      evidencia: [
        { table: "BRAINY_RECONEXIONESV3.csv", record_id: cicloActual, field: "Monto", value: money(cause.monto) },
        { table: "BRAINY_RECONEXIONESV3.csv", record_id: cicloActual, field: "FechaReconexion", value: cause.fechaReconexion },
      ],
    };
  }
  if (cause.type === "prorrateo") {
    return {
      id: `prorrateo-${index}`,
      tipo: "prorrateo",
      impacto: money(cause.monto),
      explicacion: `Cobro proporcional a los días de servicio entre ${cause.fechaInicio} y ${cause.fechaFin}, por activarse el servicio a mitad de ciclo.`,
      evidencia: [
        { table: "BRAINY_PRORRATEO_ALTASV3.csv", record_id: cicloActual, field: "suma_prorrateo", value: money(cause.monto) },
      ],
    };
  }
  if (cause.type === "fin_descuento") {
    return {
      id: `fin_descuento-${index}`,
      tipo: "fin_descuento",
      impacto: money(cause.monto),
      explicacion: `Terminó el beneficio "${cause.descripcion}", por eso el recibo vuelve al monto normal del plan.`,
      evidencia: [
        { table: "FACTURACION-CLIENTES.csv", record_id: cicloActual, field: "CHARGE_CODE_ID", value: cause.chargeCodeId },
      ],
    };
  }
  return {
    id: `cargo-${index}`,
    tipo: "cargo",
    impacto: money(cause.charge.delta),
    explicacion: `Cambio en el cargo "${cause.charge.chargeCodeDesc}".`,
    evidencia: [
      { table: "FACTURACION-CLIENTES.csv", record_id: cicloActual, field: "CHARGE_CODE_ID", value: cause.charge.chargeCodeId },
    ],
  };
}

export async function GET(request: Request) {
  const customerKey = new URL(request.url).searchParams.get("customer_key");
  if (!customerKey) {
    return NextResponse.json({ detail: "customer_key requerido" }, { status: 422 });
  }

  const result = compareInvoices(customerKey);
  if (!result.currentInvoice) {
    return NextResponse.json({ detail: "Cliente no encontrado" }, { status: 404 });
  }

  const invoices = getInvoicesForAccount(customerKey);
  const tendencia = [...invoices].reverse().map((invoice) => ({
    ciclo: formatCiclo(invoice.ciclo),
    period_end: invoice.charges[0]?.PERIOD_END_DATE ?? "",
    importe_total: money(invoice.total),
  }));

  const cicloActual = formatCiclo(result.currentInvoice.ciclo);

  // Prioriza las causas con nombre (reconexión/prorrateo/fin_descuento) y
  // completa con los cambios de cargo genéricos más grandes, hasta 6 en
  // total, para que la grilla de causas del dashboard no se sature.
  const priorityCauses = result.causes.filter((c) => c.type !== "cargo");
  const genericCauses = result.causes
    .filter((c) => c.type === "cargo")
    .sort((a, b) =>
      a.type === "cargo" && b.type === "cargo"
        ? Math.abs(b.charge.delta) - Math.abs(a.charge.delta)
        : 0
    );
  const causas = [...priorityCauses, ...genericCauses]
    .slice(0, 6)
    .map((c, index) => causeToAnalysisEntry(c, index, cicloActual));

  const porcentaje =
    result.hasComparison && result.previousTotal !== 0
      ? ((result.delta / result.previousTotal) * 100).toFixed(1)
      : null;

  // Altas nuevas (prorrateo) no tienen recibo anterior, así que el delta es
  // 0 por diseño — se usa el monto del prorrateo para que el titular del
  // dashboard ("Tu recibo subió S/.X") muestre una cifra real.
  const prorrateoCause = result.causes.find((c) => c.type === "prorrateo");
  const variacion =
    !result.hasComparison && prorrateoCause ? prorrateoCause.monto : result.delta;

  return NextResponse.json({
    cliente: customerKey,
    numero_recibo: result.currentInvoice.invoiceNumber,
    ciclo_actual: cicloActual,
    recibo_actual: money(result.currentTotal),
    recibo_anterior: result.hasComparison ? money(result.previousTotal) : null,
    variacion: money(variacion),
    variacion_porcentaje: porcentaje,
    reconciliado: causas.length > 0 || Math.abs(result.delta) < 0.01,
    tendencia,
    causas,
  });
}
