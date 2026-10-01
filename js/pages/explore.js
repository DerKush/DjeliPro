import { CATEGORIES } from '../data.js';
import * as db from '../store.js';
import { parseQuery, runSearch } from '../search.js';
import { $, $$, esc, fmt, catOf, communeName, productCard, empty, geo, locate, toast, drawMap, communeOptions, catOptions, plural, crumbs } from '../ui.js';
import { searchBox, mountSearch } from '../searchbox.js';

const PAGE = 24;

// Transforme une phrase en paramètres explicites (chaque filtre devient retirable).
export function paramsFromQuery(q) {
  const p = parseQuery(q), o = new URLSearchParams();
  if (q) o.set('q', q);
  if (p.category) o.set('cat', p.category);
  if (p.commune) o.set('commune', p.commune);
  if (p.minPrice != null) o.set('min', p.minPrice);
  if (p.maxPrice != null) o.set('max', p.maxPrice);
  if (p.condition) o.set('cond', p.condition);
  if (p.openNow) o.set('open', 1);
  if (p.delivery) o.set('del', 1);
  if (p.verified) o.set('ver', 1);
  if (p.nearMe) o.set('near', 1);
  if (p.cheap) o.set('sort', 'price');
  if (p.remote) o.set('remote', 1);
  if (p.kind) o.set('kind', p.kind);
  o.set('p', 1);
  return o;
}

export function queryFromParams(qs) {
  const p = parseQuery(qs.get('q') || '');
  const keepText = p.text;
  Object.assign(p, { remote: false, kind: null, category: null, commune: null, minPrice: null, maxPrice: null, condition: null, openNow: false, delivery: false, verified: false, nearMe: false, cheap: false });
  p.text = keepText;
  if (qs.get('cat')) { p.category = qs.get('cat'); p.strictCat = true; }
  if (qs.get('sub')) p.sub = qs.get('sub');
  if (qs.get('commune')) p.commune = qs.get('commune');
  if (qs.get('min')) p.minPrice = +qs.get('min');
  if (qs.get('max')) p.maxPrice = +qs.get('max');
  if (qs.get('cond')) p.condition = qs.get('cond');
  p.remote = qs.get('remote') === '1'; p.kind = qs.get('kind') || null;
  p.openNow = qs.get('open') === '1'; p.delivery = qs.get('del') === '1'; p.verified = qs.get('ver') === '1'; p.nearMe = qs.get('near') === '1';
  return p;
}

export function searchProducts(qs) {
  const p = queryFromParams(qs);
  let sort = qs.get('sort') || 'auto';
  if (sort === 'distance' && !geo.pos) sort = 'auto';
  return runSearch(db.products(), p, { userPos: geo.pos, sort });
}

function go(qs) { location.hash = '#/explorer?' + qs.toString(); }

