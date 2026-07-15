// Tiny 8-bit blips via WebAudio. Global mute toggle, persisted in localStorage.
let ctx = null;
let muted = (() => {
  try {
    return localStorage.getItem('atlas.muted') === '1';
  } catch {
    return false;
  }
})();

export function isMuted() {
  return muted;
}
export function setMuted(v) {
  muted = !!v;
  try {
    localStorage.setItem('atlas.muted', muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

function blip(freq, dur, type = 'square', gain = 0.06) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  if (a.state === 'suspended') a.resume();
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(a.destination);
  const t = a.currentTime;
  osc.start(t);
  g.gain.setValueAtTime(gain, t);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  osc.stop(t + dur);
}

export const sound = {
  correct() {
    blip(660, 0.08);
    setTimeout(() => blip(990, 0.09), 70);
  },
  wrong() {
    blip(160, 0.18, 'sawtooth', 0.05);
  },
  dupe() {
    blip(420, 0.07, 'triangle', 0.05);
  },
  select() {
    blip(520, 0.05);
  },
};
