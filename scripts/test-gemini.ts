import { config } from "dotenv";
config({ path: ".env.local" });
import { compareInvoices } from "../lib/diff-engine";
import { generateExplanation, embedText } from "../lib/gemini";

async function main() {
  const result = compareInvoices("104180441");
  console.log("Diff engine result:", JSON.stringify(result, null, 2));

  const reconexionCause = result.causes.find((c) => c.type === "reconexion");
  const context = `
Recibo actual: ${result.currentInvoice?.invoiceNumber}, total S/.${result.currentTotal.toFixed(2)}
Recibo anterior: ${result.previousInvoice?.invoiceNumber}, total S/.${result.previousTotal.toFixed(2)}
Diferencia: S/.${result.delta.toFixed(2)}
Causa detectada: ${JSON.stringify(reconexionCause)}
`.trim();

  console.log("\n--- Contexto enviado a Gemini ---");
  console.log(context);

  console.log("\n--- Generando explicación ---");
  const explanation = await generateExplanation(
    context,
    "¿Por qué me llegó más caro este mes?"
  );
  console.log(explanation);

  console.log("\n--- Probando embeddings ---");
  const vector = await embedText("¿Qué es un prorrateo?");
  console.log("Dimensiones del embedding:", vector.length);
  console.log("Primeros 5 valores:", vector.slice(0, 5));
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
