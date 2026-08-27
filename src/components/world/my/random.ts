// Deterministic PRNG (mulberry32) so the village environment looks consistent every reload
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth multi-octave pseudo-noise for 1000m rolling terrain
export function noise2D(x: number, y: number): number {
  const s1 = Math.sin(x * 0.015) * Math.cos(y * 0.015) * 12.0;
  const s2 = Math.sin(x * 0.04 + y * 0.05) * 4.5;
  const s3 = Math.sin(x * 0.1 - y * 0.08) * 1.2;
  return s1 + s2 + s3;
}

export interface ExclusionCircle {
  x: number;
  z: number;
  r: number;
}

// Scatter points inside a halfSize boundary while avoiding exclusion zones
export function scatterPoints(
  count: number,
  halfSize: number,
  exclusions: ExclusionCircle[],
  rng: () => number
): [number, number][] {
  const pts: [number, number][] = [];
  let attempts = 0;
  while (pts.length < count && attempts < count * 25) {
    attempts++;
    const x = (rng() * 2 - 1) * halfSize;
    const z = (rng() * 2 - 1) * halfSize;

    const blocked = exclusions.some((e) => {
      const dx = x - e.x;
      const dz = z - e.z;
      return dx * dx + dz * dz < e.r * e.r;
    });

    if (!blocked) {
      pts.push([x, z]);
    }
  }
  return pts;
}
