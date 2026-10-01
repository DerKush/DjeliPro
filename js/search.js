// Recherche intelligente : comprend une phrase en français courant
// (catégorie, commune, budget, ouvert, livraison, près de moi) et tolère les fautes de frappe.
import { CATEGORIES, COMMUNES } from './data.js';

export const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[’'`\-_,;:!?()"]/g, ' ').replace(/\s+/g, ' ').trim();

const STOP = new Set(('je j cherche recherche un une des de du d a au aux le la les l pour pas cher chere chers moins plus dans sur en et ou qui ' +
  'veux voudrais besoin trouver acheter achete il y me mon ma mes avec fcfa cfa f francs franc pres moi cote vers quartier stp svp bon bonne ' +
  'qualite meilleur meilleure max maximum min minimum sous entre jusqu jusque ouvert ouverte ouverts maintenant livraison livre livrer ' +
  'verifie verifiee fiable serieux vite abidjan expert experts consultant consultants prestataire prestataires professionnel professionnels service services besoin entreprise societe pme neuf neuve neufs occasion occasions reconditionne seconde main quelqu quelqu un est ce que qu tu vous nous ici chez bien top prix').split(' '));

const ALIASES = COMMUNES.flatMap(c => c.aliases.map(a => ({ a, id: c.id }))).sort((x, y) => y.a.length - x.a.length);

const NUM = '(\\d{1,3}(?:[ .]\\d{3})+|\\d+(?:[.,]\\d+)?)(?:\\s*(k|mille|millions?|m)\\b)?';
const CUR = '(?:\\s*(?:f|fcfa|cfa|francs?)\\b)?';
function toN(n, u) {
  let v = parseFloat(n.replace(/[ .](?=\d{3})/g, '').replace(',', '.'));
  if (u === 'k' || u === 'mille') v *= 1000;
  if (u === 'm' || (u && u.startsWith('million'))) v *= 1e6;
  return Math.round(v);
}

export function detectCategory(s) {
  const t = ' ' + norm(s) + ' ';
  let best = null, bestScore = 0;
  for (const c of CATEGORIES) {
    let sc = 0;
    for (const k of c.kw) if (t.includes(' ' + k + ' ') || t.includes(' ' + k + 's ') || t.includes(' ' + k + 'x ')) sc += (c.w || 1);
    if (sc > bestScore) { bestScore = sc; best = c.id; }
  }
  return best;
}

export function parseQuery(raw) {
  const r = { raw: raw || '', text: [], category: null, sub: null, condition: null, commune: null, maxPrice: null, minPrice: null, remote: false, kind: null,
    cheap: false, openNow: false, delivery: false, verified: false, nearMe: false };
  let s = ' ' + norm(raw) + ' ';
  if (!s.trim()) return r;
  const near = /\b(pres de (?:moi|chez moi)|a cote|autour de moi|proche de moi|pres d ici|dans mon quartier)\b/g;
  if (near.test(s)) { r.nearMe = true; s = s.replace(near, ' '); }
  if (/\b(disponibles?|dispo|immediatement|urgent|urgence)\b/.test(s)) { r.openNow = true; s = s.replace(/\b(disponibles?|dispo|immediatement|urgent|urgence)\b/g, ' '); }
  if (/\b(a distance|en ligne|remote|teletravail|en visio)\b/.test(s)) { r.remote = true; s = s.replace(/\b(a distance|en ligne|remote|teletravail|en visio)\b/g, ' '); }
  if (/\b(freelances?|independante?s?)\b/.test(s)) { r.kind = 'freelance'; s = s.replace(/\b(freelances?|independante?s?)\b/g, ' '); }
  else if (/\b(cabinets?|agences?)\b/.test(s)) { r.kind = 'cabinet'; s = s.replace(/\b(cabinets?|agences?)\b/g, ' '); }
  if (/\blivr(aison|e|er|ent|es)\b/.test(s)) r.delivery = true;
  if (/\b(verifie(e|s)?|fiable|serieux)\b/.test(s)) r.verified = true;
  if (/\b(occasion|reconditionnee?s?|seconde main|d occasion)\b/.test(s)) r.condition = 'occasion';
  else if (/\b(neuf|neuve|neufs|neuves)\b/.test(s)) r.condition = 'neuf';
  if (/\b(pas chers?|pas chere|moins chers?|bon prix|economique|petit prix)\b/.test(s)) r.cheap = true;

  let m;
  if ((m = s.match(new RegExp('entre\\s+' + NUM + CUR + '\\s+et\\s+' + NUM + CUR)))) {
    r.minPrice = toN(m[1], m[2]); r.maxPrice = toN(m[3], m[4]); s = s.replace(m[0], ' ');
  }
  if (r.maxPrice == null && (m = s.match(new RegExp('(?:moins de|max(?:imum)?|sous|jusqu a|pas plus de|budget(?: de)?|a)\\s+' + NUM + CUR)))) {
    const v = toN(m[1], m[2]); if (v >= 100) { r.maxPrice = v; s = s.replace(m[0], ' '); }
  }
  if ((m = s.match(new RegExp('(?:plus de|min(?:imum)?|a partir de|au moins)\\s+' + NUM + CUR)))) {
    const v = toN(m[1], m[2]); if (v >= 100) { r.minPrice = v; s = s.replace(m[0], ' '); }
  }
  if (r.maxPrice == null && (m = s.match(new RegExp('\\b' + NUM + '\\s*(?:f|fcfa|cfa|francs?)\\b')))) {
    r.maxPrice = toN(m[1], m[2]); s = s.replace(m[0], ' ');
  }
  if (r.maxPrice == null && (m = s.match(/\b(\d+(?:[.,]\d+)?)\s*k\b/))) {
    r.maxPrice = Math.round(parseFloat(m[1].replace(',', '.')) * 1000); s = s.replace(m[0], ' ');
  }
  for (const { a, id } of ALIASES) {
    if (s.includes(' ' + a + ' ')) { r.commune = id; s = s.replace(' ' + a + ' ', ' '); break; }
  }
  r.category = detectCategory(s);
  r.text = s.split(' ').filter(t => t && t.length > 1 && !STOP.has(t));
  return r;
}

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// Djéli Pro : « ouvert » signifie « disponible pour une nouvelle mission ».
export function isOpen(it) { return it.available !== false; }

export function distanceKm(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function prepare(it) {
  const cat = CATEGORIES.find(c => c.id === it.cat);
  it._hay = norm([it.title, it.shop, it.tags, it.sub, it.desc, it.deliverables, it.headline, cat && cat.label].join(' '));
  it._words = [...new Set(it._hay.split(' '))];
  return it;
}

const sortPrice = it => (!it.price || it.unit === 'pourcent' || it.unit === 'devis') ? 1e15 : it.price;
export function runSearch(items, p, { userPos = null, sort = 'auto', favs = null, onlyFavs = false } = {}) {
  const toks = p.text;
  let res = items.map(it => {
    let score = 0;
    for (const t of toks) {
      if (it._hay.includes(t)) score += t.length > 2 ? 3 : 1;
      else if (t.length >= 4 && it._words.some(w => Math.abs(w.length - t.length) <= 2 && lev(w, t) <= (t.length > 6 ? 2 : 1))) score += 1.5;
      else if (t.length >= 5 && it._words.some(w => w.startsWith(t.slice(0, 4)))) score += 0.8;
    }
    if (p.category && it.cat === p.category) score += 4;
    const dist = userPos ? distanceKm(userPos, it) : null;
    return { it, score, dist };
  }).filter(({ it, score }) => {
    if (onlyFavs && !(favs && favs.has(it.id))) return false;
    if (p.shopId && it.shopId !== p.shopId) return false;
    if (p.sub && it.sub !== p.sub) return false;
    if (p.condition && it.condition !== p.condition) return false;
    if (p.remote && !it.remote) return false;
    if (p.kind && it.kind !== p.kind) return false;
    if (p.category && it.cat !== p.category && (score < 6 || p.strictCat)) return false;
    if (!p.category && toks.length && score === 0) return false;
    if (p.commune && !p.nearMe && it.commune !== p.commune) return false;
    const quoted = !it.price || it.unit === 'pourcent' || it.unit === 'devis';
    if (p.maxPrice != null && !quoted && it.price > p.maxPrice) return false;
    if (p.minPrice != null && !quoted && it.price < p.minPrice) return false;
    if (p.openNow && !isOpen(it)) return false;
    if (p.delivery && !it.delivery) return false;
    if (p.verified && !it.verified) return false;
    return true;
  });
  const quality = x => x.it.rating * Math.log10(10 + x.it.reviews) + (x.it.verified ? 0.5 : 0) + (x.it.plan === 'premium' ? 3 : 0);
  let mode = sort;
  if (mode === 'auto') mode = (p.nearMe && userPos) ? 'distance' : p.cheap ? 'price' : 'relevance';
  const cmp = {
    relevance: (a, b) => (b.score - a.score) || (quality(b) - quality(a)),
    price: (a, b) => sortPrice(a.it) - sortPrice(b.it),
    rating: (a, b) => quality(b) - quality(a),
    recent: (a, b) => String(b.it.createdAt).localeCompare(String(a.it.createdAt)),
    priceDesc: (a, b) => (sortPrice(b.it) % 1e15) - (sortPrice(a.it) % 1e15),
    distance: (a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9),
  }[mode] || (() => 0);
  return res.sort(cmp);
}
