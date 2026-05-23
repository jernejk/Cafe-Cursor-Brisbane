import { forwardRef, useImperativeHandle, useRef } from 'react';
import { getColorHex } from '../game/colors';
import type { BufferSlots, TileColor } from '../game/types';
import { TRAY_CAPACITY } from '../game/logic';

export type TraySlotRect = DOMRect;

export type TrayHandle = {
  getSlotRect: (index: number) => TraySlotRect | null;
};

type TrayProps = {
  targetColor: TileColor;
  buffer: BufferSlots;
  selectedBufferIndex: number | null;
  onBufferTap: (index: number) => void;
};

function MiniTile({ color }: { color: TileColor }) {
  const hex = getColorHex(color);
  return (
    <div
      className="tray-tile"
      style={
        {
          '--tile-fill': hex,
          '--tile-dark': `color-mix(in srgb, ${hex} 75%, #000)`,
        } as React.CSSProperties
      }
    />
  );
}

export const Tray = forwardRef<TrayHandle, TrayProps>(function Tray(
  { targetColor, buffer, selectedBufferIndex, onBufferTap },
  ref,
) {
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const firstEmpty = buffer.findIndex((s) => s === null);

  useImperativeHandle(ref, () => ({
    getSlotRect(index: number) {
      const el = slotRefs.current[index];
      return el ? el.getBoundingClientRect() : null;
    },
  }));

  return (
    <div className="tray">
      <div className="tray-row tray-row-target" aria-label="Current target colour">
        {Array.from({ length: TRAY_CAPACITY }, (_, i) => (
          <div key={`t-${i}`} className="tray-slot">
            <MiniTile color={targetColor} />
          </div>
        ))}
      </div>
      <div className="tray-row tray-row-buffer" aria-label="Placement buffer">
        {buffer.map((slotColor, i) => {
          const isSelected = selectedBufferIndex === i;
          const isNext = i === firstEmpty;
          return (
            <button
              key={`b-${i}`}
              type="button"
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              className={`tray-slot tray-slot-buffer${slotColor ? ' tray-slot-filled' : ''}${isNext ? ' tray-slot-next' : ''}${isSelected ? ' tray-slot-selected' : ''}`}
              aria-label={
                slotColor
                  ? `Select ${slotColor} tile for placement`
                  : 'Empty buffer slot'
              }
              disabled={!slotColor && !isNext}
              onClick={() => onBufferTap(i)}
            >
              {slotColor && <MiniTile color={slotColor} />}
            </button>
          );
        })}
      </div>
    </div>
  );
});
