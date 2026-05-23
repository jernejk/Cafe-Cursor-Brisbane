import { TARGET_SEQUENCE, cellKey } from './colors';
import { cloneBoard } from './level';
import type {
  BackgroundGrid,
  BoosterType,
  CellPosition,
  CollectItem,
  PiecesGrid,
  TileColor,
} from './types';

const TRAY_CAPACITY = 12;

export type BufferSlots = (TileColor | null)[];

export function createEmptyBuffer(): BufferSlots {
  return Array(TRAY_CAPACITY).fill(null);
}

export function getActiveTarget(targetIndex: number): TileColor {
  return TARGET_SEQUENCE[Math.min(targetIndex, TARGET_SEQUENCE.length - 1)];
}

export function countBufferUsed(buffer: BufferSlots): number {
  return buffer.filter((s) => s !== null).length;
}

export function firstEmptyBufferIndex(buffer: BufferSlots): number {
  return buffer.findIndex((s) => s === null);
}

export function bufferHasSpace(buffer: BufferSlots, needed = 1): boolean {
  return countBufferUsed(buffer) + needed <= TRAY_CAPACITY;
}

export function addToBuffer(
  buffer: BufferSlots,
  color: TileColor,
  slotIndex?: number,
): BufferSlots {
  const idx = slotIndex ?? firstEmptyBufferIndex(buffer);
  if (idx < 0 || idx >= TRAY_CAPACITY) return buffer;
  const next = [...buffer] as BufferSlots;
  next[idx] = color;
  return next;
}

export function removeFromBuffer(
  buffer: BufferSlots,
  index: number,
): BufferSlots {
  const next = [...buffer] as BufferSlots;
  next[index] = null;
  return next;
}

/** Cells where a bubble is correctly placed on matching background. */
export function countCorrectPlacements(
  background: BackgroundGrid,
  pieces: PiecesGrid,
  color: TileColor,
): number {
  let count = 0;
  for (let row = 0; row < pieces.length; row++) {
    for (let col = 0; col < pieces[row].length; col++) {
      if (
        background[row][col] === color &&
        pieces[row][col] === color
      ) {
        count++;
      }
    }
  }
  return count;
}

export function countRemainingTargetPieces(
  pieces: PiecesGrid,
  target: TileColor,
): number {
  let count = 0;
  for (const row of pieces) {
    for (const cell of row) {
      if (cell === target) count++;
    }
  }
  return count;
}

export function canPlacePiece(
  background: BackgroundGrid,
  pieces: PiecesGrid,
  col: number,
  row: number,
  color: TileColor,
): boolean {
  const rows = pieces.length;
  const cols = pieces[0]?.length ?? 0;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  if (background[row][col] !== color) return false;
  if (pieces[row][col] !== null) return false;
  return true;
}

export function placePiece(
  pieces: PiecesGrid,
  col: number,
  row: number,
  color: TileColor,
): PiecesGrid {
  const next = cloneBoard(pieces);
  next[row][col] = color;
  return next;
}

export function findCluster(
  pieces: PiecesGrid,
  col: number,
  row: number,
  color: TileColor,
  pendingClears: Set<string> = new Set(),
): CellPosition[] {
  const rows = pieces.length;
  const cols = pieces[0]?.length ?? 0;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return [];
  if (pieces[row][col] !== color) return [];
  if (pendingClears.has(cellKey(col, row))) return [];

  const visited = new Set<string>();
  const cluster: CellPosition[] = [];
  const stack: CellPosition[] = [{ col, row }];

  while (stack.length > 0) {
    const { col: c, row: r } = stack.pop()!;
    const key = cellKey(c, r);
    if (visited.has(key)) continue;
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    if (pieces[r][c] !== color) continue;
    if (pendingClears.has(key)) continue;

    visited.add(key);
    cluster.push({ col: c, row: r });

    stack.push(
      { col: c + 1, row: r },
      { col: c - 1, row: r },
      { col: c, row: r + 1 },
      { col: c, row: r - 1 },
    );
  }

  return cluster;
}

