import { useRef, useState } from 'react';
import outlineMap from '../data/outlineMap.json';

// Real vector country outlines (Natural Earth, equirectangular). A reference map
// the player can open, zoom and pan; found countries fill in. Same click-to-zoom
// + drag-to-pan interaction as the pixel WorldMap.
const { w, h, paths } = outlineMap;
const GOLD = '#C9A24B';
const DIMFILL = '#3a1620';
const ZOOM_LEVELS = [1, 2.5, 5];

export default function OutlineMap({ foundIso }) {
  const boxRef = useRef(null);
  const drag = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const clamp = (p, z) => {
    const box = boxRef.current;
    if (!box) return p;
    const bw = box.clientWidth, bh = box.clientHeight;
    return {
      x: Math.min(0, Math.max(bw - bw * z, p.x)),
      y: Math.min(0, Math.max(bh - bh * z, p.y)),
    };
  };
  const zoomAt = (cx, cy) => {
    const box = boxRef.current;
    const next = ZOOM_LEVELS[(ZOOM_LEVELS.indexOf(zoom) + 1) % ZOOM_LEVELS.length];
    if (next === 1) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const base = { x: (cx - pan.x) / zoom, y: (cy - pan.y) / zoom };
    setZoom(next);
    setPan(clamp({ x: box.clientWidth / 2 - base.x * next, y: box.clientHeight / 2 - base.y * next }, next));
  };
  const onMouseDown = (e) => {
    e.preventDefault();
    const rect = boxRef.current.getBoundingClientRect();
    drag.current = { sx: e.clientX, sy: e.clientY, sp: { ...pan }, cx: e.clientX - rect.left, cy: e.clientY - rect.top, moved: false };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (zoom > 1) setPan(clamp({ x: d.sp.x + dx, y: d.sp.y + dy }, zoom));
  };
  const onMouseUp = () => {
    const d = drag.current;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (d && !d.moved) zoomAt(d.cx, d.cy);
    drag.current = null;
  };

  return (
    <div
      ref={boxRef}
      onMouseDown={onMouseDown}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: zoom > 1 ? 'grab' : 'zoom-in', background: '#2C0F1A' }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{
          width: '100%', height: '100%', display: 'block',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: drag.current ? 'none' : 'transform .12s ease-out',
        }}
      >
        {paths.map((p) => (
          <path
            key={p.iso}
            d={p.d}
            fill={foundIso.has(p.iso) ? GOLD : DIMFILL}
            stroke={GOLD}
            strokeWidth={0.5}
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', bottom: 6, left: 8, fontFamily: "'VT323',monospace", fontSize: 17, color: '#EDE0C7', background: 'rgba(44,15,26,.8)', padding: '2px 10px', pointerEvents: 'none' }}>
        {zoom > 1 ? 'drag to move · click to zoom' : 'click to zoom in'}
      </div>
      {zoom > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          style={{ position: 'absolute', top: 6, right: 6, fontFamily: "'Press Start 2P',monospace", fontSize: 9, color: '#37131e', background: '#C9A24B', border: 'none', padding: '6px 8px', cursor: 'pointer' }}
        >
          RESET · {zoom}×
        </button>
      )}
    </div>
  );
}
