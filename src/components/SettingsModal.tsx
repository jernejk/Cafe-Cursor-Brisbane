type SettingsModalProps = {
  open: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  onRestart: () => void;
  onToggleAnimations: () => void;
  onToggleSound: () => void;
  onClose: () => void;
};

export function SettingsModal({
  open,
  animationsEnabled,
  soundEnabled,
  onRestart,
  onToggleAnimations,
  onToggleSound,
  onClose,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Settings</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <button type="button" className="modal-row" onClick={onRestart}>
          <span className="modal-row-icon restart-icon" aria-hidden />
          <span>Restart Level</span>
        </button>

        <div className="modal-row modal-row-toggle">
          <span>Animations</span>
          <button
            type="button"
            className={`toggle${animationsEnabled ? ' toggle-on' : ''}`}
            role="switch"
            aria-checked={animationsEnabled}
            onClick={onToggleAnimations}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="modal-row modal-row-toggle">
          <span>Sound</span>
          <button
            type="button"
            className={`toggle${soundEnabled ? ' toggle-on' : ''}`}
            role="switch"
            aria-checked={soundEnabled}
            onClick={onToggleSound}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <button type="button" className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
