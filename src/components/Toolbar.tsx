import type { BoosterType } from '../game/types';

type ToolbarProps = {
  onBooster: (booster: BoosterType) => void;
  onSettings: () => void;
  disabled?: boolean;
};

function WandIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="8" y="28" width="8" height="14" rx="2" fill="#8B5CF6" />
      <path
        d="M12 28 L32 8"
        stroke="#7C3AED"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <polygon points="32,8 40,4 36,12" fill="#FFD21A" />
      <circle cx="36" cy="10" r="3" fill="#FFF8DC" opacity="0.8" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="10" y="6" width="10" height="22" rx="3" fill="#48D9E2" />
      <ellipse cx="15" cy="32" rx="12" ry="8" fill="#EFE6BC" />
      <ellipse cx="15" cy="30" rx="10" ry="5" fill="#D7D3C8" />
    </svg>
  );
}

function MagnetIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path
        d="M10 20 Q10 8 24 8 Q38 8 38 20 L38 28 L30 28 L30 20 Q30 14 24 14 Q18 14 18 20 L18 28 L10 28 Z"
        fill="#EF4444"
      />
      <path
        d="M10 28 L10 36 Q10 42 18 42 L18 34 Q14 34 14 30 L14 28 Z"
        fill="#3B82F6"
      />
      <path
        d="M38 28 L38 36 Q38 42 30 42 L30 34 Q34 34 34 30 L34 28 Z"
        fill="#3B82F6"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="8" fill="#8B7355" />
      <path
        d="M24 6 L26 14 L22 14 Z M24 42 L26 34 L22 34 Z M6 24 L14 22 L14 26 Z M42 24 L34 22 L34 26 Z
           M11 11 L17 17 L14 20 Z M37 37 L31 31 L34 28 Z M37 11 L31 17 L34 20 Z M11 37 L17 31 L14 28 Z"
        fill="#A08060"
      />
    </svg>
  );
}

type BtnProps = {
  label: string;
  onClick: () => void;
  showBadge?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolButton({ label, onClick, showBadge, disabled, children }: BtnProps) {
  return (
    <button
      type="button"
      className={`toolbar-btn${showBadge ? ' toolbar-btn-badge' : ''}`}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      {showBadge && <span className="ad-badge" aria-hidden />}
    </button>
  );
}

export function Toolbar({ onBooster, onSettings, disabled }: ToolbarProps) {
  return (
    <div className="toolbar">
      <ToolButton
        label="Magic wand"
        showBadge
        disabled={disabled}
        onClick={() => onBooster('wand')}
      >
        <WandIcon />
      </ToolButton>
      <ToolButton
        label="Brush"
        showBadge
        disabled={disabled}
        onClick={() => onBooster('brush')}
      >
        <BrushIcon />
      </ToolButton>
      <ToolButton
        label="Magnet"
        showBadge
        disabled={disabled}
        onClick={() => onBooster('magnet')}
      >
        <MagnetIcon />
      </ToolButton>
      <ToolButton label="Settings" disabled={disabled} onClick={onSettings}>
        <GearIcon />
      </ToolButton>
    </div>
  );
}
