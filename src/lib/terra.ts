// Pontos da Terra para a introdução: uma grade de pontos com espaçamento quase igual na esfera,
// mantendo só os que caem em terra firme (mapa land-110m do Natural Earth, via world-atlas).
// Roda no build; a página recebe só a lista de pontos.
import { feature } from 'topojson-client';
import land from 'world-atlas/land-110m.json' with { type: 'json' };

type Anel = number[][];

/** Teste par-ímpar em todos os anéis: buracos (lagos, mares internos) invertem o resultado. */
function emTerra(lon: number, lat: number, aneis: Anel[]) {
  let dentro = false;
  for (const anel of aneis) {
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      const [xi, yi] = anel[i];
      const [xj, yj] = anel[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
  }
  return dentro;
}

/** Lista achatada [lat×10, lon×10, ...] dos pontos em terra, com `passo` graus entre eles. */
export function pontosDaTerra(passo = 1.6): number[] {
  const fc = feature(land, land.objects.land) as {
    features: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }[];
  };
  const aneis: Anel[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    const polis = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][];
    for (const p of polis) aneis.push(...p);
  }
  const out: number[] = [];
  for (let lat = -84; lat <= 84; lat += passo) {
    const n = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / passo));
    for (let k = 0; k < n; k++) {
      const lon = -180 + (k + 0.5) * (360 / n);
      if (emTerra(lon, lat, aneis)) out.push(Math.round(lat * 10), Math.round(lon * 10));
    }
  }
  return out;
}
