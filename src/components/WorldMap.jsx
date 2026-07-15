import { useEffect, useRef, useState } from 'react';
import worldMap from '../data/worldMap.json';

// Real per-country boundaries (Natural Earth) rasterized at build time to a
// coarse grid; every country owns >=1 cell (spec §5). Drawn at 1px/cell on a
// small canvas and scaled up with image-rendering:pixelated for the blocky
// retro look. One correct guess lights exactly one country's cells.
const { cols, rows, cells } = worldMap;
const GOLD = '#C9A24B';
const DIM = '#5a2b38';
const MARKER = '#EDE0C7'; // pointer for a not-yet-found country
const ZOOM_LEVELS = [1, 2.5, 5];

// One representative "pointer" cell per country (the cell nearest its centroid).
const MARKERS = (() => {
  const byIso = new Map();
  for (const [x, y, iso] of cells) {
    if (!byIso.has(iso)) byIso.set(iso, []);
    byIso.get(iso).push([x, y]);
  }
  const out = new Map();
  for (const [iso, pts] of byIso) {
    const ax = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const ay = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let best = pts[0], bd = Infinity;
    for (const p of pts) {
      const d = (p[0] - ax) ** 2 + (p[1] - ay) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    out.set(iso, best);
  }
  return out;
})();

export default function WorldMap({ foundIso }) {
  const ref = useRef(null);
  const boxRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 }); // px offset of scaled canvas
  const drag = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cols, rows);
    for (const [x, y, iso] of cells) {
      ctx.fillStyle = foundIso.has(iso) ? GOLD : DIM;
      ctx.fillRect(x, y, 1, 1);
    }
    // Pointers for every country not yet found — they vanish as you name them.
    for (const [iso, [mx, my]] of MARKERS) {
      if (!foundIso.has(iso)) {
        ctx.fillStyle = MARKER;
        ctx.fillRect(mx, my, 1, 1);
      }
    }
  }, [foundIso]);

  const clamp = (p, z) => {
    const box = boxRef.current;
    if (!box) return p;
    const w = box.clientWidth, h = box.clientHeight;
    return {
      x: Math.min(0, Math.max(w - w * z, p.x)),
      y: Math.min(0, Math.max(h - h * z, p.y)),
    };
  };

  const zoomAt = (clickX, clickY) => {
    const box = boxRef.current;
    const next = ZOOM_LEVELS[(ZOOM_LEVELS.indexOf(zoom) + 1) % ZOOM_LEVELS.length];
    if (next === 1) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    // keep the clicked world point at the container centre after zooming
    const base = { x: (clickX - pan.x) / zoom, y: (clickY - pan.y) / zoom };
    const centred = { x: box.clientWidth / 2 - base.x * next, y: box.clientHeight / 2 - base.y * next };
    setZoom(next);
    setPan(clamp(centred, next));
  };

  const onMouseDown = (e) => {
    e.preventDefault(); // keep the text input focused
    const box = boxRef.current;
    const rect = box.getBoundingClientRect();
    drag.current = {
      startX: e.clientX, startY: e.clientY,
      startPan: { ...pan },
      clickX: e.clientX - rect.left, clickY: e.clientY - rect.top,
      moved: false,
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (zoom > 1) setPan(clamp({ x: d.startPan.x + dx, y: d.startPan.y + dy }, zoom));
  };
  const onMouseUp = () => {
    const d = drag.current;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (d && !d.moved) zoomAt(d.clickX, d.clickY); // a click, not a drag → zoom
    drag.current = null;
  };

  const cursor = zoom > 1 ? 'grab' : 'zoom-in';

  return (
    <div
      ref={boxRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'relative', width: '100%', overflow: 'hidden',
        cursor, border: zoom > 1 ? '2px solid #C9A24B' : '2px solid transparent',
      }}
    >
      <canvas
        ref={ref}
        width={cols}
        height={rows}
        className="pixelated"
        style={{
          width: '100%', height: 'auto', imageRendering: 'pixelated', display: 'block',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: drag.current ? 'none' : 'transform .12s steps(3)',
        }}
      />
      {zoom > 1 && (
        <>
          <div style={{ position: 'absolute', bottom: 4, left: 6, zIndex: 3, fontFamily: "'VT323',monospace", fontSize: 15, color: '#EDE0C7', background: 'rgba(44,15,26,.75)', padding: '1px 8px', pointerEvents: 'none' }}>drag to move</div>
          <button
            onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            style={{ position: 'absolute', top: 4, right: 4, zIndex: 3, fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: '#37131e', background: '#C9A24B', border: 'none', padding: '5px 7px', cursor: 'pointer' }}
          >
            RESET · {zoom}×
          </button>
        </>
      )}
    </div>
  );
}
