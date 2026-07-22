import { useEffect } from 'react';
import { overlay } from './overlay.js';

// A window-level keydown handler that ignores events fired in the first ~160ms
// after the screen mounts. This defends against a single physical keypress
// "carrying over": when one screen's handler navigates and the next screen
// mounts, the same native event can still reach the new screen's freshly-added
// window listener and trigger a second transition. Real user keypresses always
// arrive later than the mount, so the guard never eats an intentional press.
//
// By default it also stands down while a global overlay (settings, a confirm
// dialog) is open, so the overlay owns the keyboard. Overlays themselves pass
// { overlayAware: false } so their own keys keep working.
export function useScreenKeys(handler, deps = [], { overlayAware = true } = {}) {
  useEffect(() => {
    const mountedAt = Date.now();
    const onKey = (e) => {
      if (Date.now() - mountedAt < 160) return;
      if (overlayAware && overlay.active()) return;
      handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
