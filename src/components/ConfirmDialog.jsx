import { useEffect, useState } from 'react';
import { overlay } from '../lib/overlay.js';
import { useScreenKeys } from '../lib/useScreenKeys.js';

// Reusable confirm dialog. Arrow keys move between the two buttons, Enter picks
// the highlighted one, Escape cancels — mouse works too. Defaults to the safe
// (cancel) side so a stray Enter never confirms a destructive action.
export default function ConfirmDialog({
  title,
  sub,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  confirmColor = '#D64545',
  onConfirm,
  onCancel,
}) {
  const [sel, setSel] = useState(1); // 0 = confirm, 1 = cancel (safe default)

  useEffect(() => {
    overlay.open();
    return () => overlay.close();
  }, []);

  useScreenKeys((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setSel((s) => (s === 0 ? 1 : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); (sel === 0 ? onConfirm : onCancel)(); }
    else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  }, [sel, onConfirm, onCancel], { overlayAware: false });

  const btn = (active, bg, fg, border) => ({
    fontFamily: "'Press Start 2P',monospace",
    fontSize: 14,
    color: fg,
    background: bg,
    border: border || 'none',
    padding: border ? '12px 24px' : '16px 24px',
    boxShadow: active ? '5px 5px 0 #C9A24B' : '5px 5px 0 rgba(26,9,16,.6)',
    outline: active ? '3px solid #F2C94C' : 'none',
    outlineOffset: 2,
    cursor: 'pointer',
  });

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,8,12,.92)' }}>
      <div style={{ background: '#EDE0C7', border: '6px solid #37131e', boxShadow: '12px 12px 0 rgba(0,0,0,.5), inset 0 0 0 5px #C9A24B', padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 24, color: '#37131e', letterSpacing: 2, textAlign: 'center' }}>{title}</div>
        {sub && <div style={{ fontSize: 24, color: '#9a5a2e', letterSpacing: 1, textAlign: 'center' }}>{sub}</div>}
        <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
          <button onClick={onConfirm} onMouseEnter={() => setSel(0)} onMouseDown={(e) => e.preventDefault()} style={btn(sel === 0, confirmColor, '#EDE0C7')}>{confirmLabel}</button>
          <button onClick={onCancel} onMouseEnter={() => setSel(1)} onMouseDown={(e) => e.preventDefault()} style={btn(sel === 1, '#EDE0C7', '#37131e', '4px solid #37131e')}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
