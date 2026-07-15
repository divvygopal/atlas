import { useEffect, useState } from 'react';
import Screen from '../components/Screen.jsx';
import { getBest, recordBest } from '../lib/storage.js';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const INK = '#37131e';
const MODE_LABEL = { capitals: 'CAPITALS', flags: 'FLAGS', letter: 'LETTER' };
const CONT_SHORT = { Africa: 'AFRICA', Asia: 'ASIA', Europe: 'EUROPE', 'North America': 'N. AMERICA', Oceania: 'OCEANIA', 'South America': 'S. AMERICA' };
const pad2 = (n) => String(n).padStart(2, '0');

export default function Results({ result, onPlayAgain, onMenu }) {
  const { mode, count, continent, total, firstTry, recovered, missed } = result;
  const score = firstTry + recovered;
  const variant = continent ? `continent-${continent}` : String(count);

  // Capture the previous best BEFORE writing (StrictMode-safe: the read is pure,
  // the write happens once in an effect).
  const [prev] = useState(() => getBest(mode, variant));
  const best = { best: Math.max(prev, score), isNew: score > prev };

  useEffect(() => {
    recordBest(mode, variant, score);
    sound.select();
  }, []); // eslint-disable-line

  useScreenKeys((e) => {
    if (e.key === 'Enter') onPlayAgain();
    else if (e.key === 'Escape' || e.key === 'Backspace') onMenu();
  }, [onPlayAgain, onMenu]);

  const countText = continent ? CONT_SHORT[continent] : count === 'all' ? 'ALL' : String(count);

  return (
    <Screen>
      <div style={{ position: 'relative', zIndex: 2, width: 920, background: '#EDE0C7', border: `6px solid ${INK}`, boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B', padding: '44px 52px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 28, color: INK, letterSpacing: 2 }}>RESULTS</div>
          <div style={{ fontSize: 22, letterSpacing: 3, color: INK, background: '#C9A24B', padding: '6px 16px' }}>{MODE_LABEL[mode]} · {countText}</div>
        </div>

        {/* Score panel */}
        <div style={{ background: '#f6efdd', border: '4px solid #C9A24B', padding: '26px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          <Stat n={firstTry} label="FIRST TRY" color="#3aa347" />
          <Divider />
          <Stat n={recovered} label="RECOVERED" color="#B8944A" />
          <Divider />
          <Stat n={missed.length} label="MISSED" color="#D64545" />
        </div>

        {/* Missed list */}
        <div>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: INK, marginBottom: 12 }}>THE ONES THAT GOT AWAY</div>
          {missed.length === 0 ? (
            <div style={{ background: '#f6efdd', borderLeft: '6px solid #3aa347', padding: '10px 14px', fontSize: 24, color: INK }}>NOTHING GOT AWAY — FLAWLESS RUN ★</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 230, overflowY: 'auto' }}>
              {missed.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f6efdd', borderLeft: '6px solid #D64545', padding: '8px 14px' }}>
                  <span style={{ color: '#D64545', fontFamily: "'Press Start 2P',monospace", fontSize: 11 }}>✕</span>
                  {m.flag && <img className="pixelated" src={`/flags/${m.flag.toLowerCase()}.svg`} alt="" style={{ width: 34, height: 'auto', border: '2px solid #C9A24B' }} />}
                  <span style={{ fontSize: 24, color: INK, flex: 1 }}>{m.left}</span>
                  {m.right && <span style={{ fontSize: 24, color: '#9a5a2e' }}>{m.right}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal best */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: best.isNew ? '#F2C94C' : '#f6efdd', border: `4px solid ${INK}`, padding: 12 }}>
          <span style={{ color: INK, fontSize: 22 }}>★</span>
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 13, color: INK }}>
            {best.isNew ? `NEW PERSONAL BEST — ${score} / ${total}` : `BEST: ${best.best} / ${total} · YOU GOT ${score}`}
          </span>
          <span style={{ color: INK, fontSize: 22 }}>★</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 4 }}>
          <button onClick={onPlayAgain} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 14, color: '#EDE0C7', background: INK, padding: '18px 28px', boxShadow: '5px 5px 0 #C9A24B', border: 'none', cursor: 'pointer' }}>PLAY AGAIN</button>
          <button onClick={onMenu} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 14, color: INK, background: '#EDE0C7', border: `4px solid ${INK}`, padding: '14px 28px', boxShadow: '5px 5px 0 rgba(55,19,30,.3)', cursor: 'pointer' }}>BACK TO MENU</button>
        </div>
      </div>
    </Screen>
  );
}

function Stat({ n, label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 40, color }}>{pad2(n)}</div>
      <div style={{ fontSize: 22, letterSpacing: 2, color: INK }}>{label}</div>
    </div>
  );
}
function Divider() {
  return <div style={{ width: 3, height: 64, background: '#C9A24B' }} />;
}
