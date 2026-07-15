// Confirmation shown before leaving an in-progress game, so Escape can't drop a
// run by accident.
export default function ConfirmQuit({ onQuit, onCancel }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,8,12,.92)' }}>
      <div style={{ background: '#EDE0C7', border: '6px solid #37131e', boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B', padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 26, color: '#37131e', letterSpacing: 2 }}>QUIT TO MENU?</div>
        <div style={{ fontSize: 24, color: '#9a5a2e', letterSpacing: 1 }}>your progress in this run will be lost</div>
        <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
          <button
            onClick={onQuit}
            onMouseDown={(e) => e.preventDefault()}
            style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 14, color: '#EDE0C7', background: '#D64545', padding: '16px 24px', boxShadow: '5px 5px 0 #1a0910', border: 'none', cursor: 'pointer' }}
          >
            QUIT
          </button>
          <button
            onClick={onCancel}
            onMouseDown={(e) => e.preventDefault()}
            style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 14, color: '#37131e', background: '#EDE0C7', border: '4px solid #37131e', padding: '12px 24px', boxShadow: '5px 5px 0 rgba(55,19,30,.3)', cursor: 'pointer' }}
          >
            KEEP PLAYING
          </button>
        </div>
      </div>
    </div>
  );
}
