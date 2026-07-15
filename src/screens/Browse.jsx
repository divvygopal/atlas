import { useMemo, useRef, useState } from 'react';
import Screen from '../components/Screen.jsx';
import countriesData from '../data/countries.json';
import { normalize } from '../lib/answer.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const INK = '#37131e';
// Filters: "All" first, then continents alphabetically.
const CONTINENTS = ['All', 'Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];

// Precompute a normalized search haystack per country (name + aliases + capital).
const INDEX = countriesData
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({
    ...c,
    hay: [c.name, c.capital, ...(c.aliases || [])].map(normalize).join(' '),
  }));

export default function Browse({ onBack }) {
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState('All');
  const [hideCaps, setHideCaps] = useState(false); // study mode: hide capitals
  const [revealed, setRevealed] = useState(() => new Set()); // per-card reveals
  const inputRef = useRef(null);

  useScreenKeys((e) => { if (e.key === 'Escape') onBack(); }, [onBack]);

  const toggleHide = () => {
    setHideCaps((h) => !h);
    setRevealed(new Set());
  };
  const toggleReveal = (iso) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(iso) ? next.delete(iso) : next.add(iso);
      return next;
    });

  const results = useMemo(() => {
    const q = normalize(query);
    return INDEX.filter(
      (c) =>
        (continent === 'All' || c.continent === continent) &&
        (!q || c.hay.includes(q)),
    );
  }, [query, continent]);

  return (
    <Screen>
      <div style={{ position: 'relative', zIndex: 2, width: 1400, height: 900, background: '#EDE0C7', border: `6px solid ${INK}`, boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B', padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 24, color: INK, letterSpacing: 2 }}>COUNTRY INDEX</div>
            <div style={{ fontSize: 22, letterSpacing: 2, color: '#9a5a2e' }}>{results.length} / {INDEX.length} · flag · country · capital</div>
          </div>
          <div
            onClick={() => inputRef.current?.focus()}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#37131e', border: '4px solid #C9A24B', padding: '8px 16px', width: 420 }}
          >
            <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: '#C9A24B' }}>🔍</span>
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search country or capital…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#EDE0C7', fontFamily: "'VT323',monospace", fontSize: 26, letterSpacing: 1 }}
            />
          </div>
        </div>

        {/* Continent filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CONTINENTS.map((cont) => {
            const active = cont === continent;
            return (
              <button
                key={cont}
                onClick={() => setContinent(cont)}
                style={{
                  fontFamily: "'VT323',monospace", fontSize: 22, letterSpacing: 1,
                  color: active ? '#EDE0C7' : INK,
                  background: active ? INK : '#f6efdd',
                  border: `3px solid ${active ? INK : '#C9A24B'}`,
                  padding: '4px 16px', cursor: 'pointer',
                }}
              >
                {cont.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          {results.length === 0 ? (
            <div style={{ fontSize: 26, color: '#9a5a2e', padding: 40, textAlign: 'center' }}>NO MATCHES — try a different spelling</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {results.map((c) => {
                const capShown = !hideCaps || revealed.has(c.iso2);
                return (
                  <div
                    key={c.iso2}
                    onClick={hideCaps ? () => toggleReveal(c.iso2) : undefined}
                    style={{ background: '#f6efdd', border: '3px solid #C9A24B', boxShadow: '4px 4px 0 rgba(55,19,30,.2)', padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: hideCaps ? 'pointer' : 'default' }}
                  >
                    <img src={`/flags/${c.iso2.toLowerCase()}.svg`} alt="" style={{ width: 76, height: 'auto', border: `2px solid ${INK}`, boxShadow: '3px 3px 0 rgba(0,0,0,.25)', display: 'block' }} />
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 24, color: INK, letterSpacing: 1, textAlign: 'center', lineHeight: 1.05 }}>{c.name}</div>
                    {capShown ? (
                      <div style={{ fontSize: 20, color: '#9a5a2e', letterSpacing: 1, textAlign: 'center', lineHeight: 1.05 }}>{c.capital}</div>
                    ) : (
                      <div style={{ fontSize: 20, color: '#b79b6a', letterSpacing: 2, textAlign: 'center', lineHeight: 1.05 }}>· · · tap · · ·</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={toggleHide}
            style={{ fontFamily: "'VT323',monospace", fontSize: 22, letterSpacing: 1, color: hideCaps ? '#EDE0C7' : INK, background: hideCaps ? INK : '#C9A24B', border: `3px solid ${INK}`, boxShadow: '3px 3px 0 rgba(55,19,30,.3)', padding: '7px 18px', cursor: 'pointer' }}
          >
            {hideCaps ? '👁 SHOW ALL CAPITALS' : '🙈 HIDE ALL CAPITALS'}
          </button>
          <button onClick={onBack} style={{ fontSize: 22, letterSpacing: 3, color: '#9a5a2e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace" }}>ESC &nbsp;·&nbsp; BACK TO TITLE</button>
          <div style={{ width: 220 }} />
        </div>
      </div>
    </Screen>
  );
}