export default {
  title: 'Explorer',
  render({ query: qs }) {
    if (qs.get('q') && !qs.get('p')) { const n = paramsFromQuery(qs.get('q')); for (const [k, v] of qs) if (!n.has(k)) n.set(k, v); setTimeout(() => location.replace('#/explorer?' + n.toString())); return '<div class="wrap pad">Recherche…</div>'; }
    const res = searchProducts(qs);
    const view = qs.get('view') || 'list';
    const shown = +(qs.get('n') || PAGE);
    const cat = qs.get('cat') ? catOf(qs.get('cat')) : null;
    const chips = [];
    const chip = (label, key) => chips.push(`<span class="chip">${label}<button data-rm="${key}" aria-label="Retirer">×</button></span>`);
    const txt = parseQuery(qs.get('q') || '').text;
    if (txt.length) chip(`Mots <b>${esc(txt.join(' '))}</b>`, 'q');
    if (cat) chip(`Catégorie <b>${esc(cat.label)}</b>`, 'cat');
    if (qs.get('sub')) chip(`<b>${esc(qs.get('sub'))}</b>`, 'sub');
    if (qs.get('commune')) chip(`Commune <b>${esc(communeName(qs.get('commune')))}</b>`, 'commune');
    if (qs.get('min')) chip(`À partir de <b>${fmt(qs.get('min'))} FCFA</b>`, 'min');
    if (qs.get('max')) chip(`Jusqu'à <b>${fmt(qs.get('max'))} FCFA</b>`, 'max');
    if (qs.get('kind')) chip(`<b>${qs.get('kind') === 'freelance' ? 'Indépendants' : 'Cabinets'}</b>`, 'kind');
    if (qs.get('remote')) chip('<b>À distance</b>', 'remote');
    if (qs.get('open')) chip('<b>Disponibles</b>', 'open');
    if (qs.get('ver')) chip('<b>Vérifiés</b>', 'ver');
    if (qs.get('near')) chip('<b>Près de moi</b>', 'near');
    const title = qs.get('q') ? `« ${esc(qs.get('q'))} »` : cat ? esc(cat.label) : 'Toutes les prestations';
    const sort = qs.get('sort') || 'auto';
    const hasFilters = chips.length > 0;
    return `<div class="wrap pad">
      ${crumbs([['Explorer']])}
      <div class="explore-top">${searchBox(qs.get('q') || '', { id: 'eq' })}</div>
      ${chips.length ? `<div class="intent"><span class="understood">Compris :</span>${chips.join('')}<button class="reset" data-reset>Tout effacer</button></div>` : ''}
      <div class="explore-grid">
        <aside class="filters-side">
          <details class="filt" ${innerWidth > 900 ? 'open' : ''}><summary>Filtres${hasFilters ? ` (${chips.length})` : ''}</summary>
          <form id="filt" class="filt-form">
            <label>Domaine<select name="cat">${catOptions(qs.get('cat') || '', true).replace('Toutes les catégories', 'Tous les domaines')}</select></label>
            ${cat ? `<label>Spécialité<select name="sub"><option value="">Toutes</option>${cat.subs.map(s => `<option ${s === qs.get('sub') ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>` : ''}
            <label>Ville<select name="commune">${communeOptions(qs.get('commune') || '', true).replace('Toutes les communes', 'Toutes les villes')}</select></label>
            <fieldset><legend>Prix (FCFA)</legend><div class="row2">
              <input name="min" inputmode="numeric" placeholder="Min" value="${esc(qs.get('min') || '')}" aria-label="Prix minimum">
              <input name="max" inputmode="numeric" placeholder="Max" value="${esc(qs.get('max') || '')}" aria-label="Prix maximum"></div></fieldset>
            <fieldset><legend>Type d'expert</legend><div class="seg">
              ${[['', 'Tous'], ['cabinet', 'Cabinets'], ['freelance', 'Indépendants']].map(([v, l]) => `<label><input type="radio" name="kind" value="${v}" ${(qs.get('kind') || '') === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>
            <label class="check"><input type="checkbox" name="remote" value="1" ${qs.get('remote') ? 'checked' : ''}> Possible à distance</label>
            <label class="check"><input type="checkbox" name="open" value="1" ${qs.get('open') ? 'checked' : ''}> Disponibles maintenant</label>
            <label class="check"><input type="checkbox" name="ver" value="1" ${qs.get('ver') ? 'checked' : ''}> Experts vérifiés</label>
            <button type="button" class="btn btn-line btn-wide" data-near>${qs.get('near') && geo.pos ? '✓ Trié par distance' : '📍 Près de moi'}</button>
          </form></details>
          <button class="btn btn-line btn-wide alert-btn" data-alert>🔔 Me prévenir des nouvelles prestations</button>
          <a class="btn btn-kola btn-wide alert-btn" href="#/publier${qs.get('cat') ? '?cat=' + qs.get('cat') : ''}">Publier mon besoin</a>
        </aside>
        <section>
          <div class="res-head">
            <h1 class="h2 res-title">${title} <small>${plural(res.length, 'prestation', 'prestations')}</small></h1>
            <div class="res-tools">
              <label class="sel"><span class="sr">Trier</span><select id="sort">
                ${[['auto', 'Les plus pertinentes'], ['rating', 'Experts les mieux notés'], ['price', 'Prix croissant'], ['priceDesc', 'Prix décroissant'], ['recent', 'Plus récentes'], ['distance', 'Plus proches']].map(([v, l]) => `<option value="${v}" ${v === sort ? 'selected' : ''}>${l}</option>`).join('')}
              </select></label>
              <div class="view-toggle" role="tablist" aria-label="Affichage">
                <button role="tab" data-view="list" aria-selected="${view === 'list'}" class="vt ${view === 'list' ? 'on' : ''}">Liste</button>
                <button role="tab" data-view="map" aria-selected="${view === 'map'}" class="vt ${view === 'map' ? 'on' : ''}">Carte</button>
              </div>
            </div>
          </div>
          ${qs.get('near') && !geo.pos ? '<p class="note">Autorisez la localisation pour trier par distance.</p>' : ''}
          ${!res.length ? empty('Aucune prestation ne correspond encore.', `Retirez un filtre, ou <a href="#/publier">publiez votre besoin</a> : les experts concernés vous enverront leurs propositions.`)
            : view === 'map' ? '<div class="map-box"><div id="exMap" class="map"></div></div>'
            : `<div class="results">${res.slice(0, shown).map(x => productCard(x.it, { dist: x.dist })).join('')}</div>
               ${res.length > shown ? `<div class="more-wrap"><button class="btn btn-line" data-more>Voir plus (${res.length - shown} restants)</button></div>` : ''}`}
        </section>
      </div></div>`;
  },
  mount(el, { query: qs }) {
    if (!qs.get('p') && qs.get('q')) return;
    const qs2 = () => new URLSearchParams(qs.toString());
    mountSearch(el, q => { const n = paramsFromQuery(q); if (qs.get('view')) n.set('view', qs.get('view')); go(n); if (q) db.prefs.pushRecent('recentSearches', q); });
    const form = $('#filt', el);
    form && form.addEventListener('change', e => {
      const n = qs2(); const f = new FormData(form);
      ['cat', 'sub', 'commune', 'kind'].forEach(k => { const v = f.get(k); v ? n.set(k, v) : n.delete(k); });
      if (e.target.name === 'cat') n.delete('sub');
      ['min', 'max'].forEach(k => { const v = String(f.get(k) || '').replace(/\D/g, ''); v ? n.set(k, v) : n.delete(k); });
      ['open', 'remote', 'ver'].forEach(k => f.get(k) ? n.set(k, 1) : n.delete(k));
      n.delete('n'); n.set('p', 1); go(n);
    });
    $('#sort', el)?.addEventListener('change', async e => {
      const n = qs2(); n.set('sort', e.target.value);
      if (e.target.value === 'distance' && !geo.pos) { try { await locate(); } catch (err) { toast(err.message); } }
      go(n);
    });
    el.addEventListener('click', async e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.rm) { const n = qs2(); n.delete(t.dataset.rm); if (t.dataset.rm === 'cat') n.delete('sub'); n.set('p', 1); go(n); }
      else if (t.hasAttribute('data-reset')) go(new URLSearchParams('p=1'));
      else if (t.dataset.view) { const n = qs2(); n.set('view', t.dataset.view); go(n); }
      else if (t.hasAttribute('data-more')) { const n = qs2(); n.set('n', (+(qs.get('n') || PAGE)) + PAGE); go(n); }
      else if (t.hasAttribute('data-near')) {
        const n = qs2();
        if (qs.get('near') && geo.pos) { n.delete('near'); if (n.get('sort') === 'distance') n.delete('sort'); go(n); return; }
        try { await locate(); n.set('near', 1); n.set('sort', 'distance'); n.delete('commune'); go(n); toast('Les plus proches en premier.'); } catch (err) { toast(err.message); }
      } else if (t.hasAttribute('data-alert')) {
        const alerts = db.prefs.list('alerts');
        const label = qs.get('q') || [qs.get('cat') && catOf(qs.get('cat')).label, qs.get('commune') && communeName(qs.get('commune'))].filter(Boolean).join(', ') || 'Toutes les annonces';
        const hash = '#/explorer?' + qs.toString();
        if (alerts.some(a => a.hash === hash)) { toast('Cette alerte existe déjà.'); return; }
        alerts.unshift({ id: 'a' + Date.now(), hash, label, createdAt: new Date().toISOString(), seen: searchProducts(qs).map(x => x.it.id) });
        db.LS.set('alerts', alerts); toast('Alerte créée. Retrouvez-la dans Mon compte, rubrique Alertes.');
      }
    });
    if (qs.get('near') && !geo.pos) locate().then(() => window.dispatchEvent(new Event('djeli:render'))).catch(err => toast(err.message));
    const mapEl = $('#exMap', el);
    if (mapEl) {
      const res = searchProducts(qs);
      drawMap(mapEl, res.map(({ it }) => ({ lat: it.lat, lng: it.lng, emoji: catOf(it.cat).emoji,
        popup: `<b>${esc(it.title)}</b><br>${esc(it.shop)}<br><a href="#/s/${it.id}">Voir la prestation</a>` })), { user: geo.pos });
    }
  },
};
