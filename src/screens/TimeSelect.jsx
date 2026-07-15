import { useState } from 'react';
import Screen from '../components/Screen.jsx';
import countriesData from '../data/countries.json';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const INK = '#37131e';

function ClockIcon() {
  return (
    <div style={{ position: 'relative', width: 34, height: 34, border: `4px solid ${INK}`, borderRadius: '50%' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 3, height: 11, background: INK, transform: 'translate(-50%,-100%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 9, height: 3, background: INK, transform: 'translateY(-50%)' }} />
    </div>
  );
}

export default function TimeSelect({ onSelect, onBack }) {
  const OPTIONS = [10, 15];
  const [sel, setSel] = useState(1);

  useScreenKeys((e) => {
    if (e.key === 'ArrowRight') setSel(1);
    else if (e.key === 'ArrowLeft') setSel(0);
    else if (e.key === 'Enter') { sound.select(); onSelect(OPTIONS[sel]); }
    else if (e.key === 'Escape') onBack();
  }, [sel, onSelect, onBack]);

  return (
    <Screen>
      <div style={{ position: 'relative', zIndex: 2, width: 860, background: '#EDE0C7', border: `6px solid ${INK}`, boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B', padding: '52px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ fontSize: 22, letterSpacing: 3, color: INK, background: '#C9A24B', padding: '6px 16px' }}>HOW MANY COUNTRIES</div>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 26, color: INK, letterSpacing: 2, marginBottom: 16 }}>HOW LONG?</div>
        <div style={{ display: 'flex', gap: 28, width: '100%', justifyContent: 'center' }}>
          {OPTIONS.map((m, i) => {
            const active = i === sel;
            return (
              <button key={m} onClick={() => { sound.select(); onSelect(m); }} onMouseEnter={() => setSel(i)}
                style={{ flex: 1, background: active ? '#F2C94C' : '#f6efdd', border: `5px solid ${active ? INK : '#C9A24B'}`, boxShadow: active ? `6px 6px 0 ${INK}` : '6px 6px 0 rgba(55,19,30,.25)', padding: '34px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', cursor: 'pointer' }}>
                {active && <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: INK }}>▶</div>}
                <ClockIcon />
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 30, color: INK }}>{m}</div>
                <div style={{ fontSize: 24, letterSpacing: 3, color: active ? '#8a5a1e' : '#9a5a2e' }}>MINUTES</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 22, fontSize: 22, letterSpacing: 3, color: '#9a5a2e' }}>FREE RECALL &nbsp;·&nbsp; ALL {countriesData.length} &nbsp;·&nbsp; COUNTDOWN CLOCK</div>
        <button onClick={onBack} style={{ fontSize: 20, letterSpacing: 3, color: '#9a5a2e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace" }}>ESC &nbsp;·&nbsp; BACK</button>
      </div>
    </Screen>
  );
}
