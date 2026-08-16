import {
  loadFacturacion,
  loadProrrateo,
  loadReconexion,
  FacturacionRow,
  ProrrateoRow,
  ReconexionRow,
} from "./csv-loader";

export type Invoice = {
  invoiceNumber: string;
  ciclo: string;
  total: number;
  charges: FacturacionRow[];
};

export type ChargeDiff = {
  chargeCodeId: string;
  chargeCodeDesc: string;
  currentAmount: number;
  previousAmount: number;
  delta: number;
  kind: "nuevo" | "removido" | "cambiado";
};

export type Cause =
  | {
      type: "reconexion";
      monto: number;
      fechaReconexion: string;
      fechaCorte: string;
      descripcion: string;
    }
  | {
      type: "prorrateo";
      monto: number;
      fechaInicio: string;
      fechaFin: string;
      cantidadCargos: number;
    }
  | {
      type: "fin_descuento";
      monto: number;
      descripcion: string;
      chargeCodeId: string;
    }
  | { type: "cargo"; charge: ChargeDiff };

// Clasificaciones de CHARGE_CODE_CLASSIFICATION que representan un descuento
// recurrente en FACTURACION-CLIENTES.csv (visto en los datos reales).
const DISCOUNT_CLASSIFICATIONS = new Set([
  "Descuento Cargo Recurrente",
  "DESCUENTO Fija",
]);

export type DiffResult = {
  accountId: string;
  currentInvoice: Invoice | null;
  previousInvoice: Invoice | null;
  currentTotal: number;
  previousTotal: number;
  delta: number;
  /** false para cuentas nuevas (recibo actual = primer recibo, sin anterior con qué comparar). */
  hasComparison: boolean;
  causes: Cause[];
};

function toNumber(value: string | undefined): number {
  const n = parseFloat(value ?? "0");
  return Number.isNaN(n) ? 0 : n;
}

// Indexar las 297k filas de FACTURACION-CLIENTES por cuenta una sola vez,
// en vez de filtrar el array completo en cada consulta.
let facturacionByAccount: Map<string, FacturacionRow[]> | null = null;

function getFacturacionIndex(): Map<string, FacturacionRow[]> {
  if (!facturacionByAccount) {
    facturacionByAccount = new Map();
    for (const row of loadFacturacion()) {
      const key = row.FINANCIAL_ACCOUNT_KEY;
      if (!facturacionByAccount.has(key)) facturacionByAccount.set(key, []);
      facturacionByAccount.get(key)!.push(row);
    }
  }
  return facturacionByAccount;
}

let reconexionByAccountInvoice: Map<string, ReconexionRow> | null = null;

function getReconexionIndex(): Map<string, ReconexionRow> {
  if (!reconexionByAccountInvoice) {
    reconexionByAccountInvoice = new Map();
    for (const row of loadReconexion()) {
      reconexionByAccountInvoice.set(
        `${row.CuentaFinanciera}|${row.NumeroRecibo}`,
        row
      );
    }
  }
  return reconexionByAccountInvoice;
}

let prorrateoByAccountInvoice: Map<string, ProrrateoRow> | null = null;

function getProrrateoIndex(): Map<string, ProrrateoRow> {
  if (!prorrateoByAccountInvoice) {
    prorrateoByAccountInvoice = new Map();
    for (const row of loadProrrateo()) {
      prorrateoByAccountInvoice.set(
        `${row.CuentaFinanciera}|${row.NumeroRecibo}`,
        row
      );
    }
  }
  return prorrateoByAccountInvoice;
}

/** Recibo actual + hasta 5 anteriores de una cuenta, más reciente primero. */
export function getInvoicesForAccount(accountId: string): Invoice[] {
  const rows = getFacturacionIndex().get(accountId) ?? [];

  const byInvoice = new Map<string, FacturacionRow[]>();
  for (const row of rows) {
    const key = row.LEGAL_INVOICE_NUMBER;
    if (!byInvoice.has(key)) byInvoice.set(key, []);
    byInvoice.get(key)!.push(row);
  }

  const invoices: Invoice[] = Array.from(byInvoice.entries()).map(
    ([invoiceNumber, charges]) => ({
      invoiceNumber,
      ciclo: charges[0]?.ciclo ?? "",
      total: charges.reduce(
        (sum, c) => sum + toNumber(c.CHARGE_TOTAL_AMOUNT),
        0
      ),
      charges,
    })
  );

  invoices.sort((a, b) => b.ciclo.localeCompare(a.ciclo));
  return invoices.slice(0, 6);
}

