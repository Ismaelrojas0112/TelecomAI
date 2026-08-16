import { NextResponse } from "next/server";
import { compareInvoices } from "@/lib/diff-engine";

type Customer = {
  customer_key: string;
  display_name: string;
  demo_phone: string;
  scenario: string;
  cause_label: string;
  variation: string;
};

// Cuentas reales verificadas contra los CSV (ver tabla en FUNCIONALIDADES.md)
// — no son inventadas, cada una produce el escenario indicado de punta a
// punta contra lib/diff-engine.ts. Nombre y teléfono demo son ilustrativos
// (PLANTA_CLIENTES.csv no trae nombre real ni teléfono utilizable, solo un
// hash), consistente con el resto del dataset sintético.
const CURATED: Omit<Customer, "variation">[] = [
  { customer_key: "104180441", display_name: "Marco T.", demo_phone: "987000001", scenario: "Reconexión", cause_label: "Cargo por reconexión" },
  { customer_key: "316624004", display_name: "Rosa H.", demo_phone: "987000002", scenario: "Reconexión", cause_label: "Cargo por reconexión" },
  { customer_key: "761895720", display_name: "Lucía V.", demo_phone: "987000003", scenario: "Prorrateo (alta nueva)", cause_label: "Prorrateo por activación" },
  { customer_key: "761979256", display_name: "Jorge P.", demo_phone: "987000004", scenario: "Prorrateo (alta nueva)", cause_label: "Prorrateo por activación" },
  { customer_key: "720710029", display_name: "Diego S.", demo_phone: "987000005", scenario: "Fin de descuento", cause_label: "Descuento vencido" },
  { customer_key: "347778600", display_name: "Elena R.", demo_phone: "987000006", scenario: "Fin de descuento", cause_label: "Descuento vencido" },
];

export async function GET() {
  const customers: Customer[] = CURATED.map((base) => {
    const result = compareInvoices(base.customer_key);
    // Las cuentas de prorrateo son altas nuevas: no hay recibo anterior, así
    // que el delta es 0 por diseño (ver lib/diff-engine.ts). Para que la
    // tarjeta del selector muestre algo real, se usa el monto del
    // prorrateo (el propio primer recibo) en vez del delta en ese caso.
    const prorrateoCause = result.causes.find((c) => c.type === "prorrateo");
    const variation = !result.hasComparison && prorrateoCause
      ? prorrateoCause.monto
      : result.delta;
    return { ...base, variation: variation.toFixed(2) };
  });
  return NextResponse.json(customers);
}
