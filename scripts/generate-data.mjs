// Build-time data generator for ATLAS.
// Produces: src/data/countries.json, src/data/letterPairs.json, src/data/worldMap.json
// and copies the 193 needed flag SVGs into public/flags/.
//
// Run with: npm run gen:data
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as topojsonClient from 'topojson-client';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const worldCountries = require('world-countries');
const worldAtlas = require('world-atlas/countries-110m.json');

// ---------------------------------------------------------------------------
// 1. Country dataset (193 UN member states, Vatican excluded as an observer)
// ---------------------------------------------------------------------------

// Extra accepted aliases keyed by iso2, for names people reasonably type
// differently. altSpellings + official name from world-countries are merged in
// automatically; this is the curated layer on top.
const manualAliases = {
  US: ['USA', 'United States of America', 'America', 'U.S.', 'U.S.A.'],
  GB: ['UK', 'Britain', 'Great Britain', 'United Kingdom of Great Britain and Northern Ireland', 'England'],
  AE: ['UAE', 'Emirates'],
  CD: ['Democratic Republic of the Congo', 'DRC', 'Congo-Kinshasa', 'Congo (Kinshasa)', 'Zaire'],
  CG: ['Congo', 'Congo-Brazzaville', 'Congo (Brazzaville)'],
  KR: ['Korea', 'Republic of Korea'],
  KP: ['Korea', 'DPRK', 'Democratic People\'s Republic of Korea'],
  CZ: ['Czech Republic'],
  MM: ['Burma'],
  CV: ['Cabo Verde'],
  CI: ['Cote d\'Ivoire', 'Côte d\'Ivoire'],
  SZ: ['Swaziland'],
  TL: ['East Timor'],
  TR: ['Turkey'],
  MK: ['Macedonia', 'Republic of North Macedonia'],
  NL: ['Holland', 'The Netherlands'],
  FM: ['FSM', 'Federated States of Micronesia'],
  VN: ['Viet Nam'],
  LA: ['Lao', 'Lao PDR'],
  SY: ['Syrian Arab Republic'],
  RU: ['Russian Federation'],
  TZ: ['United Republic of Tanzania'],
  MD: ['Republic of Moldova'],
  BO: ['Bolivia'],
  VE: ['Venezuela'],
  IR: ['Iran'],
  BN: ['Brunei Darussalam'],
  ST: ['Sao Tome and Principe'],
  VC: ['St Vincent and the Grenadines', 'St. Vincent'],
  KN: ['St Kitts and Nevis', 'St. Kitts and Nevis'],
  LC: ['St Lucia', 'St. Lucia'],
  BA: ['Bosnia'],
  GW: ['Guinea Bissau'],
  DO: ['Dominican Rep'],
  VA: ['Vatican', 'Holy See', 'The Vatican'],
  TW: ['Chinese Taipei', 'Republic of China', 'Formosa', 'ROC'],
  PS: ['State of Palestine', 'Palestinian Territories', 'West Bank', 'Gaza'],
};

// A handful of capitals with well-known alternate spellings.
const capitalAliases = {
  UA: ['Kiev'], // Kyiv
  IN: ['New Delhi', 'Delhi'],
  MM: ['Naypyitaw', 'Nay Pyi Taw'],
  KZ: ['Nur-Sultan', 'Astana'],
  CN: ['Peking'],
  VN: ['Hanoi'],
};

function continentOf(c) {
  if (c.region === 'Americas') {
    return c.subregion === 'South America' ? 'South America' : 'North America';
  }
  return c.region; // Europe | Asia | Africa | Oceania
}

// 193 UN members + Vatican City (UN observer) + Taiwan & Palestine (added by
// request) = 196 entries.
const EXTRA = ['TW', 'PS'];
const members = worldCountries
  .filter((c) => c.unMember === true || EXTRA.includes(c.cca2))
  .sort((a, b) => a.name.common.localeCompare(b.name.common));

