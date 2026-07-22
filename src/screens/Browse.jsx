import { useEffect, useMemo, useRef, useState } from 'react';
import Screen from '../components/Screen.jsx';
import countriesData from '../data/countries.json';
import { normalize } from '../lib/answer.js';
import { overlay } from '../lib/overlay.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const INK = '#37131e';
// "All" first, then continents alphabetically.
const CONTINENTS = ['All', 'Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];

// Normalized search haystack per country (name + aliases + capital).
const INDEX = countriesData
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ ...c, hay: [c.name, c.capital, ...(c.aliases || [])].map(normalize).join(' ') }));

const badge = (extra) => ({ position: 'absolute', fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: 'rgba(55,19,30,.5)', ...extra });

export default function Browse({ onBack }) {
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState('All');
  const [hideCaps, setHideCaps] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const [shuffleMap, setShuffleMap] = useState(null); // null = alphabetical
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const gridRef = useRef(null);
  const selRef = useRef(null);

  const toggleHide = () => { setHideCaps((h) => !h); setRevealed(new Set()); };
  const toggleReveal = (iso) =>
    setRevealed((prev) => { const n = new Set(prev); n.has(iso) ? n.delete(iso) : n.add(iso); return n; });
  // Fresh random order each time shuffle turns on; off → alphabetical.
  const toggleShuffle = () =>
    setShuffleMap((m) => (m ? null : new Map(INDEX.map((c) => [c.iso2, Math.random()]))));

  const results = useMemo(() => {
    const q = normalize(query);
    let r = INDEX.filter((c) => (continent === 'All' || c.continent === continent) && (!q || c.hay.includes(q)));
    if (shuffleMap) r = r.slice().sort((a, b) => shuffleMap.get(a.iso2) - shuffleMap.get(b.iso2));
    return r;
  }, [query, continent, shuffleMap]);

  useEffect(() => { setSel(0); }, [query, continent, shuffleMap]);
  useEffect(() => { selRef.current?.scrollIntoView({ block: 'nearest' }); }, [sel]);

  const cols = () => {
    const g = gridRef.current;
    if (!g) return 6;
    const n = getComputedStyle(g).gridTemplateColumns.split(' ').length;
    return Math.max(1, n);
  };

  useScreenKeys((e) => {
    const typing = document.activeElement === inputRef.current;
    if (typing) {
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); inputRef.current.blur(); }
      return; // let all other keys type into search
    }
    if (overlay.active()) return; // settings etc. own the keyboard
    if (e.key === 'Escape') { onBack(); return; }
    if (e.key === '/') { e.preventDefault(); inputRef.current?.focus(); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= CONTINENTS.length) { e.preventDefault(); setContinent(CONTINENTS[n - 1]); return; }
    if (e.key === 'h' || e.key === 'H') { e.preventDefault(); toggleHide(); return; }
    if (e.key === 's' || e.key === 'S') { e.preventDefault(); toggleShuffle(); return; }
    if (e.key === ' ') { e.preventDefault(); const c = results[sel]; if (c) toggleReveal(c.iso2); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + cols())); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - cols())); }
  }, [continent, hideCaps, shuffleMap, results, sel, onBack]);

  return (
    <Screen>
      <div style={{ position: 'relative', zIndex: 2, width: 1400, height: 900, background: '#EDE0C7', border: `6px solid ${INK}`, boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B', padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 24, color: INK, letterSpacing: 2 }}>COUNTRY INDEX</div>
            <div style={{ fontSize: 22, letterSpacing: 2, color: '#9a5a2e' }}>{results.length} / {INDEX.length} · flag · country · capital</div>
          </div>
          <div onClick={() => inputRef.current?.focus()} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, background: '#37131e', border: '4px solid #C9A24B', padding: '8px 16px', width: 420 }}>
            <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: '#C9A24B' }}>🔍</span>
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="press / to search…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#EDE0C7', fontFamily: "'VT323',monospace", fontSize: 26, letterSpacing: 1 }} />
            <span style={badge({ top: 3, right: 6, color: 'rgba(201,162,75,.6)' })}>/</span>
          </div>
        </div>

        {/* Continent filter — faded numbers are the shortcuts */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CONTINENTS.map((cont, i) => {
            const active = cont === continent;
            return (
              <button key={cont} onClick={() => setContinent(cont)}
                style={{ position: 'relative', fontFamily: "'VT323',monospace", fontSize: 22, letterSpacing: 1, color: active ? '#EDE0C7' : INK, background: active ? INK : '#f6efdd', border: `3px solid ${active ? INK : '#C9A24B'}`, padding: '4px 22px 4px 16px', cursor: 'pointer' }}>
                {cont.toUpperCase()}
                <span style={badge({ top: 2, right: 4, color: active ? 'rgba(237,224,199,.5)' : 'rgba(55,19,30,.4)' })}>{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          {results.length === 0 ? (
            <div style={{ fontSize: 26, color: '#9a5a2e', padding: 40, textAlign: 'center' }}>NO MATCHES — try a different spelling</div>
          ) : (
            <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {results.map((c, i) => {
                const capShown = !hideCaps || revealed.has(c.iso2);
                const selected = i === sel;
                return (
                  <div key={c.iso2} ref={selected ? selRef : null} onClick={hideCaps ? () => toggleReveal(c.iso2) : undefined}
                    style={{ background: '#f6efdd', border: `3px solid ${selected ? INK : '#C9A24B'}`, outline: selected ? '3px solid #F2C94C' : 'none', outlineOffset: 1, boxShadow: '4px 4px 0 rgba(55,19,30,.2)', padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: hideCaps ? 'pointer' : 'default' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={toggleHide} style={{ position: 'relative', fontFamily: "'VT323',monospace", fontSize: 22, letterSpacing: 1, color: hideCaps ? '#EDE0C7' : INK, background: hideCaps ? INK : '#C9A24B', border: `3px solid ${INK}`, boxShadow: '3px 3px 0 rgba(55,19,30,.3)', padding: '7px 26px 7px 18px', cursor: 'pointer' }}>
              {hideCaps ? '👁 SHOW ALL CAPITALS' : '🙈 HIDE ALL CAPITALS'}
              <span style={badge({ top: 3, right: 6, color: hideCaps ? 'rgba(237,224,199,.5)' : 'rgba(55,19,30,.45)' })}>H</span>
            </button>
            <button onClick={toggleShuffle} style={{ position: 'relative', fontFamily: "'VT323',monospace", fontSize: 22, letterSpacing: 1, color: shuffleMap ? '#EDE0C7' : INK, background: shuffleMap ? INK : '#C9A24B', border: `3px solid ${INK}`, boxShadow: '3px 3px 0 rgba(55,19,30,.3)', padding: '7px 26px 7px 18px', cursor: 'pointer' }}>
              {shuffleMap ? '🔀 SHUFFLED' : '🔀 SHUFFLE'}
              <span style={badge({ top: 3, right: 6, color: shuffleMap ? 'rgba(237,224,199,.5)' : 'rgba(55,19,30,.45)' })}>S</span>
            </button>
          </div>
          <button onClick={onBack} style={{ fontSize: 22, letterSpacing: 3, color: '#9a5a2e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace" }}>ESC &nbsp;·&nbsp; BACK TO TITLE</button>
          <div style={{ width: 320, textAlign: 'right', fontSize: 17, color: '#b79b6a', letterSpacing: 1 }}>◂▸▴▾ move · SPACE reveal</div>
        </div>
      </div>
    </Screen>
  );
}