function diffCharges(current: Invoice, previous: Invoice): ChargeDiff[] {
  const currentByCode = new Map<string, FacturacionRow[]>();
  for (const c of current.charges) {
    const arr = currentByCode.get(c.CHARGE_CODE_ID) ?? [];
    arr.push(c);
    currentByCode.set(c.CHARGE_CODE_ID, arr);
  }
  const previousByCode = new Map<string, FacturacionRow[]>();
  for (const c of previous.charges) {
    const arr = previousByCode.get(c.CHARGE_CODE_ID) ?? [];
    arr.push(c);
    previousByCode.set(c.CHARGE_CODE_ID, arr);
  }

  const codes = new Set([...currentByCode.keys(), ...previousByCode.keys()]);
  const diffs: ChargeDiff[] = [];

  for (const code of codes) {
    const currentRows = currentByCode.get(code) ?? [];
    const previousRows = previousByCode.get(code) ?? [];
    const currentAmount = currentRows.reduce(
      (s, r) => s + toNumber(r.CHARGE_TOTAL_AMOUNT),
      0
    );
    const previousAmount = previousRows.reduce(
      (s, r) => s + toNumber(r.CHARGE_TOTAL_AMOUNT),
      0
    );
    const delta = currentAmount - previousAmount;

    if (Math.abs(delta) < 0.01) continue;

    diffs.push({
      chargeCodeId: code,
      chargeCodeDesc:
        currentRows[0]?.CHARGE_CODE_DESC ??
        previousRows[0]?.CHARGE_CODE_DESC ??
        code,
      currentAmount,
      previousAmount,
      delta,
      kind:
        previousRows.length === 0
          ? "nuevo"
          : currentRows.length === 0
            ? "removido"
            : "cambiado",
    });
  }

  diffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return diffs;
}

/**
 * Compara el recibo actual de una cuenta contra el anterior y devuelve
 * las causas detectadas (reconexión, prorrateo, o cambios de cargo genéricos).
 * Todo acá es lectura/comparación directa de los CSV — nada se le pide al LLM.
 *
 * Ojo: reconexión y prorrateo se buscan sobre el recibo ACTUAL sin exigir
 * que exista un recibo anterior. Los prorrateos de BRAINY_PRORRATEO_ALTASV3
 * son por ALTAS (activación nueva) — por diseño esas cuentas no tienen
 * historial previo, y aun así hay que poder explicar ese primer recibo.
 */
export function compareInvoices(accountId: string): DiffResult {
  const invoices = getInvoicesForAccount(accountId);
  const [current, previous] = invoices;

  const currentTotal = current?.total ?? 0;
  const previousTotal = previous?.total ?? 0;
  const hasComparison = Boolean(current && previous);
  const delta = hasComparison ? currentTotal - previousTotal : 0;

  const causes: Cause[] = [];

  if (current) {
    // No se busca por un CHARGE_CODE fijo (hay más de uno para "reconexión",
    // ej. OC1_RECONEXION vs FRIORX_001) — la fuente de verdad de si el
    // recibo actual tuvo una reconexión es la propia tabla de reconexiones,
    // cruzada por cuenta + número de recibo.
    const reconexionRow = getReconexionIndex().get(
      `${accountId}|${current.invoiceNumber}`
    );
    if (reconexionRow) {
      causes.push({
        type: "reconexion",
        monto: toNumber(reconexionRow.Monto),
        fechaReconexion: reconexionRow.FechaReconexion,
        fechaCorte: reconexionRow.FechaCorte,
        descripcion: reconexionRow.Descripcion,
      });
    }

    const prorrateoRow = getProrrateoIndex().get(
      `${accountId}|${current.invoiceNumber}`
    );
    if (prorrateoRow) {
      causes.push({
        type: "prorrateo",
        monto: toNumber(prorrateoRow.suma_prorrateo),
        fechaInicio: prorrateoRow.fecha_inicio_minima,
        fechaFin: prorrateoRow.fecha_fin_maxima,
        cantidadCargos: toNumber(prorrateoRow.Q_cargos),
      });
    }

    if (previous) {
      const chargeDiffs = diffCharges(current, previous);
      const previousByCode = new Map(
        previous.charges.map((c) => [c.CHARGE_CODE_ID, c])
      );

      for (const d of chargeDiffs) {
        // Un descuento recurrente que desaparece del recibo actual (dejó de
        // aplicarse) se reporta como su propia causa, en vez de un "cargo"
        // genérico — mismo dato, pero identificable para el prompt y para
        // la Regla 1 de cross-selling. Se detecta por la clasificación real
        // del cargo en el recibo anterior, no por la tabla de descuentos
        // (BRAINY_DESCUENTOS_CUOTAS no tiene una llave confiable para cruzar
        // por recibo — ver PLAN-IMPLEMENTACION.md).
        const previousChargeRow = previousByCode.get(d.chargeCodeId);
        const esFinDeDescuento =
          d.kind === "removido" &&
          previousChargeRow &&
          DISCOUNT_CLASSIFICATIONS.has(previousChargeRow.CHARGE_CODE_CLASSIFICATION);

        if (esFinDeDescuento) {
          causes.push({
            type: "fin_descuento",
            monto: Math.abs(d.previousAmount),
            descripcion: d.chargeCodeDesc,
            chargeCodeId: d.chargeCodeId,
          });
        } else {
          causes.push({ type: "cargo", charge: d });
        }
      }
    }
  }

  return {
    accountId,
    currentInvoice: current ?? null,
    previousInvoice: previous ?? null,
    currentTotal,
    previousTotal,
    delta,
    hasComparison,
    causes,
  };
}
