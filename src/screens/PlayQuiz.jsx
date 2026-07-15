import { useEffect, useMemo, useRef, useState } from 'react';
import Screen from '../components/Screen.jsx';
import ConfirmQuit from '../components/ConfirmQuit.jsx';
import countriesData from '../data/countries.json';
import letterPairsData from '../data/letterPairs.json';
import { buildQuestions, shuffle } from '../lib/quiz.js';
import { matchesCapital, matchesCountryName, resolveCountry, firstLetter } from '../lib/answer.js';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

const MODE_LABEL = { capitals: 'CAPITALS', flags: 'FLAGS', letter: 'LETTER' };
const pad2 = (n) => String(n).padStart(2, '0');

// per-question helpers -------------------------------------------------------
function checkAnswer(q, input) {
  if (q.kind === 'capitals') return matchesCapital(input, q.country);
  if (q.kind === 'flags') return matchesCountryName(input, q.country);
  // letter: resolve typed country, verify both initials match the active pair
  const c = resolveCountry(input, countriesData);
  if (!c) return false;
  return (
    firstLetter(c.name) === q.pair.countryInitial &&
    firstLetter(c.capital) === q.pair.capitalInitial
  );
}
function revealOf(q) {
  if (q.kind === 'capitals') return q.country.capital;
  if (q.kind === 'flags') return q.country.name;
  return q.pair.answers.join(' / ');
}
function missedEntryOf(q) {
  if (q.kind === 'capitals')
    return { left: q.country.name.toUpperCase(), right: `→ ${q.country.capital}` };
  if (q.kind === 'flags')
    return { flag: q.country.iso2, left: q.country.name.toUpperCase(), right: '' };
  return { left: `${q.pair.countryInitial} · ${q.pair.capitalInitial}`, right: `→ ${q.pair.answers.join(' / ')}` };
}

export default function PlayQuiz({ mode, count, continent = null, onDone, onQuit }) {
  const initial = useMemo(
    () => buildQuestions(mode, count, continent, { countries: countriesData, letterPairs: letterPairsData }),
    [mode, count, continent],
  );
  return <PlayQuizInner mode={mode} count={count} continent={continent} initial={initial} onDone={onDone} onQuit={onQuit} />;
}

