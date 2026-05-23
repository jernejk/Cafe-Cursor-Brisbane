import { CHAR_TO_COLOR } from './colors';
import type { BoardGrid, TileColor } from './types';

/** Level 1 — 24 columns × 33 rows (solution / background artwork) */
export const LEVEL_1_ROWS: string[] = [
  'PPPPPPPPPPPPPPPOOWOWOTTO',
  'PPWPWPPPPPPPWWOOOOWWTOTO',
  'PWWCCWPPPWWCCCOOWWWWTOOT',
  'PPVWWWWWWCCCVVVVTTTTOTWW',
  'GOGWWWWCGGWCCVVVGGOOOTWW',
  'GOGWWWCGCCCWCCCGGGOOWOOT',
  'TTTTWCTCCCCCWWCTTTTTOWWO',
  'PWGGCGCCCWCCCCTCWWWTOTOO',
  'PWWWCCCCWWCCGVWCCWWWWGOO',
  'WWWCCCWWWCCCCPWWWWWWWGWO',
  'WWWCCCWWWWOOVGPWWWWWPGVO',
  'WWPCCCWWWWWVWWWCCWWPPVVT',
  'OGVPCCCPPPCCPPPPCPGVVPWW',
  'OGVPPCCGGGCCPPPPGGVGVWWW',
  'OOOVVPGGGGGTVVVVVGGOWOOO',
  'OOOOGGTTTTTTOOOTTWOOOOTT',
  'OOOOOTTWWWOOOOTWWWWOOOTO',
  'OOOTOTWWYWOOTTOOWWWWOOOO',
  'YYWTTTWYYWOOOOWWOWWWWOOO',
  'YYWOOOWWYWOOTTTWOOWWOOWO',
  'TTTWTOTTTWOOOOTOWTTOOWWW',
  'TWWTOOOOTOOOOTTOGOTOOOWW',
  'OOTOOTOOOOOOTTTONOOTOOOT',
  'YYOTOOOYYYTOTOONNNTOOWTO',
  'YYTOOYYYYYTTOTNNNNWOOTOO',
  'OWYYTYYYYWWTNVNNVWWWOOOW',
  'OYYYTYYYWWWNNVNWWWWWWOWW',
  'OOOOWOOWWVVVWWVVVWWWVWPW',
  'OOOCCTTOOWWOWWGVWVWVOTWV',
  'TTCVVVTOTTTTOOOWVVOWWOOW',
  'GGCVVVGOOOTOOOOWVVGWWWTW',
  'OGVCVVVOOOTOWWWNNNNNWWWV',
  'OOPVVVOOOOTNWWNNNNNNNWWN',
];

export type ParsedLevel = {
  background: BoardGrid;
  cols: number;
  rows: number;
};

/** Parse row strings into the fixed background mosaic (solution image). */
export function parseLevel(rows: string[]): ParsedLevel {
  if (rows.length === 0) {
    throw new Error('Level must have at least one row');
  }

  const cols = rows[0].length;
  const background: BoardGrid = [];

  for (let row = 0; row < rows.length; row++) {
    const line = rows[row];
    if (line.length !== cols) {
      throw new Error(
        `Row ${row} has length ${line.length}, expected ${cols}`,
      );
    }
    const rowCells: TileColor[] = [];
    for (let col = 0; col < cols; col++) {
      const ch = line[col];
      const color = CHAR_TO_COLOR[ch];
      if (!color) {
        throw new Error(`Unknown character "${ch}" at (${col}, ${row})`);
      }
      rowCells.push(color);
    }
    background.push(rowCells);
  }

  return { background, cols, rows: rows.length };
}

export function cloneBoard(grid: BoardGrid): BoardGrid {
  return grid.map((row) => [...row]);
}

/** Fisher–Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Create scrambled foreground bubbles: same colour multiset as the artwork,
 * but permuted so pieces usually sit on the wrong background square.
 */
export function createScrambledPieces(background: BoardGrid): BoardGrid {
  const rows = background.length;
  const cols = background[0]?.length ?? 0;
  const flat: TileColor[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      flat.push(background[row][col] as TileColor);
    }
  }

  let perm = shuffle(flat);

  // Prefer a derangement: no bubble sits on a matching background colour
  for (let attempt = 0; attempt < 200; attempt++) {
    const anyMatch = perm.some((color, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      return color === background[row][col];
    });
    if (!anyMatch) break;
    perm = shuffle(flat);
  }

  const pieces: BoardGrid = [];
  for (let row = 0; row < rows; row++) {
    const rowCells: TileColor[] = [];
    for (let col = 0; col < cols; col++) {
      rowCells.push(perm[row * cols + col]);
    }
    pieces.push(rowCells);
  }

  return pieces;
}

export const LEVEL_1 = parseLevel(LEVEL_1_ROWS);
