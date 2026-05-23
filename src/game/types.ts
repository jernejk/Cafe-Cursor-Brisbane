/** Single-letter tile colour codes used on the board and in level data. */
export type TileColor = 'P' | 'O' | 'Y' | 'C' | 'N' | 'W' | 'T' | 'G' | 'V';

export type PieceCell = TileColor | null;

export type BackgroundGrid = TileColor[][];
export type PiecesGrid = PieceCell[][];
export type BoardGrid = PiecesGrid;
export type BoardCell = PieceCell;

export type BufferSlots = (TileColor | null)[];

export type CellPosition = { col: number; row: number };

export type FlyingTile = {
  id: string;
  fromCol: number;
  fromRow: number;
  toSlotIndex: number;
  color: TileColor;
  startTime: number;
  duration: number;
};

export type Particle = {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  color: string;
};

export type ShakeCell = {
  col: number;
  row: number;
  startTime: number;
};

export type BoosterType = 'wand' | 'brush' | 'magnet';

export type CollectItem = CellPosition & { color: TileColor };

export type GameSettings = {
  animationsEnabled: boolean;
  soundEnabled: boolean;
};

export type GameState = {
  background: BackgroundGrid;
  pieces: PiecesGrid;
  cols: number;
  rows: number;
  targetIndex: number;
  /** Bottom row — mixed colours waiting to be placed */
  buffer: BufferSlots;
  /** Buffer slot selected for placement onto the board */
  selectedBufferIndex: number | null;
  settings: GameSettings;
  settingsOpen: boolean;
  levelComplete: boolean;
  pendingClears: Set<string>;
  flyingTiles: FlyingTile[];
  particles: Particle[];
  shakeCell: ShakeCell | null;
  isAnimating: boolean;
};

export type GameAction =
  | { type: 'TAP_CELL'; col: number; row: number }
  | { type: 'TAP_BUFFER'; index: number }
  | { type: 'COMMIT_COLLECT'; items: CollectItem[] }
  | { type: 'COMMIT_ONE'; item: CollectItem; slotIndex: number }
  | { type: 'FINISH_ANIMATION' }
  | { type: 'SET_FLYING'; flyingTiles: FlyingTile[] }
  | { type: 'SET_PARTICLES'; particles: Particle[] }
  | { type: 'SET_SHAKE'; shakeCell: ShakeCell | null }
  | { type: 'SET_ANIMATING'; isAnimating: boolean }
  | { type: 'USE_BOOSTER'; booster: BoosterType }
  | { type: 'RESTART' }
  | { type: 'TOGGLE_ANIMATIONS' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' };
