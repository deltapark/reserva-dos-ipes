// Fotos da casa decorada: lê assets-originais/FOTOS DA CASA/FOTO <n>.webp (fora do Git) e grava
// public/images/fotos/casa-<nn>-{640,g}.webp. "g" é o tamanho original (até 1440 px de largura),
// porque as fotos chegam menores que 1920. Ordem, ambientes e medidas ficam em content/fotos.json.
// Rodar só quando entrar foto nova: `npm run images:fotos`.
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets-originais", "FOTOS DA CASA");
const OUT = path.join(ROOT, "public", "images", "fotos");
const { fotos } = JSON.parse(await readFile(path.join(ROOT, "content", "fotos.json"), "utf8"));

await mkdir(OUT, { recursive: true });
for (const f of fotos) {
  const input = await readFile(path.join(SRC, `FOTO ${f.n}.webp`));
  const id = `casa-${String(f.n).padStart(2, "0")}`;
  await sharp(input).resize({ width: 640 }).webp({ quality: 72, effort: 5 }).toFile(path.join(OUT, `${id}-640.webp`));
  await sharp(input).webp({ quality: 74, effort: 5 }).toFile(path.join(OUT, `${id}-g.webp`));
  process.stdout.write(`${id} `);
}
console.log("\nok");
