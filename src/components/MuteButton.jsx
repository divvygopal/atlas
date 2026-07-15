import { useState } from 'react';
import { isMuted, setMuted } from '../lib/sound.js';

// Global sound toggle, fixed to the viewport corner so it shows on every screen.
export default function MuteButton() {
  const [muted, setM] = useState(isMuted());
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setM(next);
  };
  return (
    <button
      onClick={toggle}
      onMouseDown={(e) => e.preventDefault()}
      title={muted ? 'Sound off — click to unmute' : 'Sound on — click to mute'}
      aria-label={muted ? 'Unmute' : 'Mute'}
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 1000,
        width: 42,
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        lineHeight: 1,
        color: '#37131e',
        background: muted ? '#9a5a2e' : '#C9A24B',
        border: '3px solid #EDE0C7',
        boxShadow: '3px 3px 0 #1a0910',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
