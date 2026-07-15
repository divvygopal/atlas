// Answer-checking helpers (spec §3).
// Case-insensitive, accent-insensitive, ignores punctuation/whitespace.

export function normalize(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // drop punctuation + whitespace
}

export function firstLetter(s) {
  const n = (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
  const m = n.match(/[A-Z]/);
  return m ? m[0] : '?';
}

// Does `input` match this country's name or any alias?
export function matchesCountryName(input, country) {
  const n = normalize(input);
  if (!n) return false;
  if (normalize(country.name) === n) return true;
  return (country.aliases || []).some((a) => normalize(a) === n);
}

// Does `input` match this country's capital or any capital alias?
export function matchesCapital(input, country) {
  const n = normalize(input);
  if (!n) return false;
  if (normalize(country.capital) === n) return true;
  return (country.capitalAliases || []).some((a) => normalize(a) === n);
}

// Resolve a typed string to a country from the full list (by name/alias).
export function resolveCountry(input, countries) {
  const n = normalize(input);
  if (!n) return null;
  return (
    countries.find(
      (c) =>
        normalize(c.name) === n ||
        (c.aliases || []).some((a) => normalize(a) === n),
    ) || null
  );
}
