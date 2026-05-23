import { useCallback, useEffect, useRef } from 'react';
import {
  BOARD_BASE,
  TILE_COLORS,
  cellKey,
} from '../game/colors';
import type {
  BackgroundGrid,
  FlyingTile,
  Particle,
  PiecesGrid,
  ShakeCell,
  TileColor,
} from '../game/types';
import type { TrayHandle } from './Tray';

const GAP = 1.5;
const TILE_RADIUS_RATIO = 0.22;
const SHAKE_DURATION = 200;

type GameCanvasProps = {
  background: BackgroundGrid;
  pieces: PiecesGrid;
  cols: number;
  rows: number;
  pendingClears: Set<string>;
  flyingTiles: FlyingTile[];
  particles: Particle[];
  shakeCell: ShakeCell | null;
  trayRef: React.RefObject<TrayHandle | null>;
  onCellTap: (col: number, row: number) => void;
  onFlyComplete: (completed: FlyingTile[]) => void;
  onParticlesUpdate: (particles: Particle[]) => void;
  onShakeEnd: () => void;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/** Flat mosaic cell (solution artwork underneath). */
function drawBackgroundCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: TileColor,
) {
  const pad = GAP / 2;
  const tx = x + pad;
  const ty = y + pad;
  const tw = size - GAP;
  const th = size - GAP;
  const r = Math.min(tw, th) * TILE_RADIUS_RATIO * 0.85;
  const { hex } = TILE_COLORS[color];

  ctx.save();
  ctx.fillStyle = hex;
  roundRect(ctx, tx, ty, tw, th, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 90, 60, 0.15)';
  ctx.lineWidth = 0.5;
  roundRect(ctx, tx, ty, tw, th, r);
  ctx.stroke();
  ctx.restore();
}

/** Glossy bubble sitting on top of the background. */
function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: TileColor,
  shakeOffset = 0,
  alpha = 1,
) {
  const pad = GAP / 2;
  const tx = x + pad + shakeOffset;
  const ty = y + pad;
  const tw = size - GAP;
  const th = size - GAP;
  const r = Math.min(tw, th) * TILE_RADIUS_RATIO;
  const { hex, dark } = TILE_COLORS[color];

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = dark;
  roundRect(ctx, tx + 1.5, ty + 2, tw, th, r);
  ctx.fill();

  const grad = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
  grad.addColorStop(0, hex);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  roundRect(ctx, tx, ty, tw - 1, th - 1.5, r);
  ctx.fill();

  ctx.strokeStyle = 'rgba(120, 90, 60, 0.28)';
  ctx.lineWidth = 0.8;
  roundRect(ctx, tx, ty, tw - 1, th - 1.5, r);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(tx + tw * 0.28, ty + th * 0.22, tw * 0.22, th * 0.15, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFlyingBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: TileColor,
) {
  drawBubble(ctx, x - size / 2 + GAP / 2, y - size / 2 + GAP / 2, size, color);
}

export function GameCanvas({
  background,
  pieces,
  cols,
  rows,
  pendingClears,
  flyingTiles,
  particles,
  shakeCell,
  trayRef,
  onCellTap,
  onFlyComplete,
  onParticlesUpdate,
  onShakeEnd,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileSizeRef = useRef(16);
  const completedFlyRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);

  const getCellCenter = useCallback(
    (col: number, row: number, tileSize: number, rect: DOMRect) => {
      const x = rect.left + col * tileSize + tileSize / 2;
      const y = rect.top + row * tileSize + tileSize / 2;
      return { x, y };
    },
    [],
  );

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const containerWidth = container.clientWidth;
    const tileSize = Math.floor(containerWidth / cols);
    tileSizeRef.current = tileSize;

    const width = tileSize * cols;
    const height = tileSize * rows;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = BOARD_BASE;
    ctx.fillRect(0, 0, width, height);

    const now = performance.now();
    const canvasRect = canvas.getBoundingClientRect();

    const flyingFrom = new Set(
      flyingTiles.map((f) => cellKey(f.fromCol, f.fromRow)),
    );

    // Layer 1: fixed artwork
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        drawBackgroundCell(
          ctx,
          col * tileSize,
          row * tileSize,
          tileSize,
          background[row][col],
        );
      }
    }

    // Layer 2: scrambled bubbles
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const key = cellKey(col, row);
        const isPending = pendingClears.has(key);
        const isFlying = flyingFrom.has(key);

        if (isPending && isFlying) continue;

        const piece = isPending && !isFlying ? null : pieces[row][col];
        if (piece === null) continue;

        let shakeOffset = 0;
        if (shakeCell && shakeCell.col === col && shakeCell.row === row) {
          const elapsed = now - shakeCell.startTime;
          if (elapsed < SHAKE_DURATION) {
            shakeOffset =
              Math.sin(elapsed * 0.05) * 4 * (1 - elapsed / SHAKE_DURATION);
          }
        }

        drawBubble(
          ctx,
          col * tileSize,
          row * tileSize,
          tileSize,
          piece,
          shakeOffset,
        );
      }
    }

    const newlyCompleted: FlyingTile[] = [];
    for (const fly of flyingTiles) {
      const elapsed = now - fly.startTime;
      const t = Math.min(1, elapsed / fly.duration);
      const eased = easeOutCubic(t);

      const from = getCellCenter(fly.fromCol, fly.fromRow, tileSize, canvasRect);
      const slotRect = trayRef.current?.getSlotRect(fly.toSlotIndex);
      let toX = from.x;
      let toY = from.y + 80;
      if (slotRect) {
        toX = slotRect.left + slotRect.width / 2;
        toY = slotRect.top + slotRect.height / 2;
      }

      const x = from.x + (toX - from.x) * eased;
      const y = from.y + (toY - from.y) * eased;
      const flySize = tileSize * 0.85 * (1 - eased * 0.15);

      drawFlyingBubble(ctx, x, y, flySize, fly.color);

      if (t >= 1 && !completedFlyRef.current.has(fly.id)) {
        completedFlyRef.current.add(fly.id);
        newlyCompleted.push(fly);
      }
    }

    if (newlyCompleted.length > 0) {
      onFlyComplete(newlyCompleted);
    }

    const activeParticles: Particle[] = [];
    for (const p of particles) {
      const elapsed = now - p.startTime;
      if (elapsed >= p.duration) continue;
      const t = elapsed / p.duration;
      const alpha = 1 - t;
      const radius = 3 * (1 - t * 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - canvasRect.left, p.y - canvasRect.top, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      activeParticles.push(p);
    }
    if (activeParticles.length !== particles.length) {
      onParticlesUpdate(activeParticles);
    }

    if (shakeCell && now - shakeCell.startTime >= SHAKE_DURATION) {
      onShakeEnd();
    }
  }, [
    background,
    pieces,
    cols,
    rows,
    pendingClears,
    flyingTiles,
    particles,
    shakeCell,
    trayRef,
    getCellCenter,
    onFlyComplete,
    onParticlesUpdate,
    onShakeEnd,
  ]);

  useEffect(() => {
    const loop = () => {
      paint();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paint]);

  useEffect(() => {
    completedFlyRef.current = new Set();
  }, [flyingTiles]);

  const handlePointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tileSize = tileSizeRef.current;
    const col = Math.floor((clientX - rect.left) / tileSize);
    const row = Math.floor((clientY - rect.top) / tileSize);
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      onCellTap(col, row);
    }
  };

  return (
    <div ref={containerRef} className="board-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={(e) => {
          e.preventDefault();
          handlePointer(e.clientX, e.clientY);
        }}
      />
    </div>
  );
}