function PlayQuizInner({ mode, count, continent, initial, onDone, onQuit }) {
  const [list, setList] = useState(initial);
  const [phase, setPhase] = useState('round1'); // round1 | round2
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null); // {status,reveal}
  const [banner, setBanner] = useState(false); // ROUND 2 overlay
  const [hint, setHint] = useState(false); // Letter mode: reveal capital(s)
  const [confirmQuit, setConfirmQuit] = useState(false);

  const missedR1 = useRef([]);
  const stats = useRef({ firstTry: 0, recovered: 0, missedFinal: [] });
  const inputRef = useRef(null);
  const timer = useRef(null);

  const q = list[idx];
  const total = list.length;

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!feedback && !banner) inputRef.current?.focus();
  }, [idx, feedback, banner, phase]);
  // Reset the Letter hint whenever the question changes.
  useEffect(() => setHint(false), [idx, phase]);

  // Capital(s) for the current Letter pair, for the hint reveal.
  const hintCapitals =
    q && q.kind === 'letter'
      ? q.pair.answers
          .map((name) => countriesData.find((c) => c.name === name)?.capital)
          .filter(Boolean)
          .join(' / ')
      : '';

  function finish() {
    const s = stats.current;
    onDone({
      mode,
      count,
      continent,
      total: initial.length,
      firstTry: s.firstTry,
      recovered: s.recovered,
      missed: s.missedFinal,
    });
  }

  function advance() {
    setFeedback(null);
    setValue('');
    if (idx + 1 < list.length) {
      setIdx(idx + 1);
      return;
    }
    // end of current list
    if (phase === 'round1' && missedR1.current.length > 0) {
      const r2 = shuffle(missedR1.current);
      setBanner(true);
      timer.current = setTimeout(() => {
        setBanner(false);
        setList(r2);
        setPhase('round2');
        setIdx(0);
      }, 1500);
    } else {
      finish();
    }
  }

  function submit() {
    if (feedback || banner || !q) return;
    if (!value.trim()) return;
    const correct = checkAnswer(q, value);
    if (correct) {
      sound.correct();
      if (phase === 'round1') stats.current.firstTry++;
      else stats.current.recovered++;
      setFeedback({ status: 'correct', reveal: '' });
      timer.current = setTimeout(advance, 650);
    } else {
      sound.wrong();
      if (phase === 'round1') missedR1.current.push(q);
      else stats.current.missedFinal.push(missedEntryOf(q));
      setFeedback({ status: 'wrong', reveal: revealOf(q) });
      timer.current = setTimeout(advance, 1300);
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  // Escape → ask before quitting (a run in progress shouldn't drop on one key).
  // Mount-guarded so the keypress can't cascade into the menu.
  useScreenKeys((e) => { if (e.key === 'Escape') setConfirmQuit((v) => !v); }, []);

  const missCount = phase === 'round1' ? missedR1.current.length : stats.current.missedFinal.length;
  const progress = Math.round((idx / total) * 100);
  const inputBorder = feedback?.status === 'correct' ? '#4CC15A' : feedback?.status === 'wrong' ? '#E24A4A' : '#C9A24B';

  return (
    <Screen column>
      <div style={{ position: 'relative', zIndex: 2, width: 960, background: '#37131e', border: '6px solid #EDE0C7', boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #2C0F1A', padding: '34px 40px 40px', display: 'flex', flexDirection: 'column', gap: 30 }}>
        {/* HUD */}
        <div style={{ background: '#3f1622', border: '4px solid #C9A24B', boxShadow: 'inset 0 0 0 2px rgba(201,162,75,.3)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 11, color: phase === 'round2' ? '#F2C94C' : '#C9A24B' }}>
            {phase === 'round2' ? 'ROUND 2' : MODE_LABEL[mode]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 12, color: '#EDE0C7' }}>{pad2(idx + 1)} / {pad2(total)}</div>
            <div style={{ width: 320, height: 20, background: '#2C0F1A', border: '3px solid #EDE0C7', padding: 2 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'repeating-linear-gradient(90deg,#4CC15A 0 8px,#3aa347 8px 10px)', transition: 'width .1s steps(4)' }} />
            </div>
          </div>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 11, color: '#E24A4A' }}>MISS {pad2(missCount)}</div>
        </div>

        {/* Prompt */}
        {q && q.kind === 'capitals' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '16px 0 6px' }}>
            <div style={{ fontSize: 26, letterSpacing: 5, color: '#C9A24B' }}>CAPITAL OF</div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 46, color: '#EDE0C7', textShadow: '5px 5px 0 #C9A24B', textAlign: 'center', lineHeight: 1.2 }}>{q.country.name.toUpperCase()}</div>
          </div>
        )}
        {q && q.kind === 'flags' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '6px 0 2px' }}>
            <div style={{ fontSize: 26, letterSpacing: 5, color: '#C9A24B' }}>NAME THIS COUNTRY</div>
            <img className="pixelated" src={`/flags/${q.country.iso2.toLowerCase()}.svg`} alt="flag" style={{ width: 300, height: 'auto', border: '5px solid #C9A24B', boxShadow: '7px 7px 0 rgba(0,0,0,.45)', display: 'block' }} />
          </div>
        )}
        {q && q.kind === 'letter' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '4px 0 2px' }}>
            <div style={{ fontSize: 26, letterSpacing: 4, color: '#C9A24B' }}>COUNTRY · CAPITAL INITIALS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 92, height: 92, background: '#2C0F1A', border: '5px solid #EDE0C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: 42, color: '#EDE0C7', boxShadow: '6px 6px 0 rgba(0,0,0,.45)' }}>{q.pair.countryInitial}</div>
                <div style={{ fontSize: 18, color: '#C9A24B', letterSpacing: 2 }}>COUNTRY</div>
              </div>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 28, color: '#C9A24B', marginBottom: 26 }}>·</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 92, height: 92, background: '#C9A24B', border: '5px solid #EDE0C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: 42, color: '#37131e', boxShadow: '6px 6px 0 rgba(0,0,0,.45)' }}>{q.pair.capitalInitial}</div>
                <div style={{ fontSize: 18, color: '#C9A24B', letterSpacing: 2 }}>CAPITAL</div>
              </div>
            </div>
            {/* Hint: reveal the capital(s). onMouseDown-preventDefault keeps the input focused. */}
            {hint ? (
              <div style={{ fontSize: 24, letterSpacing: 2, color: '#F2C94C' }}>CAPITAL: {hintCapitals}</div>
            ) : (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setHint(true)}
                style={{ fontFamily: "'VT323',monospace", fontSize: 20, letterSpacing: 2, color: '#37131e', background: '#C9A24B', border: 'none', padding: '5px 16px', cursor: 'pointer' }}
              >
                💡 HINT · show capital
              </button>
            )}
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 16, color: '#C9A24B' }}>▶</div>
          <div
            onClick={() => inputRef.current?.focus()}
            style={{ position: 'relative', width: 520, background: '#2C0F1A', border: `4px solid ${inputBorder}`, padding: '14px 20px', display: 'flex', alignItems: 'center', minHeight: 66 }}
          >
            <span style={{ fontSize: 36, color: '#EDE0C7', letterSpacing: 1, whiteSpace: 'pre' }}>{value}</span>
            {!feedback && <span className="blink-caret" style={{ display: 'inline-block', width: 12, height: 30, background: '#EDE0C7', marginLeft: 4 }} />}
            <input
              ref={inputRef}
              className="atlas-input"
              autoFocus
              value={value}
              disabled={!!feedback || banner || confirmQuit}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'transparent', padding: '14px 20px', fontSize: 36 }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 22, letterSpacing: 3, color: '#C9A24B', opacity: 0.8 }}>
          {q?.kind === 'capitals' && 'TYPE THE CAPITAL · PRESS ENTER TO CHECK'}
          {q?.kind === 'flags' && 'TYPE THE COUNTRY · PRESS ENTER TO CHECK'}
          {q?.kind === 'letter' && 'TYPE THE COUNTRY — capital checked for you · PRESS ENTER'}
        </div>
        {q?.kind === 'letter' && (
          <div style={{ textAlign: 'center', fontSize: 19, letterSpacing: 1, color: '#C9A24B', opacity: 0.65, marginTop: -18 }}>
            some pairs match 2+ countries — any is accepted (e.g. B · B → Brazil or Barbados)
          </div>
        )}
      </div>

      {/* Feedback row (mockup legend, made live) */}
      <div style={{ position: 'relative', zIndex: 2, width: 960, display: 'flex', gap: 14 }}>
        <div style={{ flex: 1, background: '#1f5f2a', border: '3px solid #4CC15A', padding: '11px 16px', fontSize: 21, color: '#EDE0C7', textAlign: 'center', opacity: feedback?.status === 'correct' ? 1 : 0.3 }}>✓ CORRECT — nice recall</div>
        <div style={{ flex: 1, background: '#5c1f22', border: '3px solid #E24A4A', padding: '11px 16px', fontSize: 21, color: '#EDE0C7', textAlign: 'center', opacity: feedback?.status === 'wrong' ? 1 : 0.3 }}>
          {feedback?.status === 'wrong' ? `✕ WRONG — → ${feedback.reveal}` : '✕ WRONG — reveal answer · into ROUND 2 queue'}
        </div>
      </div>

      {/* Quit hint */}
      <div style={{ position: 'relative', zIndex: 2, fontSize: 18, letterSpacing: 3, color: '#C9A24B', opacity: 0.55 }}>ESC · QUIT TO MENU</div>

      {confirmQuit && (
        <ConfirmQuit
          onQuit={onQuit}
          onCancel={() => { setConfirmQuit(false); setTimeout(() => inputRef.current?.focus(), 0); }}
        />
      )}

      {/* ROUND 2 overlay */}
      {banner && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,8,12,.86)' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, animation: 'popIn .2s steps(2)' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 40, color: '#F2C94C', textShadow: '5px 5px 0 #37131e' }}>ROUND 2</div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 20, color: '#EDE0C7', letterSpacing: 2 }}>SECOND CHANCE</div>
            <div style={{ fontSize: 24, color: '#C9A24B' }}>{missedR1.current.length} missed · shuffled once more</div>
          </div>
        </div>
      )}
    </Screen>
  );
}