if (members.length !== 196) {
  throw new Error(`Expected 196 entries, got ${members.length}`);
}

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const countries = members.map((c) => {
  const name = c.name.common;
  const iso2 = c.cca2;
  const capital = (c.capital && c.capital[0]) || '';
  const aliasSet = new Set();
  const add = (v) => {
    if (v && norm(v) !== norm(name)) aliasSet.add(v);
  };
  add(c.name.official);
  (c.altSpellings || []).forEach((s) => {
    // altSpellings leads with the 2-letter code and packs translations; keep
    // the human-readable Latin ones only.
    if (s.length > 2 && /[a-zA-Z]/.test(s)) add(s);
  });
  (manualAliases[iso2] || []).forEach(add);

  const capAliases = (capitalAliases[iso2] || []).filter(
    (v) => norm(v) !== norm(capital),
  );

  return {
    name,
    aliases: [...aliasSet],
    capital,
    capitalAliases: capAliases,
    iso2,
    ccn3: c.ccn3,
    continent: continentOf(c),
  };
});

// Continent tally (sanity)
const tally = {};
countries.forEach((c) => (tally[c.continent] = (tally[c.continent] || 0) + 1));
console.log('Continent tally:', tally, '=', Object.values(tally).reduce((a, b) => a + b, 0));

// ---------------------------------------------------------------------------
// 2. Letter Country-Capital pairs
// ---------------------------------------------------------------------------
const firstLetter = (s) => {
  const n = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const m = n.match(/[A-Z]/);
  return m ? m[0] : '?';
};

const pairMap = new Map();
for (const c of countries) {
  const key = `${firstLetter(c.name)}·${firstLetter(c.capital)}`;
  if (!pairMap.has(key)) pairMap.set(key, []);
  pairMap.get(key).push(c.name);
}
const letterPairs = [...pairMap.entries()]
  .map(([key, answers]) => {
    const [countryInitial, capitalInitial] = key.split('·');
    return { key, countryInitial, capitalInitial, answers: answers.sort() };
  })
  .sort((a, b) => a.key.localeCompare(b.key));
console.log('Distinct letter pairs:', letterPairs.length);

// ---------------------------------------------------------------------------
// 3. World map — rasterize real per-country boundaries to a pixel grid
// ---------------------------------------------------------------------------
const COLS = 140;
const LAT_TOP = 83;
const LAT_BOTTOM = -56;
const lonStep = 360 / COLS;
const ROWS = Math.round((LAT_TOP - LAT_BOTTOM) / lonStep);
const latStep = (LAT_TOP - LAT_BOTTOM) / ROWS;

// ccn3 -> iso2 for keying map features to our dataset
const ccn3ToIso2 = new Map(countries.map((c) => [String(+c.ccn3), c.iso2]));

// Unwrap a ring so consecutive longitudes never jump more than 180° — this
// makes antimeridian-crossing countries (Fiji, Russia's Chukotka, Kiribati,
// the Aleutians) contiguous in a shifted longitude space instead of spanning
// the whole map and filling an entire latitude row during ray casting.
function unwrapRing(ring) {
  const out = [];
  let offset = 0;
  let prev = null;
  for (const [lon, lat] of ring) {
    if (prev !== null) {
      if (lon - prev > 180) offset -= 360;
      else if (lon - prev < -180) offset += 360;
    }
    out.push([lon + offset, lat]);
    prev = lon;
  }
  return out;
}

