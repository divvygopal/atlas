import { useState } from 'react';
import Screen from '../components/Screen.jsx';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const MODE_LABEL = { capitals: 'CAPITALS MODE', flags: 'FLAGS MODE', letter: 'LETTER MODE' };
// Continents alphabetically, plus a random pick.
const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
const SHORT = { Africa: 'AFRICA', Asia: 'ASIA', Europe: 'EUROPE', 'North America': 'N. AMERICA', Oceania: 'OCEANIA', 'South America': 'S. AMERICA' };

export default function CountSelect({ mode, poolAll, onSelect, onBack }) {
  // Capitals & Flags: 15 / 30 / ALL / BY CONTINENT. Letter keeps 10/25/50/ALL.
  const OPTIONS =
    mode === 'letter'
      ? [
          { value: 10, big: '10', sub: 'QUICK' },
          { value: 25, big: '25', sub: 'STANDARD' },
          { value: 50, big: '50', sub: 'LONG' },
          { value: 'all', big: 'ALL', sub: `~${poolAll} · EPIC` },
        ]
      : [
          { value: 15, big: '15', sub: 'QUICK' },
          { value: 30, big: '30', sub: 'STANDARD' },
          { value: 'all', big: 'ALL', sub: `~${poolAll} · EPIC` },
          { value: 'continent', big: '◉', sub: 'BY CONTINENT' },
        ];

  const [sel, setSel] = useState(1);
  const [picking, setPicking] = useState(false); // continent sub-picker
  const [csel, setCsel] = useState(0);
  const PICK = [...CONTINENTS, 'Random'];

  const chooseOption = (o) => {
    sound.select();
    if (o.value === 'continent') { setPicking(true); setCsel(0); }
    else onSelect({ count: o.value });
  };
  const chooseContinent = (name) => {
    sound.select();
    const resolved = name === 'Random' ? CONTINENTS[Math.floor(Math.random() * CONTINENTS.length)] : name;
    onSelect({ continent: resolved });
  };

  useScreenKeys((e) => {
    if (!picking) {
      if (e.key === 'ArrowRight') setSel((s) => Math.min(OPTIONS.length - 1, s + 1));
      else if (e.key === 'ArrowLeft') setSel((s) => Math.max(0, s - 1));
      else if (e.key === 'Enter') chooseOption(OPTIONS[sel]);
      else if (e.key === 'Escape') onBack();
    } else {
      if (e.key === 'ArrowRight') setCsel((s) => Math.min(PICK.length - 1, s + 1));
      else if (e.key === 'ArrowLeft') setCsel((s) => Math.max(0, s - 1));
      else if (e.key === 'ArrowDown') setCsel((s) => Math.min(PICK.length - 1, s + 4));
      else if (e.key === 'ArrowUp') setCsel((s) => Math.max(0, s - 4));
      else if (e.key === 'Enter') chooseContinent(PICK[csel]);
      else if (e.key === 'Escape') setPicking(false);
    }
  }, [picking, sel, csel, onSelect, onBack]); // eslint-disable-line

  return (
    <Screen>
      <div style={{ position: 'relative', zIndex: 2, width: 940, background: '#37131e', border: '6px solid #EDE0C7', boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #2C0F1A', padding: '52px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 24, letterSpacing: 4, color: '#C9A24B' }}>{MODE_LABEL[mode]}</div>

        {!picking ? (
          <>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 26, color: '#EDE0C7', letterSpacing: 2, marginBottom: 14 }}>HOW MANY?</div>
            <div style={{ display: 'flex', gap: 22, width: '100%', justifyContent: 'center' }}>
              {OPTIONS.map((o, i) => {
                const active = i === sel;
                return (
                  <button key={o.value} onClick={() => chooseOption(o)} onMouseEnter={() => setSel(i)}
                    style={{ flex: 1, background: active ? '#F2C94C' : '#3f1622', border: `5px solid ${active ? '#EDE0C7' : '#C9A24B'}`, boxShadow: '6px 6px 0 rgba(0,0,0,.45)', padding: '26px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', cursor: 'pointer' }}>
                    {active && <div style={{ position: 'absolute', top: 7, right: 9, fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: '#37131e' }}>▶</div>}
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: o.big === 'ALL' || o.big === '◉' ? 26 : 30, color: active ? '#37131e' : '#EDE0C7' }}>{o.big}</div>
                    <div style={{ fontSize: 20, letterSpacing: 2, color: active ? '#8a5a1e' : '#C9A24B', textAlign: 'center' }}>{o.sub}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 20, fontSize: 22, letterSpacing: 3, color: '#C9A24B', opacity: 0.8 }}>SHUFFLES THE POOL &nbsp;·&nbsp; ENTER TO START</div>
            <button onClick={onBack} style={{ marginTop: 6, fontSize: 20, letterSpacing: 3, color: '#C9A24B', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace" }}>ESC &nbsp;·&nbsp; BACK</button>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 22, color: '#EDE0C7', letterSpacing: 2, marginBottom: 10 }}>PICK A CONTINENT</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, width: '100%' }}>
              {PICK.map((name, i) => {
                const active = i === csel;
                const isRandom = name === 'Random';
                return (
                  <button key={name} onClick={() => chooseContinent(name)} onMouseEnter={() => setCsel(i)}
                    style={{ background: active ? '#F2C94C' : isRandom ? '#4a2029' : '#3f1622', border: `5px solid ${active ? '#EDE0C7' : '#C9A24B'}`, boxShadow: '5px 5px 0 rgba(0,0,0,.45)', padding: '22px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', position: 'relative' }}>
                    {active && <div style={{ position: 'absolute', top: 6, right: 8, fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: '#37131e' }}>▶</div>}
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: active ? '#37131e' : '#EDE0C7', textAlign: 'center', lineHeight: 1.5 }}>{isRandom ? 'RANDOM' : SHORT[name]}</div>
                    <div style={{ fontSize: 18, color: active ? '#8a5a1e' : '#C9A24B' }}>{isRandom ? '🎲 ?' : 'ALL OF IT'}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 18, fontSize: 22, letterSpacing: 3, color: '#C9A24B', opacity: 0.8 }}>EVERY COUNTRY IN THE CONTINENT &nbsp;·&nbsp; ENTER TO START</div>
            <button onClick={() => setPicking(false)} style={{ marginTop: 6, fontSize: 20, letterSpacing: 3, color: '#C9A24B', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace" }}>ESC &nbsp;·&nbsp; BACK</button>
          </>
        )}
      </div>
    </Screen>
  );
}
