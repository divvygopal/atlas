// Tiny global flag so screen-level keyboard shortcuts (game number keys, index
// shortcuts) stand down while a global overlay (settings, its reset confirm) is
// open — the overlay handles its own keys instead.
let count = 0;
export const overlay = {
  open() {
    count += 1;
  },
  close() {
    count = Math.max(0, count - 1);
  },
  active() {
    return count > 0;
  },
};
