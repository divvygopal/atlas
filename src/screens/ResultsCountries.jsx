import { useEffect, useState } from 'react';
import Screen from '../components/Screen.jsx';
import countriesData from '../data/countries.json';
import { getBest, recordBest } from '../lib/storage.js';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const INK = '#37131e';
const CONTINENT_ORDER = ['Europe', 'North America', 'Asia', 'Africa', 'South America', 'Oceania'];
const SHORT = { Europe: 'EUROPE', 'North America': 'N. AMERICA', Asia: 'ASIA', Africa: 'AFRICA', 'South America': 'S. AMERICA', Oceania: 'OCEANIA' };

export default function ResultsCountries({ result, onPlayAgain, onMenu }) {
  const { minutes, found, total } = result;
  const score = found.size;
  const variant = `${minutes}min`;
  const [prev] = useState(() => getBest('countries', variant));
  const best = { best: Math.max(prev, score), isNew: score > prev };

  useEffect(() => {
    recordBest('countries', variant, score);
    sound.select();
  }, []); // eslint-disable-line

  useScreenKeys((e) => {
    if (e.key === 'Enter') onPlayAgain();
    else if (e.key === 'Escape' || e.key === 'Backspace') onMenu();
  }, [onPlayAgain, onMenu]);

  const missedGroups = CONTINENT_ORDER.map((cont) => ({
    cont,
    missed: countriesData
      .filter((c) => c.continent === cont && !found.has(c.iso2))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.missed.length);

  return (
    <Screen>
      <div style={{ position: 'relative', zIndex: 2, width: 1040, background: '#EDE0C7', border: `6px solid ${INK}`, boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B', padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 28, color: INK, letterSpacing: 2 }}>RESULTS</div>
          <div style={{ fontSize: 22, letterSpacing: 3, color: INK, background: '#C9A24B', padding: '6px 16px' }}>HOW MANY · {minutes} MIN</div>
        </div>

        {/* Big score */}
        <div style={{ background: '#f6efdd', border: '4px solid #C9A24B', padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 54, color: '#3aa347' }}>{score}</div>
          <div style={{ fontSize: 30, color: INK, letterSpacing: 2 }}>/ {total} COUNTRIES NAMED</div>
        </div>

        {/* Personal best */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: best.isNew ? '#F2C94C' : '#f6efdd', border: `4px solid ${INK}`, padding: 12 }}>
          <span style={{ color: INK, fontSize: 22 }}>★</span>
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 13, color: INK }}>
            {best.isNew ? `NEW BEST (${minutes} MIN) — ${score} / ${total}` : `BEST (${minutes} MIN): ${best.best} / ${total}`}
          </span>
          <span style={{ color: INK, fontSize: 22 }}>★</span>
        </div>

        {/* Reveal missed */}
        <div>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: INK, marginBottom: 10 }}>THE ONES YOU DIDN'T GET ({total - score})</div>
          {missedGroups.length === 0 ? (
            <div style={{ background: '#f6efdd', borderLeft: '6px solid #3aa347', padding: '10px 14px', fontSize: 24, color: INK }}>EVERY COUNTRY NAMED — PERFECT RUN ★</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 20px', maxHeight: 300, overflowY: 'auto', paddingRight: 6 }}>
              {missedGroups.map(({ cont, missed }) => (
                <div key={cont} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: '#9a5a2e' }}>{SHORT[cont]} · {missed.length}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px 8px', fontSize: 19, color: INK, lineHeight: 1.15 }}>
                    {missed.map((c) => (
                      <span key={c.iso2}>{c.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
