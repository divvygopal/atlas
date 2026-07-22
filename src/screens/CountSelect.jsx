import { useState } from 'react';
import Screen from '../components/Screen.jsx';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const MODE_LABEL = { capitals: 'CAPITALS MODE', flags: 'FLAGS MODE', letter: 'LETTER MODE' };
const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
const SHORT = { Africa: 'AFRICA', Asia: 'ASIA', Europe: 'EUROPE', 'North America': 'N. AMERICA', Oceania: 'OCEANIA', 'South America': 'S. AMERICA' };
const MAX_PICK = 4;

const kbd = { position: 'absolute', bottom: 6, left: 8, fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: 'rgba(201,162,75,.55)' };

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
  const [chosen, setChosen] = useState([]); // multi-selected continents

  const chooseOption = (o) => {
    sound.select();
    if (o.value === 'continent') { setPicking(true); setChosen([]); }
    else onSelect({ count: o.value });
  };
  const toggleContinent = (name) => {
    sound.select();
    setChosen((prev) => {
      if (prev.includes(name)) return prev.filter((c) => c !== name);
      if (prev.length >= MAX_PICK) return prev; // cap at 4 (use ALL for more)
      return [...prev, name];
    });
  };
  const start = () => {
    if (chosen.length === 0) return;
    sound.select();
    onSelect({ continents: chosen });
  };

  useScreenKeys((e) => {
    if (!picking) {
      if (e.key === 'ArrowRight') setSel((s) => Math.min(OPTIONS.length - 1, s + 1));
      else if (e.key === 'ArrowLeft') setSel((s) => Math.max(0, s - 1));
      else if (e.key === 'Enter') chooseOption(OPTIONS[sel]);
      else if (e.key === 'Escape') onBack();
    } else {
      const n = Number(e.key);
      if (n >= 1 && n <= CONTINENTS.length) { e.preventDefault(); toggleContinent(CONTINENTS[n - 1]); }
      else if (e.key === 'Enter') start();
      else if (e.key === 'Escape') setPicking(false);
    }
  }, [picking, sel, chosen, onSelect, onBack]); // eslint-disable-line

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
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 22, color: '#EDE0C7', letterSpacing: 2, marginBottom: 4 }}>PICK CONTINENTS</div>
            <div style={{ fontSize: 21, letterSpacing: 2, color: '#C9A24B', marginBottom: 8 }}>select 1–{MAX_PICK} · {chosen.length} chosen</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, width: '100%' }}>
              {CONTINENTS.map((name, i) => {
                const on = chosen.includes(name);
                return (
                  <button key={name} onClick={() => toggleContinent(name)}
                    style={{ background: on ? '#F2C94C' : '#3f1622', border: `5px solid ${on ? '#EDE0C7' : '#C9A24B'}`, boxShadow: '5px 5px 0 rgba(0,0,0,.45)', padding: '22px 8px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 6, right: 9, fontFamily: "'Press Start 2P',monospace", fontSize: 11, color: on ? '#37131e' : '#4CC15A' }}>{on ? '✓' : ''}</div>
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 13, color: on ? '#37131e' : '#EDE0C7', textAlign: 'center' }}>{SHORT[name]}</div>
                    <span style={kbd}>{i + 1}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={start} disabled={chosen.length === 0}
              style={{ marginTop: 16, fontFamily: "'Press Start 2P',monospace", fontSize: 15, color: chosen.length ? '#37131e' : '#7a5a3a', background: chosen.length ? '#EDE0C7' : '#5a4530', border: 'none', padding: '16px 28px', boxShadow: '5px 5px 0 #1a0910', cursor: chosen.length ? 'pointer' : 'default' }}>
              ▶ START ({chosen.length})
            </button>
            <div style={{ marginTop: 6, fontSize: 19, letterSpacing: 2, color: '#C9A24B', opacity: 0.7 }}>keys 1–6 toggle · ENTER start · ESC back</div>
            <button onClick={() => setPicking(false)} style={{ fontSize: 20, letterSpacing: 3, color: '#C9A24B', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace" }}>ESC &nbsp;·&nbsp; BACK</button>
          </>
        )}
      </div>
    </Screen>
  );
}
