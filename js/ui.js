// Petits outils et composants d'interface partagés par toutes les pages.
import { CATEGORIES, COMMUNES } from './data.js';
import { isOpen } from './search.js';
import { prefs } from './store.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0).replace(/\u202f/g, ' ');
const UNIT_TXT = { jour: 'par jour', heure: 'par heure', mois: 'par mois', page: 'par page', forfait: 'forfait', 'séance': 'par séance' };
export function price(n, unit) {
  if (unit === 'pourcent') return `${n} % <small>des sommes recouvrées</small>`;
  if (!n || unit === 'devis') return 'Sur devis';
  return `${fmt(n)} FCFA${unit && UNIT_TXT[unit] ? ` <small>${UNIT_TXT[unit]}</small>` : ''}`;
}
export const priceText = (n, unit) => price(n, unit).replace(/<[^>]+>/g, '');
export const kindLabel = k => k === 'freelance' ? 'Indépendant' : 'Cabinet';
export const catOf = id => CATEGORIES.find(c => c.id === id) || { id, label: id, emoji: '🛍️', color: '#0B6E4F', subs: [] };
export const communeOf = id => COMMUNES.find(c => c.id === id);
export const communeName = id => (communeOf(id) || {}).name || id || '';
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
export const dateFr = iso => { try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
export const ago = iso => {
  const d = (Date.now() - new Date(iso)) / 864e5;
  if (d < 1) return 'aujourd\'hui'; if (d < 2) return 'hier'; if (d < 30) return `il y a ${Math.floor(d)} jours`; return dateFr(iso);
};
export const km = d => d == null ? '' : d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1).replace('.', ',') + ' km';
export const hours = s => `${s.open} h à ${s.close === 24 ? 'minuit' : s.close + ' h'}`;
export const normPhone = p => { const n = String(p || '').replace(/\D/g, ''); return n.length === 10 ? '225' + n : n; };

let toastT;
export function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3400);
}

export const WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>';

export function waHref(number, text) { return `https://wa.me/${normPhone(number)}?text=${encodeURIComponent(text)}`; }
export const waProduct = p => waHref(p.whatsapp, `Bonjour ${p.shop}, j'ai vu votre prestation « ${p.title} » sur Djéli Pro. Pouvons-nous en parler ?`);
export const waShop = s => waHref(s.whatsapp, `Bonjour ${s.name}, je vous ai trouvé sur Djéli Pro.`);

export function stars(r, size = '') {
  const full = Math.round(r || 0);
  return `<span class="stars ${size}" aria-label="${(r || 0).toFixed(1)} sur 5">${'★'.repeat(full)}<span class="off">${'★'.repeat(5 - full)}</span></span>`;
}
export function openBadge(it) {
  const o = isOpen(it);
  return `<span class="badge-open ${o ? 'is-open' : ''}"><i></i>${o ? 'Disponible' : 'Complet'}</span>`;
}
export function media(p, cls = 'card-media') {
  const c = catOf(p.cat);
  return p.photos && p.photos.length ? `<img src="${esc(p.photos[0])}" alt="" loading="lazy">` : `<span class="em-big" aria-hidden="true">${c.emoji}</span>`;
}

