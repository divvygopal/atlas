import { useState } from 'react';
import Screen from '../components/Screen.jsx';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const INK = '#37131e';

function CapitolIcon() {
  return (
    <div style={{ position: 'relative', width: 60, height: 56 }}>
      <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50% 50% 0 0', background: INK }} />
      <div style={{ position: 'absolute', left: '50%', top: 13, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '27px solid transparent', borderRight: '27px solid transparent', borderBottom: `16px solid ${INK}` }} />
      <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', width: 52, height: 22, background: 'repeating-linear-gradient(90deg,#37131e 0 5px,transparent 5px 9px)', borderBottom: `5px solid ${INK}` }} />
    </div>
  );
}
function FlagIcon() {
  return (
    <div style={{ position: 'relative', width: 60, height: 56 }}>
      <div style={{ position: 'absolute', left: 15, top: 4, width: 5, height: 48, background: INK }} />
      <div style={{ position: 'absolute', left: 20, top: 6, width: 36, height: 25, background: INK }} />
    </div>
  );
}
function LetterIcon() {
  return (
    <div style={{ width: 60, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <div style={{ width: 24, height: 24, background: INK, color: '#EDE0C7', fontFamily: "'Press Start 2P',monospace", fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>F</div>
      <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 11, color: INK }}>▸</div>
      <div style={{ width: 24, height: 24, background: '#C9A24B', color: INK, fontFamily: "'Press Start 2P',monospace", fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>P</div>
    </div>
  );
}
function GlobeIcon() {
  return (
    <div style={{ position: 'relative', width: 54, height: 54, border: `5px solid ${INK}`, borderRadius: '50%' }}>
      <div style={{ position: 'absolute', top: '50%', left: -5, right: -5, height: 4, background: INK, transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', top: -1, bottom: -1, left: '50%', width: 22, transform: 'translateX(-50%)', border: `4px solid ${INK}`, borderRadius: '50%' }} />
    </div>
  );
}

const TILES = [
  { id: 'capitals', label: 'CAPITALS', icon: <CapitolIcon /> },
  { id: 'flags', label: 'FLAGS', icon: <FlagIcon /> },
  { id: 'letter', label: 'LETTER\nPAIRS', icon: <LetterIcon /> },
  { id: 'countries', label: 'HOW MANY\nCOUNTRIES', icon: <GlobeIcon /> },
];

export default function ModeSelect({ onSelect, onBack }) {
  const [sel, setSel] = useState(0);

  useScreenKeys(
    (e) => {
      if (e.key === 'ArrowRight') setSel((s) => (s % 2 === 0 ? s + 1 : s));
      else if (e.key === 'ArrowLeft') setSel((s) => (s % 2 === 1 ? s - 1 : s));
      else if (e.key === 'ArrowDown') setSel((s) => (s < 2 ? s + 2 : s));
      else if (e.key === 'ArrowUp') setSel((s) => (s >= 2 ? s - 2 : s));
      else if (e.key === 'Enter') { sound.select(); onSelect(TILES[sel].id); }
      else if (e.key === 'Escape') onBack();
    },
    [sel, onSelect, onBack],
  );

  return (
    <Screen>
      <div
        style={{
          position: 'relative', zIndex: 2, width: 900, background: '#EDE0C7',
          border: '6px solid #37131e', boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B',
          padding: '48px 52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 24, color: INK, letterSpacing: 2 }}>SELECT MODE</div>
          <div style={{ fontSize: 24, letterSpacing: 3, color: '#9a5a2e' }}>◂ ▸ ▴ ▾  NAVIGATE  ·  ENTER  SELECT</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, width: '100%' }}>
          {TILES.map((t, i) => {
            const active = i === sel;
            return (
              <button
                key={t.id}
                onClick={() => { sound.select(); onSelect(t.id); }}
                onMouseEnter={() => setSel(i)}
                style={{
                  background: active ? '#F2C94C' : '#f6efdd',
                  border: `5px solid ${active ? INK : '#C9A24B'}`,
                  boxShadow: active ? `6px 6px 0 ${INK}` : '6px 6px 0 rgba(55,19,30,.25)',
                  padding: 26, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: t.id === 'capitals' || t.id === 'flags' ? 16 : 14,
                  position: 'relative', cursor: 'pointer', textAlign: 'center',
                }}
              >
                {active && (
                  <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: INK }}>▶</div>
                )}
                {t.icon}
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: t.label.includes('\n') ? 11 : 13, color: INK, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {t.label}
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onBack}
          style={{ fontSize: 22, letterSpacing: 3, color: '#9a5a2e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace" }}
        >
          ESC &nbsp;·&nbsp; BACK TO TITLE
        </button>
      </div>
    </Screen>
  );
}
