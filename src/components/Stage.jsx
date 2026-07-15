import { useEffect, useState } from 'react';
import MuteButton from './MuteButton.jsx';

// The app is a fixed 1512×982 design canvas (spec §6, desktop-only, no
// responsive layout). We render at native size and scale the whole stage down
// with a transform to fit whatever desktop window it's in — layout stays
// pixel-identical to the mockups.
export const CANVAS_W = 1512;
export const CANVAS_H = 982;

export default function Stage({ children }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(
        window.innerWidth / CANVAS_W,
        window.innerHeight / CANVAS_H,
      );
      setScale(s);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#160a0e',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flex: 'none',
        }}
      >
        {children}
      </div>
      <MuteButton />
    </div>
  );
}
