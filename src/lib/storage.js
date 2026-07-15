// localStorage high scores only (spec §3) — one value per (mode + variant).
// Nothing else is persisted; run state lives in memory.

const KEY = (mode, variant) => `atlas.best.${mode}.${variant}`;

export function getBest(mode, variant) {
  try {
    const v = localStorage.getItem(KEY(mode, variant));
    return v == null ? 0 : Number(v) || 0;
  } catch {
    return 0;
  }
}

// Records `score` if it beats the stored best. Returns { best, isNew }.
export function recordBest(mode, variant, score) {
  const prev = getBest(mode, variant);
  if (score > prev) {
    try {
      localStorage.setItem(KEY(mode, variant), String(score));
    } catch {
      /* ignore */
    }
    return { best: score, isNew: true };
  }
  return { best: prev, isNew: false };
}
