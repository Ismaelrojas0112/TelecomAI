import { loadProrrateo, loadReconexion } from "../lib/csv-loader";
import { getInvoicesForAccount, compareInvoices } from "../lib/diff-engine";

function findGoodAccounts(
  label: string,
  rows: { CuentaFinanciera: string; NumeroRecibo: string }[],
  wantCauseType: "reconexion" | "prorrateo",
  limit: number,
  requirePrevious: boolean
) {
  const found: string[] = [];
  const foundSet = new Set<string>();

  for (const row of rows) {
    const accountId = row.CuentaFinanciera;
    if (foundSet.has(accountId)) continue;

    const invoices = getInvoicesForAccount(accountId);
    const current = invoices[0];
    if (!current) continue;

    // Solo nos sirve si el evento cae justo en el recibo MAS RECIENTE de la cuenta
    if (current.invoiceNumber !== row.NumeroRecibo) continue;
    if (requirePrevious && invoices.length < 2) continue;

    const result = compareInvoices(accountId);
    const hasCause = result.causes.some((c) => c.type === wantCauseType);
    if (!hasCause) continue;

    found.push(accountId);
    foundSet.add(accountId);
    if (found.length >= limit) break;
  }

  console.log(`\n=== ${label}: ${found.length} cuentas encontradas ===`);
  for (const accountId of found) {
    const result = compareInvoices(accountId);
    console.log(
      `Cuenta ${accountId} | hasComparison=${result.hasComparison} | actual ${result.currentInvoice?.invoiceNumber} (${result.currentTotal.toFixed(2)}) vs anterior ${result.previousInvoice?.invoiceNumber ?? "N/A"} (${result.previousTotal.toFixed(2)}) | delta ${result.delta.toFixed(2)}`
    );
    for (const cause of result.causes) {
      if (cause.type === wantCauseType) {
        console.log("   causa:", JSON.stringify(cause));
      }
    }
  }
  return found;
}

findGoodAccounts("Reconexion", loadReconexion(), "reconexion", 5, true);
findGoodAccounts("Prorrateo (con historial, ideal)", loadProrrateo(), "prorrateo", 5, true);
findGoodAccounts("Prorrateo (primer recibo, sin historial)", loadProrrateo(), "prorrateo", 5, false);
