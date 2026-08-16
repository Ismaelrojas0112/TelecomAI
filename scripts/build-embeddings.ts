import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { embedText } from "../lib/gemini";

const CONCEPTS_DIR = path.join(process.cwd(), "concepts");
const OUTPUT_PATH = path.join(process.cwd(), "data", "embeddings.json");

type ConceptEmbedding = { file: string; content: string; embedding: number[] };

async function main() {
  const files = fs
    .readdirSync(CONCEPTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  console.log(`Encontrados ${files.length} archivos en concepts/`);

  const results: ConceptEmbedding[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(CONCEPTS_DIR, file), "utf8");
    process.stdout.write(`Generando embedding para ${file}... `);
    const embedding = await embedText(content);
    console.log(`ok (${embedding.length} dimensiones)`);
    results.push({ file, content, embedding });
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results));
  console.log(
    `\nListo: ${results.length} conceptos escritos en ${path.relative(process.cwd(), OUTPUT_PATH)}`
  );
}

main().catch((err) => {
  console.error("Error generando embeddings:", err);
  process.exit(1);
});
