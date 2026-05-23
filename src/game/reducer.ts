import { cellKey, getColorName, TARGET_SEQUENCE } from './colors';
import { LEVEL_1, cloneBoard, createScrambledPieces } from './level';
import {
  TRAY_CAPACITY,
  addToBuffer,
  applyBooster,
  canPlacePiece,
  countCorrectPlacements,
  createEmptyBuffer,
  firstEmptyBufferIndex,
  getActiveTarget,
  placePiece,
  recolorPiece,
  removeFromBuffer,
  removePieces,
  resolveCollect,
  shouldAdvanceTarget,
} from './logic';
import type { CollectItem, FlyingTile, GameAction, GameState } from './types';

export function createInitialState(): GameState {
  const { background, cols, rows } = LEVEL_1;
  return {
    background: cloneBoard(background) as GameState['background'],
    pieces: createScrambledPieces(background),
    cols,
    rows,
    targetIndex: 0,
    buffer: createEmptyBuffer(),
    selectedBufferIndex: null,
    settings: { animationsEnabled: true, soundEnabled: true },
    settingsOpen: false,
    levelComplete: false,
    pendingClears: new Set(),
    flyingTiles: [],
    particles: [],
    shakeCell: null,
    isAnimating: false,
  };
}

let flyIdCounter = 0;
function nextFlyId(): string {
  return `fly-${++flyIdCounter}`;
}

export function createFlyingTiles(
  items: CollectItem[],
  buffer: GameState['buffer'],
  startTime: number,
  staggerMs = 70,
): FlyingTile[] {
  let slot = firstEmptyBufferIndex(buffer);
  if (slot < 0) slot = TRAY_CAPACITY;

  return items.map((item, i) => ({
    id: nextFlyId(),
    fromCol: item.col,
    fromRow: item.row,
    toSlotIndex: slot + i,
    color: item.color,
    startTime: startTime + i * staggerMs,
    duration: 380,
  }));
}

function advanceTarget(state: GameState): Partial<GameState> {
  const nextIndex = state.targetIndex + 1;
  if (nextIndex >= TARGET_SEQUENCE.length) {
    return {
      targetIndex: nextIndex,
      levelComplete: true,
      selectedBufferIndex: null,
    };
  }
  return {
    targetIndex: nextIndex,
    levelComplete: false,
    selectedBufferIndex: null,
  };
}

