import { useEffect, useMemo, useRef, useState } from 'react';
import Screen from '../components/Screen.jsx';
import WorldMap from '../components/WorldMap.jsx';
import OutlineMap from '../components/OutlineMap.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { overlay } from '../lib/overlay.js';
import countriesData from '../data/countries.json';
import { resolveCountry, normalize } from '../lib/answer.js';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

// Flat index of every accepted name/alias -> iso2, for prefix disambiguation.
const NAME_INDEX = countriesData.flatMap((c) => [
  { norm: normalize(c.name), iso2: c.iso2 },
  ...(c.aliases || []).map((a) => ({ norm: normalize(a), iso2: c.iso2 })),
]);

const TOTAL = countriesData.length;
// Mockup continent order (row-by-row in the 2-col grid)
const CONTINENT_ORDER = ['Europe', 'North America', 'Asia', 'Africa', 'South America', 'Oceania'];
const SHORT = { Europe: 'EUROPE', 'North America': 'N. AMERICA', Asia: 'ASIA', Africa: 'AFRICA', 'South America': 'S. AMERICA', Oceania: 'OCEANIA' };

const GROUPS = CONTINENT_ORDER.map((cont) => ({
  cont,
  list: countriesData
    .filter((c) => c.continent === cont)
    .sort((a, b) => a.name.localeCompare(b.name)),
}));

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function PlayCountries({ minutes, onDone, onQuit }) {
  const [found, setFound] = useState(() => new Set()); // iso2
  const [secs, setSecs] = useState(minutes * 60);
  const [value, setValue] = useState('');
  const [nudge, setNudge] = useState(null); // {type,text}
  const [flash, setFlash] = useState(null); // 'wrong'|'correct'
  const [collapsed, setCollapsed] = useState(() => new Set()); // collapsed continents
  const toggleCollapse = (cont) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cont) ? next.delete(cont) : next.add(cont);
      return next;
    });
  const [paused, setPaused] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  // Halt the clock while paused or deciding whether to quit (not while just
  // viewing the reference map).
  const haltRef = useRef(false);
  haltRef.current = paused || confirmQuit;
  const inputRef = useRef(null);
  const nudgeTimer = useRef(null);
  const flashTimer = useRef(null);
  const endedRef = useRef(false);

  // countdown — ticks only while not paused (pause is session-only, no storage)
  useEffect(() => {
    const id = setInterval(() => {
      if (haltRef.current) return;
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(id);
          endNow();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      clearTimeout(nudgeTimer.current);
      clearTimeout(flashTimer.current);
    };
  }, []);

  // keep a live ref of `found` so timer/END GAME read the latest set
  const foundRef = useRef(found);
  foundRef.current = found;
  function endNow() {
    if (endedRef.current) return;
    endedRef.current = true;
    onDone({ minutes, found: new Set(foundRef.current), total: TOTAL });
  }

  // Finish the moment every country is found — no need to wait out the clock.
  useEffect(() => {
    if (found.size >= TOTAL) endNow();
  }, [found]); // eslint-disable-line

  function showNudge(type, text) {
    setNudge({ type, text });
    clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudge(null), 1200);
  }
  function doFlash(kind) {
    setFlash(kind);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 350);
  }

  // Record a resolved country (correct or already-found). Shared by Enter and
  // by the type-to-accept path below.
  function commitCountry(c) {
    if (found.has(c.iso2)) {
      sound.dupe();
      showNudge('dupe', 'already got that one!');
      return;
    }
    sound.correct();
    doFlash('correct');
    setFound((prev) => {
      const next = new Set(prev);
      next.add(c.iso2);
      return next;
    });
    showNudge('correct', `✓ ${c.name}`);
  }

  // Enter: full submit, including the "not a country" flash for a non-match.
  function submit() {
    const v = value.trim();
    setValue('');
    if (!v) return;
    const c = resolveCountry(v, countriesData);
    if (!c) {
      sound.wrong();
      doFlash('wrong');
      showNudge('wrong', 'not a country');
      return;
    }
    commitCountry(c);
  }

  // Type-to-accept (no Enter needed). The shorter exact match wins first: typing
  // "Niger" accepts Niger right away even though "Nigeria" exists. To then reach
  // the longer name, once the short one is already found and what's typed is a
  // prefix of another *unfound* country, we keep the text so the user can extend
  // it (Niger found → keep typing → "Nigeria").
  function handleChange(v) {
    const c = resolveCountry(v, countriesData);
    if (!c) { setValue(v); return; }
    if (!found.has(c.iso2)) {
      setValue('');
      commitCountry(c);
      return;
    }
    const nv = normalize(v);
    const extendable = NAME_INDEX.some(
      (n) => !found.has(n.iso2) && n.norm !== nv && n.norm.startsWith(nv),
    );
    if (extendable) setValue(v);
    else { setValue(''); commitCountry(c); }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  // Escape → close an open overlay first, otherwise quit. Mount-guarded so the
  // keypress can't cascade into the menu.
  useScreenKeys((e) => {
    if (e.key === 'Escape') {
      if (showMap) { setShowMap(false); setTimeout(() => inputRef.current?.focus(), 0); }
      else if (paused) setPaused(false);
      else setConfirmQuit((v) => !v); // ask before dropping the run
      return;
    }
    // Number shortcuts (answers never contain digits, so they can't collide
    // with typing). Stand down while any overlay is up.
    if (paused || showMap || confirmQuit || overlay.active()) return;
    if (e.key === '1') { e.preventDefault(); setPaused(true); }
    else if (e.key === '2') { e.preventDefault(); setShowMap(true); }
    else if (e.key === '3') { e.preventDefault(); endNow(); }
  }, [showMap, paused, confirmQuit]);

  const timeColor = secs <= 60 ? '#E24A4A' : '#F2C94C';
  const inputBorder = flash === 'wrong' ? '#E24A4A' : flash === 'correct' ? '#4CC15A' : '#C9A24B';
  const nudgeStyle = useMemo(() => {
    if (!nudge) return null;
    if (nudge.type === 'dupe') return { bg: '#F2C94C', fg: '#37131e', border: '#37131e' };
    if (nudge.type === 'wrong') return { bg: '#5c1f22', fg: '#EDE0C7', border: '#E24A4A' };
    return { bg: '#1f5f2a', fg: '#EDE0C7', border: '#4CC15A' };
  }, [nudge]);

  return (
    <Screen>
      <div style={{ position: 'relative', zIndex: 2, width: 1200, background: '#37131e', border: '6px solid #EDE0C7', boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #2C0F1A', padding: '28px 34px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* HUD */}
        <div style={{ background: '#3f1622', border: '4px solid #C9A24B', boxShadow: 'inset 0 0 0 2px rgba(201,162,75,.3)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, color: '#C9A24B', lineHeight: 1.5 }}>HOW MANY<br />COUNTRIES</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, color: '#C9A24B', letterSpacing: 2 }}>TIME</span>
            <div style={{ background: '#2C0F1A', border: '3px solid #EDE0C7', padding: '6px 14px', fontFamily: "'Press Start 2P',monospace", fontSize: 24, color: timeColor }}>{mmss(secs)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 24, color: '#4CC15A' }}>{found.size}</span>
            <span style={{ fontSize: 22, color: '#EDE0C7' }}>/ {TOTAL} FOUND</span>
          </div>
        </div>

        {/* Input + nudge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 16, color: '#C9A24B' }}>▶</div>
          <div onClick={() => inputRef.current?.focus()} style={{ position: 'relative', flex: 1, background: '#2C0F1A', border: `4px solid ${inputBorder}`, padding: '12px 20px', display: 'flex', alignItems: 'center', minHeight: 56 }}>
            <span style={{ fontSize: 32, color: '#EDE0C7', letterSpacing: 1, whiteSpace: 'pre' }}>{value}</span>
            <span className="blink-caret" style={{ display: 'inline-block', width: 12, height: 28, background: '#EDE0C7', marginLeft: 4 }} />
            <input ref={inputRef} className="atlas-input" autoFocus disabled={paused || showMap || confirmQuit} value={value} onChange={(e) => handleChange(e.target.value)} onKeyDown={onKey} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'transparent', padding: '12px 20px', fontSize: 32 }} />
          </div>
          {nudge && (
            <div style={{ background: nudgeStyle.bg, border: `3px solid ${nudgeStyle.border}`, padding: '8px 12px', fontSize: 19, color: nudgeStyle.fg, whiteSpace: 'nowrap', animation: 'popIn .12s steps(2)' }}>{nudge.text}</div>
          )}
        </div>

        {/* Body: map + continent list */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
          {/* Map */}
          <div style={{ flex: 'none', width: 508, background: '#2C0F1A', border: '4px solid #C9A24B', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, color: '#C9A24B' }}>WORLD MAP</span>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 17, color: '#EDE0C7' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: '#C9A24B', display: 'inline-block' }} />FOUND</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: '#5a2b38', display: 'inline-block' }} />NOT YET</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 462 }}><WorldMap foundIso={found} /></div>
            </div>
            <div style={{ fontSize: 17, letterSpacing: 1, color: '#C9A24B', opacity: 0.8, textAlign: 'center' }}>lights up as you name it · click map to zoom</div>
          </div>

          {/* Continent list — collapsible; every country holds its alphabetical
              slot, shown as a box until found, then filled with its name. */}
          <div style={{ flex: 1, background: '#2C0F1A', border: '4px solid #C9A24B', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, color: '#C9A24B' }}>BY CONTINENT</span>
              <span style={{ fontSize: 15, color: '#9a5a2e', letterSpacing: 1 }}>click a continent to collapse</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 316, paddingRight: 4 }}>
              {GROUPS.map(({ cont, list }) => {
                const foundCount = list.reduce((n, c) => n + (found.has(c.iso2) ? 1 : 0), 0);
                const pct = Math.round((foundCount / list.length) * 100);
                const isOpen = !collapsed.has(cont);
                return (
                  <div key={cont} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div onClick={() => toggleCollapse(cont)} onMouseDown={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: '#C9A24B', width: 12 }}>{isOpen ? '▾' : '▸'}</span>
                      <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: '#EDE0C7' }}>{SHORT[cont]}</span>
                      <span style={{ fontSize: 18, color: '#C9A24B', marginLeft: 'auto' }}>{foundCount} / {list.length}</span>
                    </div>
                    <div style={{ height: 8, background: '#4a2029', border: '1px solid #C9A24B', padding: 1 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#C9A24B', transition: 'width .15s steps(3)' }} />
                    </div>
                    {isOpen && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', fontSize: 16, lineHeight: 1.15 }}>
                        {list.map((c) =>
                          found.has(c.iso2) ? (
                            <span key={c.iso2} style={{ color: '#EDE0C7' }}>{c.name}&nbsp;<span style={{ color: '#4CC15A' }}>✓</span></span>
                          ) : (
                            <span key={c.iso2} title="not found yet" style={{ color: '#6b3a45' }}>▫</span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer — faded numbers are the keyboard shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setPaused(true)} onMouseDown={(e) => e.preventDefault()} style={footBtn('#C9A24B', '#37131e')}><Kbd>1</Kbd>❚❚ PAUSE</button>
            <button onClick={() => setShowMap(true)} onMouseDown={(e) => e.preventDefault()} style={footBtn('#EDE0C7', '#37131e')}><Kbd>2</Kbd>🗺 SHOW MAP</button>
            <span style={{ fontSize: 19, letterSpacing: 2, color: '#C9A24B', opacity: 0.75 }}>ESC · QUIT</span>
          </div>
          <button onClick={endNow} onMouseDown={(e) => e.preventDefault()} style={{ position: 'relative', fontFamily: "'Press Start 2P',monospace", fontSize: 13, color: '#EDE0C7', background: '#D64545', padding: '14px 30px 14px 22px', boxShadow: '5px 5px 0 #1a0910', border: 'none', cursor: 'pointer' }}>END GAME<Kbd dark>3</Kbd></button>
        </div>

        {/* Pause overlay (session-only) — covers the board so the timer really pauses */}
        {paused && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, background: 'rgba(20,8,12,.94)' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 44, color: '#F2C94C', textShadow: '5px 5px 0 #37131e' }}>PAUSED</div>
            <div style={{ fontSize: 26, color: '#C9A24B', letterSpacing: 2 }}>timer stopped at {mmss(secs)} · {found.size} / {TOTAL} found</div>
            <button
              onClick={() => { setPaused(false); setTimeout(() => inputRef.current?.focus(), 0); }}
              style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 18, color: '#37131e', background: '#EDE0C7', padding: '18px 30px', boxShadow: '6px 6px 0 #1a0910', border: 'none', cursor: 'pointer' }}
            >
              ▶ RESUME
            </button>
          </div>
        )}
      </div>

      {/* Real outline-map overlay */}
      {showMap && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,8,12,.92)' }}>
          <div style={{ width: 1320, height: 720, background: '#37131e', border: '6px solid #EDE0C7', boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #2C0F1A', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 14, color: '#C9A24B' }}>WORLD MAP · REAL OUTLINES</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 20, color: '#EDE0C7' }}>{found.size} / {TOTAL} found fill in</span>
                <button onClick={() => { setShowMap(false); setTimeout(() => inputRef.current?.focus(), 0); }} style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: '#EDE0C7', background: '#D64545', padding: '10px 16px', border: 'none', cursor: 'pointer' }}>✕ CLOSE</button>
              </div>
            </div>
            <div style={{ flex: 1, border: '4px solid #C9A24B', overflow: 'hidden' }}>
              <OutlineMap foundIso={found} />
            </div>
          </div>
        </div>
      )}

      {confirmQuit && (
        <ConfirmDialog
          title="QUIT TO MENU?"
          sub="your progress in this run will be lost"
          confirmLabel="QUIT"
          cancelLabel="KEEP PLAYING"
          onConfirm={onQuit}
          onCancel={() => { setConfirmQuit(false); setTimeout(() => inputRef.current?.focus(), 0); }}
        />
      )}
    </Screen>
  );
}

const footBtn = (bg, fg) => ({
  position: 'relative',
  fontFamily: "'VT323',monospace", fontSize: 21, letterSpacing: 1,
  color: fg, background: bg, border: 'none', padding: '7px 26px 7px 16px',
  boxShadow: '3px 3px 0 #1a0910', cursor: 'pointer',
});

// Small faded shortcut badge shown in the corner of a button.
function Kbd({ children, dark }) {
  return (
    <span style={{ position: 'absolute', top: 3, right: 5, fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: dark ? 'rgba(237,224,199,.5)' : 'rgba(55,19,30,.45)' }}>{children}</span>
  );
}
