// Regiões de identificação nas capturas originais. O desfoque fica no arquivo,
// inclusive nas versões otimizadas pelo Astro, e não apenas em uma camada CSS.
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const captures = {
  'kairo-painel-hoje.webp': [
    [45, 25, 225, 58], [48, 512, 66, 34], [48, 772, 66, 35],
    [274, 1064, 65, 33], [48, 1112, 700, 13],
  ],
  'kairo-painel-retornos.webp': [
    [45, 25, 225, 58],
    [82, 669, 210, 34], [82, 762, 210, 34],
    [82, 880, 210, 34], [82, 1010, 210, 34],
    [658, 595, 240, 35], [658, 713, 240, 35], [658, 831, 240, 35],
    [1233, 595, 230, 35], [1233, 713, 230, 35],
  ],
  'kairo-cliente-servicos.webp': [
    [30, 160, 635, 135], [30, 315, 710, 95], [30, 450, 390, 55],
  ],
  'kairo-cliente-pente.webp': [[285, 453, 95, 40]],
};

for (const [file, regions] of Object.entries(captures)) {
  const path = new URL(`../src/assets/${file}`, import.meta.url);
  const source = await readFile(path);
  const overlays = await Promise.all(regions.map(async ([left, top, width, height]) => ({
    left, top,
    input: await sharp(source).extract({ left, top, width, height }).blur(16).toBuffer(),
  })));
  await writeFile(path, await sharp(source).composite(overlays).webp({ quality: 90 }).toBuffer());
  console.log(`Identificações borradas: ${file}`);
}