export function productCard(p, { dist = null, preview = false } = {}) {
  const c = catOf(p.cat), fav = prefs.has('favs', p.id);
  const href = preview ? 'javascript:void 0' : '#/s/' + p.id;
  return `<article class="card svc" style="--c:${c.color}">
    <a class="svc-top" href="${href}" aria-label="${esc(p.title)}"><span class="svc-ico" aria-hidden="true">${c.emoji}</span><span class="card-cat">${esc(p.sub || c.label)}</span>${p.plan === 'premium' ? '<span class="spons">À la une</span>' : ''}</a>
    ${preview ? '' : `<button class="fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${fav ? '♥' : '♡'}</button>`}
    <div class="card-body">
      <h3><a href="${href}">${esc(p.title)}</a></h3>
      <a class="svc-expert" href="${preview ? 'javascript:void 0' : '#/e/' + p.shopId}"><span class="mini-av" style="--c:${c.color}">${esc((p.shop || '?')[0])}</span><span><b>${esc(p.shop)}</b>${p.verified ? ' <span class="vbadge">✓</span>' : ''}<small>${kindLabel(p.kind)} · ${esc(communeName(p.commune))}${dist != null ? ', ' + km(dist) : ''}</small></span></a>
      <div class="card-meta">${p.reviews ? `<span>★ ${(p.rating || 0).toFixed(1)} (${p.reviews})</span>` : '<span class="new-tag">Nouveau</span>'}${p.delay ? `<span>⏱ ${esc(p.delay)}</span>` : ''}${p.remote ? '<span>🌐 À distance</span>' : ''}</div>
      <div class="card-price">${p.price && p.unit !== 'devis' && p.unit !== 'pourcent' && p.unit !== 'forfait' ? '<small>à partir de</small> ' : ''}${price(p.price, p.unit)}</div>
      <div class="card-actions">
        <a class="btn btn-green sm grow" href="${preview ? 'javascript:void 0' : `#/publier?expert=${p.shopId}&service=${p.id}`}">Demander un devis</a>
        <a class="ghost icon" href="${preview ? 'javascript:void 0' : waProduct(p)}" target="_blank" rel="noopener" data-wa="${p.id}" aria-label="WhatsApp" title="WhatsApp">${WA}</a>
      </div>
    </div></article>`;
}

export function shopCard(s) {
  const c = catOf(s.cat);
  return `<a class="shop-card expert" href="#/e/${s.id}" style="--c:${c.color}">
    <span class="shop-av" aria-hidden="true">${esc(s.name.slice(0, 1))}</span>
    <span class="shop-info"><b>${esc(s.name)}${s.verified ? ' <span class="vbadge">✓</span>' : ''}</b>
      <span class="hl">${esc(s.headline || c.label)}</span>
      <span>${kindLabel(s.kind)} · ${esc(communeName(s.commune))}${s.years ? ` · ${s.years} ans d'expérience` : ''}</span>
      <span>${s.reviews ? `${stars(s.rating, 'sm')} ${s.rating.toFixed(1)} (${s.reviews})` : 'Nouveau'}${s.remote ? ' · 🌐 À distance' : ''}</span></span>
    ${openBadge(s)}</a>`;
}

export function crumbs(list) {
  return `<nav class="crumbs" aria-label="Fil d'Ariane"><a href="#/">Accueil</a>${list.map(([l, h]) => h ? ` <span>›</span> <a href="${h}">${esc(l)}</a>` : ` <span>›</span> <span aria-current="page">${esc(l)}</span>`).join('')}</nav>`;
}
export function empty(title, text, action = '') {
  return `<div class="empty"><p class="empty-title">${esc(title)}</p><p>${text}</p>${action}</div>`;
}

/* ---------- Photos ---------- */
export function compress(file, max = 900) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', .72));
    };
    img.onerror = rej; img.src = url;
  });
}

/* ---------- Carte (Leaflet à la demande) ---------- */
let leafletP;
export function leaflet() {
  if (window.L) return Promise.resolve(window.L);
  return leafletP ||= new Promise((res, rej) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = () => res(window.L); s.onerror = rej; document.head.appendChild(s);
  });
}
export async function drawMap(el, points, { user = null, zoom = 12 } = {}) {
  let L; try { L = await leaflet(); } catch (e) { el.innerHTML = '<p class="map-err">La carte n\'a pas pu se charger. Vérifiez votre connexion.</p>'; return null; }
  if (el._map) { el._map.remove(); }
  const map = L.map(el, { scrollWheelZoom: false }).setView([5.335, -3.99], zoom);
  el._map = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  const pts = [];
  points.forEach(p => {
    const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="pin"><span>${p.emoji}</span></div>`, iconSize: [38, 38], iconAnchor: [4, 36] }) });
    if (p.popup) m.bindPopup(p.popup);
    m.addTo(map); pts.push([p.lat, p.lng]);
  });
  if (user) { L.circleMarker([user.lat, user.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2E6BD6', fillOpacity: 1 }).bindPopup('Vous êtes ici').addTo(map); pts.push([user.lat, user.lng]); }
  setTimeout(() => { map.invalidateSize(); if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 }); else if (pts.length) map.setView(pts[0], 15); }, 60);
  return map;
}

/* ---------- Géolocalisation partagée ---------- */
export const geo = { pos: null };
export function locate() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('Votre navigateur ne permet pas la localisation. Choisissez votre commune.'));
    navigator.geolocation.getCurrentPosition(p => { geo.pos = { lat: p.coords.latitude, lng: p.coords.longitude }; res(geo.pos); },
      () => rej(new Error('Localisation refusée. Choisissez votre commune dans la liste.')), { timeout: 10000, maximumAge: 300000 });
  });
}

export async function share({ title, text, url }) {
  if (navigator.share) { try { await navigator.share({ title, text, url }); } catch (e) {} return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Lien copié'); } catch (e) { toast(url); }
}
export const link = hash => location.origin + location.pathname + hash;

export function communeOptions(sel = '', withAll = false) {
  return (withAll ? `<option value="">Toutes les communes</option>` : '') +
    `<optgroup label="Abidjan">${COMMUNES.filter(c => !c.city).map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>` +
    `<optgroup label="Autres villes">${COMMUNES.filter(c => c.city).map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`;
}
export function catOptions(sel = '', withAll = false) {
  return (withAll ? `<option value="">Toutes les catégories</option>` : '') + CATEGORIES.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.emoji} ${esc(c.label)}</option>`).join('');
}
