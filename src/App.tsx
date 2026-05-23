import { useCallback, useEffect, useReducer, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { SettingsModal } from './components/SettingsModal';
import { Tray, type TrayHandle } from './components/Tray';
import { Toolbar } from './components/Toolbar';
import { getColorHex, getColorName } from './game/colors';
import { TRAY_CAPACITY } from './game/logic';
import {
  countCorrectPlacements,
  createInitialState,
  gameReducer,
  getActiveTarget,
} from './game/reducer';
import type { FlyingTile } from './game/types';
import { createParticles } from './utils/particles';
import { playPop, playReject } from './utils/sound';
import './index.css';

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const trayRef = useRef<TrayHandle>(null);
  const pendingCommitsRef = useRef<FlyingTile[]>([]);

  const targetColor = getActiveTarget(state.targetIndex);
  const targetName = getColorName(targetColor);
  const placedCount = countCorrectPlacements(
    state.background,
    state.pieces,
    targetColor,
  );

  const progressLabel = state.levelComplete
    ? 'Level Complete!'
    : state.selectedBufferIndex !== null
      ? 'Tap matching square on board'
      : `Target: ${targetName} ${placedCount}/${TRAY_CAPACITY}`;

  const handleCellTap = useCallback((col: number, row: number) => {
    dispatch({ type: 'TAP_CELL', col, row });
  }, []);

  const handleBufferTap = useCallback((index: number) => {
    dispatch({ type: 'TAP_BUFFER', index });
  }, []);

  useEffect(() => {
    pendingCommitsRef.current = [];
  }, [state.flyingTiles]);

  const handleFlyComplete = useCallback(
    (completed: FlyingTile[]) => {
      for (const fly of completed) {
        if (!pendingCommitsRef.current.some((f) => f.id === fly.id)) {
          pendingCommitsRef.current.push(fly);
        }
      }

      const last = completed[completed.length - 1];
      if (last && state.settings.soundEnabled) playPop();

      if (last) {
        const slotRect = trayRef.current?.getSlotRect(last.toSlotIndex);
        if (slotRect) {
          const cx = slotRect.left + slotRect.width / 2;
          const cy = slotRect.top + slotRect.height / 2;
          const particles = createParticles(cx, cy, getColorHex(last.color));
          dispatch({
            type: 'SET_PARTICLES',
            particles: [...state.particles, ...particles],
          });
        }
      }

      for (const fly of completed) {
        dispatch({
          type: 'COMMIT_ONE',
          item: {
            col: fly.fromCol,
            row: fly.fromRow,
            color: fly.color,
          },
          slotIndex: fly.toSlotIndex,
        });
      }

      if (pendingCommitsRef.current.length < state.flyingTiles.length) {
        return;
      }

      pendingCommitsRef.current = [];
      dispatch({ type: 'FINISH_ANIMATION' });
    },
    [
      state.flyingTiles.length,
      state.particles,
      state.settings.soundEnabled,
    ],
  );

  const handleShakeEnd = useCallback(() => {
    dispatch({ type: 'SET_SHAKE', shakeCell: null });
  }, []);

  useEffect(() => {
    if (state.shakeCell && state.settings.soundEnabled) {
      playReject();
    }
  }, [state.shakeCell, state.settings.soundEnabled]);

  return (
    <div className="app">
      <header className="header">
        <button type="button" className="header-btn" aria-label="Pause" disabled>
          <span className="pause-icon" aria-hidden />
        </button>
        <div className="progress-pill">{progressLabel}</div>
        <button
          type="button"
          className="header-btn"
          aria-label={state.settings.soundEnabled ? 'Sound on' : 'Sound off'}
          onClick={() => dispatch({ type: 'TOGGLE_SOUND' })}
        >
          <span
            className={`sound-icon${state.settings.soundEnabled ? '' : ' sound-off'}`}
            aria-hidden
          />
        </button>
      </header>

      <main className="game-main">
        <GameCanvas
          background={state.background}
          pieces={state.pieces}
          cols={state.cols}
          rows={state.rows}
          pendingClears={state.pendingClears}
          flyingTiles={state.flyingTiles}
          particles={state.particles}
          shakeCell={state.shakeCell}
          trayRef={trayRef}
          onCellTap={handleCellTap}
          onFlyComplete={handleFlyComplete}
          onParticlesUpdate={(particles) =>
            dispatch({ type: 'SET_PARTICLES', particles })
          }
          onShakeEnd={handleShakeEnd}
        />

        <Tray
          ref={trayRef}
          targetColor={targetColor}
          buffer={state.buffer}
          selectedBufferIndex={state.selectedBufferIndex}
          onBufferTap={handleBufferTap}
        />

        <Toolbar
          disabled={state.isAnimating || state.levelComplete}
          onBooster={(booster) => dispatch({ type: 'USE_BOOSTER', booster })}
          onSettings={() => dispatch({ type: 'OPEN_SETTINGS' })}
        />
      </main>

      {state.levelComplete && (
        <div className="level-complete-overlay">
          <div className="level-complete-card">
            <h2>Target Complete!</h2>
            <p>Great job! You cleared all targets.</p>
            <button
              type="button"
              className="continue-btn"
              onClick={() => dispatch({ type: 'RESTART' })}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <SettingsModal
        open={state.settingsOpen}
        animationsEnabled={state.settings.animationsEnabled}
        soundEnabled={state.settings.soundEnabled}
        onRestart={() => {
          dispatch({ type: 'RESTART' });
          dispatch({ type: 'CLOSE_SETTINGS' });
        }}
        onToggleAnimations={() => dispatch({ type: 'TOGGLE_ANIMATIONS' })}
        onToggleSound={() => dispatch({ type: 'TOGGLE_SOUND' })}
        onClose={() => dispatch({ type: 'CLOSE_SETTINGS' })}
      />
    </div>
  );
}

export default App;
