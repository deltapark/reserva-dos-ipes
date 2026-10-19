// Prepara as plantas humanizadas: corta a tarja preta do render e gera webp em 3 larguras.
// Entrada: assets-originais/PLANTAS/*.webp (1920x1080 com moldura preta, fora do Git).
// Saída: public/images/plantas-web/<slug>-{900,1500,2200}.webp + plantas.json (proporção de cada uma).
// Os dois renders da mesma casa (com e sem sol) são cortados no MESMO quadro: assim a troca não dá pulo.
// Rodar de novo só quando entrar planta nova: `node scripts/plantas.mjs`.
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets-originais", "PLANTAS");
const OUT = path.join(ROOT, "public", "images", "plantas-web");
const WIDTHS = [900, 1500, 2200];

// "CASA TIPO 1 (opção 2).webp" -> "casa-tipo-1-sol"
const slug = (f) =>
  f
    .replace(/\.webp$/i, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(opcao 2\)/, "sol")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Retângulo do desenho: a moldura do render é preta, então basta achar o primeiro pixel aceso. */
async function caixa(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const aceso = (x, y) => data[y * W + x] > 18;
  const linha = (y) => { for (let x = 0; x < W; x++) if (aceso(x, y)) return true; return false; };
  const coluna = (x) => { for (let y = 0; y < H; y++) if (aceso(x, y)) return true; return false; };
  let t = 0, b = H - 1, l = 0, r = W - 1;
  while (t < H && !linha(t)) t++;
  while (b > t && !linha(b)) b--;
  while (l < W && !coluna(l)) l++;
  while (r > l && !coluna(r)) r--;
  return { l, t, r, b };
}

const arquivos = (await readdir(SRC)).filter((n) => /\.webp$/i.test(n));

// mede todas e junta as caixas dos pares (casa-tipo-1 + casa-tipo-1-sol)
const medidas = new Map();
for (const f of arquivos) medidas.set(f, await caixa(path.join(SRC, f)));
const uniao = new Map();
for (const f of arquivos) {
  const base = slug(f).replace(/-sol$/, "");
  const c = medidas.get(f);
  const u = uniao.get(base);
  uniao.set(base, u ? { l: Math.min(u.l, c.l), t: Math.min(u.t, c.t), r: Math.max(u.r, c.r), b: Math.max(u.b, c.b) } : c);
}

await mkdir(OUT, { recursive: true });
const meta = {};
for (const f of arquivos) {
  const name = slug(f);
  const { l, t, r, b } = uniao.get(name.replace(/-sol$/, ""));
  const w = r - l + 1;
  const h = b - t + 1;
  const buf = await sharp(path.join(SRC, f)).extract({ left: l, top: t, width: w, height: h }).toBuffer();
  meta[name] = { w, h, ratio: +(w / h).toFixed(4) };
  for (const lg of WIDTHS) {
    if (lg > w * 1.3) continue;
    await sharp(buf).resize(lg).webp({ quality: 82, effort: 5 }).toFile(path.join(OUT, `${name}-${lg}.webp`));
  }
  process.stdout.write(`${name} ${w}x${h}\n`);
}
await writeFile(path.join(OUT, "plantas.json"), JSON.stringify(meta, null, 2));
console.log("ok");