const fc = topojsonClient.feature(worldAtlas, worldAtlas.objects.countries);
// Build per-feature: iso2, unwrapped rings, and unwrapped bbox
const feats = [];
for (const f of fc.features) {
  const iso2 = ccn3ToIso2.get(String(+f.id));
  if (!iso2) continue; // not one of our 193 (e.g. Antarctica, territories)
  const rawPolys =
    f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const polys = rawPolys.map((poly) => poly.map(unwrapRing));
  let minX = Infinity, minY = 90, maxX = -Infinity, maxY = -90;
  for (const poly of polys)
    for (const ring of poly)
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  feats.push({ iso2, polys, bbox: [minX, minY, maxX, maxY] });
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function inPolysAt(x, y, f) {
  if (x < f.bbox[0] || x > f.bbox[2] || y < f.bbox[1] || y > f.bbox[3]) return false;
  for (const poly of f.polys) {
    if (!pointInRing(x, y, poly[0])) continue; // outer ring
    let inHole = false;
    for (let h = 1; h < poly.length; h++)
      if (pointInRing(x, y, poly[h])) { inHole = true; break; }
    if (!inHole) return true;
  }
  return false;
}
// Rings live in an unwrapped longitude space that may be centred near ±180, so
// test the query longitude at three 360° shifts and accept any hit.
function pointInFeature(x, y, f) {
  return inPolysAt(x, y, f) || inPolysAt(x + 360, y, f) || inPolysAt(x - 360, y, f);
}

const cellToIso = new Map(); // "x,y" -> iso2
const cellCenter = (cx, cy) => {
  const lon = -180 + (cx + 0.5) * lonStep;
  const lat = LAT_TOP - (cy + 0.5) * latStep;
  return [lon, lat];
};

for (let cy = 0; cy < ROWS; cy++) {
  for (let cx = 0; cx < COLS; cx++) {
    const [lon, lat] = cellCenter(cx, cy);
    for (const f of feats) {
      if (pointInFeature(lon, lat, f)) {
        cellToIso.set(`${cx},${cy}`, f.iso2);
        break;
      }
    }
  }
}

// Guarantee every country a >=1-cell footprint.
const assigned = new Set([...cellToIso.values()]);
// Manual representative points (lon,lat) for tiny nations that may not survive
// rasterization / are absent from the 110m dataset.
const manualCoords = {
  AD: [1.5, 42.5], AG: [-61.8, 17.1], BH: [50.5, 26.0], BB: [-59.5, 13.2],
  CV: [-23.6, 15.1], KM: [43.3, -11.6], DM: [-61.4, 15.4], GD: [-61.7, 12.1],
  KI: [173.0, 1.4], LI: [9.55, 47.16], MV: [73.5, 3.2], MT: [14.4, 35.9],
  MH: [171.2, 7.1], MU: [57.55, -20.3], FM: [158.2, 6.9], MC: [7.42, 43.74],
  NR: [166.9, -0.53], PW: [134.6, 7.5], KN: [-62.7, 17.3], LC: [-60.98, 13.9],
  VC: [-61.2, 13.25], WS: [-172.1, -13.76], SM: [12.46, 43.94], ST: [6.6, 0.25],
  SC: [55.5, -4.6], SG: [103.8, 1.35], TO: [-175.2, -21.2], TV: [179.2, -8.5],
  FJ: [178.0, -17.8], VA: [12.45, 41.9], TW: [121.0, 23.7],
  BN: [114.7, 4.9], QA: [51.2, 25.3], LU: [6.13, 49.8], CY: [33.4, 35.1],
  TL: [125.7, -8.8], DJ: [43.15, 11.6], GM: [-15.5, 13.4], LB: [35.9, 33.9],
  KW: [47.9, 29.3], BI: [29.9, -3.4], RW: [30.06, -1.94], BW: [24.7, -22.3],
  LS: [28.2, -29.6], SZ: [31.5, -26.5], GQ: [10.3, 1.6], PS: [35.2, 31.9],
};
const lonLatToCell = (lon, lat) => {
  let cx = Math.floor((lon + 180) / lonStep);
  let cy = Math.floor((LAT_TOP - lat) / latStep);
  cx = Math.max(0, Math.min(COLS - 1, cx));
  cy = Math.max(0, Math.min(ROWS - 1, cy));
  return [cx, cy];
};
function featureCentroid(iso2) {
  const f = feats.find((ff) => ff.iso2 === iso2);
  if (!f) return null;
  let sx = 0, sy = 0, n = 0;
  for (const poly of f.polys)
    for (const [x, y] of poly[0]) { sx += x; sy += y; n++; }
  return [sx / n, sy / n];
}
function nearestFreeCell(cx, cy) {
  for (let r = 0; r <= 4; r++) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        if (!cellToIso.has(`${x},${y}`)) return [x, y];
      }
  }
  return [cx, cy]; // fall back to overwriting
}

