import { useEffect } from 'react';

// A window-level keydown handler that ignores events fired in the first ~160ms
// after the screen mounts. This defends against a single physical keypress
// "carrying over": when one screen's handler navigates and the next screen
// mounts, the same native event can still reach the new screen's freshly-added
// window listener and trigger a second transition. Real user keypresses always
// arrive later than the mount, so the guard never eats an intentional press.
export function useScreenKeys(handler, deps = []) {
  useEffect(() => {
    const mountedAt = Date.now();
    const onKey = (e) => {
      if (Date.now() - mountedAt < 160) return;
      handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
