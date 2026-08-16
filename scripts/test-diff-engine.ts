import { loadProrrateo, loadReconexion } from "../lib/csv-loader";
import { compareInvoices } from "../lib/diff-engine";

function printResult(label: string, accountId: string) {
  console.log(`\n=== ${label} — cuenta ${accountId} ===`);
  const result = compareInvoices(accountId);
  console.log("Recibo actual:", result.currentInvoice?.invoiceNumber, result.currentInvoice?.ciclo, "total:", result.currentTotal.toFixed(2));
  console.log("Recibo anterior:", result.previousInvoice?.invoiceNumber, result.previousInvoice?.ciclo, "total:", result.previousTotal.toFixed(2));
  console.log("Delta:", result.delta.toFixed(2));
  console.log("Causas detectadas:", result.causes.length);
  for (const cause of result.causes.slice(0, 5)) {
    console.log(" -", JSON.stringify(cause));
  }
}

// Cuenta de reconexion ya inspeccionada manualmente antes
printResult("Reconexion (conocida)", "741255038");

// Tomar 3 cuentas mas al azar de cada escenario para validar en general
const reconexionAccounts = Array.from(new Set(loadReconexion().map((r) => r.CuentaFinanciera))).slice(0, 3);
for (const acc of reconexionAccounts) {
  printResult("Reconexion (muestra)", acc);
}

const prorrateoAccounts = Array.from(new Set(loadProrrateo().map((r) => r.CuentaFinanciera))).slice(0, 3);
for (const acc of prorrateoAccounts) {
  printResult("Prorrateo (muestra)", acc);
}
