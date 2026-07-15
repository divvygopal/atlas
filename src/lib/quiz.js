export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the round-1 question list for a quiz mode. `continent` (Capitals/Flags
// only) restricts the pool to one continent and uses all of it.
export function buildQuestions(mode, count, continent, { countries, letterPairs }) {
  let pool;
  if (mode === 'letter') pool = letterPairs;
  else pool = continent ? countries.filter((c) => c.continent === continent) : countries;
  const shuffled = shuffle(pool);
  const n = continent ? pool.length : count === 'all' ? pool.length : Math.min(count, pool.length);
  const taken = shuffled.slice(0, n);

  return taken.map((item, i) => {
    if (mode === 'letter') {
      return { id: `${item.key}-${i}`, kind: 'letter', pair: item };
    }
    return { id: `${item.iso2}-${i}`, kind: mode, country: item };
  });
}