/** Pick any bubble from the board into the buffer (cluster tap). */
export function resolveCollect(
  pieces: PiecesGrid,
  col: number,
  row: number,
  buffer: BufferSlots,
  pendingClears: Set<string>,
): { type: 'collect'; items: CollectItem[] } | { type: 'reject' } {
  const rows = pieces.length;
  const cols = pieces[0]?.length ?? 0;
  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return { type: 'reject' };
  }

  const piece = pieces[row][col];
  if (piece === null || pendingClears.has(cellKey(col, row))) {
    return { type: 'reject' };
  }

  const cluster = findCluster(pieces, col, row, piece, pendingClears);
  const capacity = TRAY_CAPACITY - countBufferUsed(buffer);
  const items: CollectItem[] = cluster
    .slice(0, capacity)
    .map((pos) => ({ ...pos, color: piece }));

  if (items.length === 0) {
    return { type: 'reject' };
  }

  return { type: 'collect', items };
}

/** Advance when 12 target-colour tiles are correctly placed on the board. */
export function shouldAdvanceTarget(
  background: BackgroundGrid,
  pieces: PiecesGrid,
  target: TileColor,
): boolean {
  return countCorrectPlacements(background, pieces, target) >= TRAY_CAPACITY;
}

export function removePieces(
  pieces: PiecesGrid,
  items: CollectItem[],
): PiecesGrid {
  const next = cloneBoard(pieces);
  for (const { col, row } of items) {
    next[row][col] = null;
  }
  return next;
}

export function recolorPiece(
  pieces: PiecesGrid,
  col: number,
  row: number,
  color: TileColor,
): PiecesGrid {
  const next = cloneBoard(pieces);
  if (next[row][col] !== null) {
    next[row][col] = color;
  }
  return next;
}

export function findAllPiecesOfColor(
  pieces: PiecesGrid,
  color: TileColor,
  pendingClears: Set<string>,
): CellPosition[] {
  const result: CellPosition[] = [];
  for (let row = 0; row < pieces.length; row++) {
    for (let col = 0; col < pieces[row].length; col++) {
      if (pieces[row][col] === color && !pendingClears.has(cellKey(col, row))) {
        result.push({ col, row });
      }
    }
  }
  return result;
}

export function findRandomPiece(
  pieces: PiecesGrid,
): CellPosition | null {
  const candidates: CellPosition[] = [];
  for (let row = 0; row < pieces.length; row++) {
    for (let col = 0; col < pieces[row].length; col++) {
      if (pieces[row][col] !== null) {
        candidates.push({ col, row });
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function findRandomNonTargetPiece(
  pieces: PiecesGrid,
  target: TileColor,
): CellPosition | null {
  const candidates: CellPosition[] = [];
  for (let row = 0; row < pieces.length; row++) {
    for (let col = 0; col < pieces[row].length; col++) {
      const cell = pieces[row][col];
      if (cell !== null && cell !== target) {
        candidates.push({ col, row });
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function findRandomCluster(
  pieces: PiecesGrid,
  pendingClears: Set<string>,
): CellPosition[] {
  const pos = findRandomPiece(pieces);
  if (!pos) return [];
  const color = pieces[pos.row][pos.col]!;
  return findCluster(pieces, pos.col, pos.row, color, pendingClears);
}

export function applyBooster(
  pieces: PiecesGrid,
  booster: BoosterType,
  target: TileColor,
  buffer: BufferSlots,
  pendingClears: Set<string>,
):
  | { type: 'collect'; items: CollectItem[] }
  | { type: 'recolor'; col: number; row: number; color: TileColor }
  | { type: 'noop' } {
  const capacity = TRAY_CAPACITY - countBufferUsed(buffer);

  switch (booster) {
    case 'wand': {
      const cluster = findRandomCluster(pieces, pendingClears);
      if (cluster.length === 0) return { type: 'noop' };
      const color = pieces[cluster[0].row][cluster[0].col]!;
      const items: CollectItem[] = cluster
        .slice(0, capacity)
        .map((pos) => ({ ...pos, color }));
      return { type: 'collect', items };
    }
    case 'brush': {
      const pos = findRandomNonTargetPiece(pieces, target);
      if (!pos) return { type: 'noop' };
      return { type: 'recolor', col: pos.col, row: pos.row, color: target };
    }
    case 'magnet': {
      const all = findAllPiecesOfColor(pieces, target, pendingClears);
      const items: CollectItem[] = all
        .slice(0, capacity)
        .map((pos) => ({ ...pos, color: target }));
      if (items.length === 0) return { type: 'noop' };
      return { type: 'collect', items };
    }
    default:
      return { type: 'noop' };
  }
}

export { TRAY_CAPACITY };
