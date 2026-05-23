import type { TileColor } from './types';

export const TARGET_SEQUENCE: TileColor[] = [
  'W',
  'O',
  'N',
  'C',
  'Y',
  'P',
  'T',
  'G',
  'V',
];

export const TILE_COLORS: Record<
  TileColor,
  { hex: string; name: string; dark: string }
> = {
  P: { hex: '#EF7E9B', name: 'Pink', dark: '#D45A7A' },
  O: { hex: '#F47418', name: 'Orange', dark: '#D45E10' },
  Y: { hex: '#FFD21A', name: 'Yellow', dark: '#D4A800' },
  C: { hex: '#48D9E2', name: 'Cyan', dark: '#2AB8C4' },
  N: { hex: '#2E278D', name: 'Navy', dark: '#1E1868' },
  W: { hex: '#EFE6BC', name: 'Cream', dark: '#D4C99A' },
  T: { hex: '#E9C978', name: 'Tan', dark: '#C9A850' },
  G: { hex: '#D7D3C8', name: 'Stone', dark: '#B5B0A5' },
  V: { hex: '#6962A7', name: 'Violet', dark: '#504A88' },
};

export const CHAR_TO_COLOR: Record<string, TileColor> = {
  P: 'P',
  O: 'O',
  Y: 'Y',
  C: 'C',
  N: 'N',
  W: 'W',
  T: 'T',
  G: 'G',
  V: 'V',
};

export const BOARD_BASE = '#E9DFC8';
export const CLEARED_CELL = '#EFE6BC';
export const PAGE_BG = '#E8E0F0';
export const TRAY_BG = '#F5EDD4';

export function getColorName(color: TileColor): string {
  return TILE_COLORS[color].name;
}

export function getColorHex(color: TileColor): string {
  return TILE_COLORS[color].hex;
}

export function darkenHex(hex: string, amount = 0.15): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (n & 0xff) * (1 - amount));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}
