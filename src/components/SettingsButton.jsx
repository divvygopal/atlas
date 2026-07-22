import { useEffect, useState } from 'react';
import { isMuted, setMuted, sound } from '../lib/sound.js';
import { clearBests } from '../lib/storage.js';
import { overlay } from '../lib/overlay.js';
import ConfirmDialog from './ConfirmDialog.jsx';

// Global settings, fixed to the viewport corner (shows on every screen).
// Gear opens a small panel with two icon squares — mute [1] and reset [2].
// Keyboard: 0 toggles the panel, 1 mute, 2 reset. Reset asks to confirm.
export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    if (open || resetConfirm) {
      overlay.open();
      return () => overlay.close();
    }
  }, [open, resetConfirm]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sound.select();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ',') {
        e.preventDefault();
        if (resetConfirm) return;
        setOpen((o) => !o);
      } else if (open && !resetConfirm) {
        if (e.key === '1') { e.preventDefault(); toggleMute(); }
        else if (e.key === '2') { e.preventDefault(); setOpen(false); setResetConfirm(true); }
        else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line

  const square = (label, badge, onClick, extra) => (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, background: '#EDE0C7', border: '3px solid #37131e', boxShadow: '3px 3px 0 #1a0910', cursor: 'pointer', ...extra,
      }}
    >
      {label}
      <span style={{ position: 'absolute', top: 2, right: 4, fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: 'rgba(55,19,30,.5)' }}>{badge}</span>
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
        title="Settings ( , )"
        aria-label="Settings"
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 1000, width: 42, height: 42,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, lineHeight: 1,
          background: open ? '#F2C94C' : '#C9A24B', border: '3px solid #EDE0C7', boxShadow: '3px 3px 0 #1a0910',
          padding: 0, cursor: 'pointer',
        }}
      >
        ⚙
        <span style={{ position: 'absolute', bottom: 1, right: 3, fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: 'rgba(55,19,30,.55)' }}>,</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', top: 62, right: 12, zIndex: 1000, background: '#37131e', border: '3px solid #EDE0C7', boxShadow: '4px 4px 0 #1a0910', padding: 10, display: 'flex', gap: 10 }}>
          {square(muted ? '🔇' : '🔊', '1', toggleMute)}
          {square('🗑', '2', () => { setOpen(false); setResetConfirm(true); })}
        </div>
      )}

      {resetConfirm && (
        <ConfirmDialog
          title="RESET ALL HIGH SCORES?"
          sub="every saved best goes back to zero"
          confirmLabel="RESET"
          cancelLabel="CANCEL"
          onConfirm={() => { clearBests(); sound.select(); setResetConfirm(false); }}
          onCancel={() => setResetConfirm(false)}
        />
      )}
    </>
  );
}