function checkAdvance(state: GameState): Partial<GameState> {
  const target = getActiveTarget(state.targetIndex);
  if (shouldAdvanceTarget(state.background, state.pieces, target)) {
    return advanceTarget(state);
  }
  return {};
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TAP_BUFFER': {
      if (state.isAnimating || state.levelComplete) return state;
      const index = action.index;
      if (state.buffer[index] === null) {
        return { ...state, selectedBufferIndex: null };
      }
      return {
        ...state,
        selectedBufferIndex:
          state.selectedBufferIndex === index ? null : index,
      };
    }

    case 'TAP_CELL': {
      if (state.isAnimating || state.levelComplete) return state;

      // Place from buffer onto matching background cell
      if (state.selectedBufferIndex !== null) {
        const color = state.buffer[state.selectedBufferIndex];
        if (!color) {
          return { ...state, selectedBufferIndex: null };
        }

        if (
          canPlacePiece(
            state.background,
            state.pieces,
            action.col,
            action.row,
            color,
          )
        ) {
          const pieces = placePiece(
            state.pieces,
            action.col,
            action.row,
            color,
          );
          const buffer = removeFromBuffer(
            state.buffer,
            state.selectedBufferIndex,
          );
          const next = {
            ...state,
            pieces,
            buffer,
            selectedBufferIndex: null,
            shakeCell: null,
          };
          return { ...next, ...checkAdvance(next) };
        }

        return {
          ...state,
          shakeCell: {
            col: action.col,
            row: action.row,
            startTime: performance.now(),
          },
        };
      }

      // Collect any bubble into buffer
      const result = resolveCollect(
        state.pieces,
        action.col,
        action.row,
        state.buffer,
        state.pendingClears,
      );

      if (result.type === 'reject') {
        return {
          ...state,
          shakeCell: {
            col: action.col,
            row: action.row,
            startTime: performance.now(),
          },
        };
      }

      if (!state.settings.animationsEnabled) {
        const pieces = removePieces(state.pieces, result.items);
        let buffer = state.buffer;
        for (const item of result.items) {
          buffer = addToBuffer(buffer, item.color);
        }
        const next = { ...state, pieces, buffer, shakeCell: null };
        return { ...next, ...checkAdvance(next) };
      }

      const flyingTiles = createFlyingTiles(
        result.items,
        state.buffer,
        performance.now(),
      );
      const pendingClears = new Set(state.pendingClears);
      for (const item of result.items) {
        pendingClears.add(cellKey(item.col, item.row));
      }
      return {
        ...state,
        pendingClears,
        flyingTiles,
        isAnimating: true,
        shakeCell: null,
      };
    }

    case 'COMMIT_ONE': {
      const { item, slotIndex } = action;
      const pieces = removePieces(state.pieces, [item]);
      const pendingClears = new Set(state.pendingClears);
      pendingClears.delete(cellKey(item.col, item.row));

      const buffer = addToBuffer(state.buffer, item.color, slotIndex);
      const next = {
        ...state,
        pieces,
        pendingClears,
        buffer,
      };
      return { ...next, ...checkAdvance(next) };
    }

    case 'FINISH_ANIMATION':
      return {
        ...state,
        flyingTiles: [],
        isAnimating: false,
      };

    case 'COMMIT_COLLECT': {
      const items = action.items;
      if (items.length === 0) return state;

      let pieces = state.pieces;
      let buffer = state.buffer;
      const pendingClears = new Set(state.pendingClears);
      for (const item of items) {
        pieces = removePieces(pieces, [item]);
        pendingClears.delete(cellKey(item.col, item.row));
        buffer = addToBuffer(buffer, item.color);
      }

      const next = {
        ...state,
        pieces,
        pendingClears,
        buffer,
        flyingTiles: [],
        isAnimating: false,
      };
      return { ...next, ...checkAdvance(next) };
    }

    case 'SET_FLYING':
      return { ...state, flyingTiles: action.flyingTiles };

    case 'SET_PARTICLES':
      return { ...state, particles: action.particles };

    case 'SET_SHAKE':
      return { ...state, shakeCell: action.shakeCell };

    case 'SET_ANIMATING':
      return { ...state, isAnimating: action.isAnimating };

    case 'USE_BOOSTER': {
      if (state.isAnimating || state.levelComplete) return state;
      const target = getActiveTarget(state.targetIndex);
      const result = applyBooster(
        state.pieces,
        action.booster,
        target,
        state.buffer,
        state.pendingClears,
      );

      if (result.type === 'noop') return state;

      if (result.type === 'recolor') {
        return {
          ...state,
          pieces: recolorPiece(
            state.pieces,
            result.col,
            result.row,
            result.color,
          ),
        };
      }

      if (!state.settings.animationsEnabled) {
        const pieces = removePieces(state.pieces, result.items);
        let buffer = state.buffer;
        for (const item of result.items) {
          buffer = addToBuffer(buffer, item.color);
        }
        const next = { ...state, pieces, buffer };
        return { ...next, ...checkAdvance(next) };
      }

      const flyingTiles = createFlyingTiles(
        result.items,
        state.buffer,
        performance.now(),
        action.booster === 'magnet' ? 40 : 70,
      );
      const pendingClears = new Set(state.pendingClears);
      for (const item of result.items) {
        pendingClears.add(cellKey(item.col, item.row));
      }
      return {
        ...state,
        pendingClears,
        flyingTiles,
        isAnimating: true,
      };
    }

    case 'RESTART':
      return { ...createInitialState(), settings: state.settings };

    case 'TOGGLE_ANIMATIONS':
      return {
        ...state,
        settings: {
          ...state.settings,
          animationsEnabled: !state.settings.animationsEnabled,
        },
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        settings: {
          ...state.settings,
          soundEnabled: !state.settings.soundEnabled,
        },
      };

    case 'OPEN_SETTINGS':
      return { ...state, settingsOpen: true };

    case 'CLOSE_SETTINGS':
      return { ...state, settingsOpen: false };

    default:
      return state;
  }
}

export { TRAY_CAPACITY, getColorName, getActiveTarget, countCorrectPlacements };
