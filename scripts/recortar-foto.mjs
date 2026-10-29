// Recorta o fundo branco da foto: preenche a partir das bordas tudo o que é quase branco e ligado à borda
// (o brinco e os reflexos dentro do rosto ficam), suaviza a borda e corta as sobras.
// Uso: node scripts/recortar-foto.mjs <entrada> <saida.webp>
import sharp from 'sharp';

const [entrada, saida] = process.argv.slice(2);
const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const brancura = (i) => Math.min(data[i], data[i + 1], data[i + 2]);
const fundo = new Uint8Array(w * h);
const fila = [];
const LIMIAR = 232;
for (let x = 0; x < w; x++) fila.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) fila.push(y * w, y * w + w - 1);
while (fila.length) {
  const p = fila.pop();
  if (fundo[p] || brancura(p * 4) < LIMIAR) continue;
  fundo[p] = 1;
  const x = p % w;
  if (x > 0) fila.push(p - 1);
  if (x < w - 1) fila.push(p + 1);
  if (p >= w) fila.push(p - w);
  if (p < w * (h - 1)) fila.push(p + w);
}
for (let p = 0; p < w * h; p++) {
  const i = p * 4;
  if (fundo[p]) data[i + 3] = 0;
  else {
    // Borda: pixel do sujeito vizinho do fundo fica parcialmente transparente conforme o quanto é claro.
    const viz = [p - 1, p + 1, p - w, p + w].some((q) => q >= 0 && q < w * h && fundo[q]);
    if (viz) data[i + 3] = Math.round(255 * Math.min(1, Math.max(0.25, (255 - brancura(i)) / 60)));
  }
}
await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .trim({ threshold: 0 })
  .resize({ width: 900, withoutEnlargement: true })
  .webp({ quality: 86, alphaQuality: 90 })
  .toFile(saida);
console.log('ok', saida);