const missing = [];
for (const c of countries) {
  if (assigned.has(c.iso2)) continue;
  let coord = manualCoords[c.iso2] || featureCentroid(c.iso2);
  if (!coord) { missing.push(c.iso2 + ' ' + c.name); continue; }
  const [cx, cy] = lonLatToCell(coord[0], coord[1]);
  const [fx, fy] = nearestFreeCell(cx, cy);
  cellToIso.set(`${fx},${fy}`, c.iso2);
  assigned.add(c.iso2);
}
if (missing.length) console.warn('!! No footprint for:', missing);

// verify coverage
const covered = new Set([...cellToIso.values()]);
const uncovered = countries.filter((c) => !covered.has(c.iso2)).map((c) => c.iso2);
console.log(`Map: ${COLS}x${ROWS}, land cells=${cellToIso.size}, countries covered=${covered.size}/${countries.length}`);
if (uncovered.length) console.warn('!! Uncovered countries:', uncovered);

const cells = [...cellToIso.entries()].map(([k, iso2]) => {
  const [x, y] = k.split(',').map(Number);
  return [x, y, iso2];
});

const worldMap = { cols: COLS, rows: ROWS, cells };

// ---------------------------------------------------------------------------
// 3b. Real outline map — SVG paths per country (equirectangular projection).
//     A reference map the player can open, zoom and pan; found countries fill.
// ---------------------------------------------------------------------------
const OUT_W = 1000;
const OUT_LAT_TOP = 84;
const OUT_LAT_BOT = -58;
const OUT_H = Math.round((OUT_LAT_TOP - OUT_LAT_BOT) * (OUT_W / 360));
const projX = (lon) => +(((lon + 180) / 360) * OUT_W).toFixed(1);
const projY = (lat) => +(((OUT_LAT_TOP - lat) / (OUT_LAT_TOP - OUT_LAT_BOT)) * OUT_H).toFixed(1);

const outlinePaths = [];
for (const f of fc.features) {
  const iso2 = ccn3ToIso2.get(String(+f.id));
  if (!iso2) continue;
  const rawPolys =
    f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = '';
  for (const poly of rawPolys) {
    for (const ring of poly) {
      let prevLon = null;
      let open = false;
      for (const [lon, lat] of ring) {
        const cmd = prevLon === null || Math.abs(lon - prevLon) > 180 ? 'M' : 'L';
        if (cmd === 'M') { if (open) d += 'Z'; open = true; }
        d += `${cmd}${projX(lon)} ${projY(lat)}`;
        prevLon = lon;
      }
      if (open) d += 'Z';
    }
  }
  if (d) outlinePaths.push({ iso: iso2, d });
}
const outlineMap = { w: OUT_W, h: OUT_H, paths: outlinePaths };
console.log(`Outline map: ${outlinePaths.length} country paths, ${OUT_W}x${OUT_H}`);

// ---------------------------------------------------------------------------
// 4. Write outputs
// ---------------------------------------------------------------------------
const dataDir = path.join(root, 'src', 'data');
fs.mkdirSync(dataDir, { recursive: true });
// strip ccn3 from shipped country data (only needed for map keying)
const shipped = countries.map(({ ccn3, ...rest }) => rest);
fs.writeFileSync(path.join(dataDir, 'countries.json'), JSON.stringify(shipped));
fs.writeFileSync(path.join(dataDir, 'letterPairs.json'), JSON.stringify(letterPairs));
fs.writeFileSync(path.join(dataDir, 'worldMap.json'), JSON.stringify(worldMap));
fs.writeFileSync(path.join(dataDir, 'outlineMap.json'), JSON.stringify(outlineMap));

// Copy flags
const flagSrc = path.join(root, 'node_modules', 'flag-icons', 'flags', '4x3');
const flagDst = path.join(root, 'public', 'flags');
fs.mkdirSync(flagDst, { recursive: true });
let flagCount = 0;
const missingFlags = [];
for (const c of countries) {
  const src = path.join(flagSrc, c.iso2.toLowerCase() + '.svg');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(flagDst, c.iso2.toLowerCase() + '.svg'));
    flagCount++;
  } else missingFlags.push(c.iso2);
}
console.log(`Flags copied: ${flagCount}/${countries.length}`);
if (missingFlags.length) console.warn('!! Missing flags:', missingFlags);
console.log('Done.');
