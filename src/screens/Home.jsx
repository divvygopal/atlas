import Screen from '../components/Screen.jsx';
import countriesData from '../data/countries.json';
import { sound } from '../lib/sound.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

export default function Home({ onStart, onBrowse }) {
  useScreenKeys(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.select();
        onStart();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault(); // stop the "b" from landing in the index search box
        sound.select();
        onBrowse();
      }
    },
    [onStart, onBrowse],
  );

  return (
    <Screen>
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: 900,
          background: '#37131e',
          border: '6px solid #EDE0C7',
          boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #2C0F1A',
          padding: '64px 56px 56px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 6, color: '#C9A24B' }}>
          ◆ &nbsp;WORLD GEOGRAPHY&nbsp; ◆
        </div>
        {/* pixel globe */}
        <div
          className="anim-float"
          style={{
            position: 'relative',
            width: 74,
            height: 74,
            border: '6px solid #C9A24B',
            borderRadius: '50%',
            margin: '6px 0',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: -6,
              right: -6,
              height: 5,
              background: '#C9A24B',
              transform: 'translateY(-50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -1,
              bottom: -1,
              left: '50%',
              width: 30,
              transform: 'translateX(-50%)',
              border: '5px solid #C9A24B',
              borderRadius: '50%',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 82,
            letterSpacing: 8,
            color: '#EDE0C7',
            textShadow: '7px 7px 0 #C9A24B',
            lineHeight: 1,
          }}
        >
          ATLAS
        </div>
        <div style={{ fontSize: 32, letterSpacing: 5, color: '#EDE0C7', opacity: 0.85 }}>
          know your world
        </div>
        <button
          className="anim-press"
          onClick={() => {
            sound.select();
            onStart();
          }}
          style={{
            marginTop: 22,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 18,
            color: '#37131e',
            background: '#EDE0C7',
            padding: '20px 34px',
            boxShadow: '6px 6px 0 #1a0910',
            letterSpacing: 1,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          PRESS START
        </button>
        <div style={{ marginTop: 14, fontSize: 22, letterSpacing: 3, color: '#C9A24B', opacity: 0.8 }}>
          v1.0 &nbsp;·&nbsp; {countriesData.length} COUNTRIES &nbsp;·&nbsp; OFFLINE
        </div>
        <button
          onClick={() => { sound.select(); onBrowse(); }}
          style={{
            marginTop: 2,
            fontFamily: "'VT323', monospace",
            fontSize: 24,
            letterSpacing: 2,
            color: '#37131e',
            background: '#C9A24B',
            border: 'none',
            padding: '8px 22px',
            boxShadow: '4px 4px 0 #1a0910',
            cursor: 'pointer',
          }}
        >
          ◆ COUNTRY INDEX &nbsp;·&nbsp; flags &amp; capitals &nbsp;<span style={{ opacity: 0.7 }}>[B]</span>
        </button>
      </div>
    </Screen>
  );
}
