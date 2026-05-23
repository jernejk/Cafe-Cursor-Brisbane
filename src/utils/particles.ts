import type { Particle } from '../game/types';

export function createParticles(
  x: number,
  y: number,
  color: string,
  count = 6,
): Particle[] {
  const now = performance.now();
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist = 8 + Math.random() * 12;
    return {
      id: `pt-${now}-${i}`,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      startTime: now,
      duration: 400 + Math.random() * 100,
      color,
    };
  });
}
