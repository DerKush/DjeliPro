import { CATEGORIES } from '../data.js';
import * as db from '../store.js';
import { distanceKm, norm } from '../search.js';
import { $, $$, esc, fmt, price, catOf, communeName, productCard, shopCard, stars, openBadge, crumbs, empty, WA, waProduct, waShop,
  drawMap, share, link, toast, geo, ago, communeOptions, catOptions, plural, normPhone, kindLabel } from '../ui.js';

const notFound = what => `<div class="wrap pad">${empty(`${what} introuvable.`, 'Elle a peut-être été retirée.', '<a class="btn btn-green" href="#/explorer">Explorer</a>')}</div>`;
const rerender = () => window.dispatchEvent(new Event('djeli:render'));

/* ---------- Tous les domaines ---------- */
export const categories = {
  title: 'Domaines d\'expertise',
  render() {
    const all = db.products();
    return `<div class="wrap pad">${crumbs([['Domaines']])}
      <h1 class="h1">Tous les domaines d'expertise</h1>
      <p class="lede">${CATEGORIES.length} domaines et ${CATEGORIES.reduce((t, c) => t + c.subs.length, 0)} spécialités pour tous les besoins de votre entreprise.</p>
      <div class="cat-list">${CATEGORIES.map(c => {
        const n = new Set(all.filter(p => p.cat === c.id).map(p => p.shopId)).size;
        return `<section class="cat-block" style="--c:${c.color}">
          <a class="cat-block-head" href="#/d/${c.id}"><span class="em" aria-hidden="true">${c.emoji}</span><span><b>${esc(c.label)}</b><small>${plural(n, 'expert', 'experts')}</small></span></a>
          <ul>${c.subs.map(s => `<li><a href="#/explorer?cat=${c.id}&sub=${encodeURIComponent(s)}&p=1">${esc(s)}</a> <small>${all.filter(p => p.cat === c.id && p.sub === s).length}</small></li>`).join('')}</ul>
        </section>`;
      }).join('')}</div></div>`;
  },
};

/* ---------- Un domaine ---------- */
export const category = {
  title: ({ params }) => catOf(params[0]).label,
  render({ params }) {
    const c = CATEGORIES.find(x => x.id === params[0]); if (!c) return notFound('Domaine');
    const items = db.products().filter(p => p.cat === c.id);
    const experts = db.shops().filter(s => s.cat === c.id || items.some(p => p.shopId === s.id)).sort((a, b) => b.verified - a.verified || b.rating - a.rating);
    const projs = db.projects().filter(p => p.cat === c.id && p.status === 'open').slice(0, 4);
    return `<div class="cat-hero" style="--c:${c.color}"><div class="wrap">${crumbs([['Domaines', '#/domaines'], [c.label]])}
        <h1 class="h1"><span aria-hidden="true">${c.emoji}</span> ${esc(c.label)}</h1>
        <p>${plural(experts.length, 'expert', 'experts')} et ${plural(items.length, 'prestation', 'prestations')}</p>
        <div class="sub-chips">${c.subs.map(s => `<a href="#/explorer?cat=${c.id}&sub=${encodeURIComponent(s)}&p=1">${esc(s)} <small>${items.filter(p => p.sub === s).length}</small></a>`).join('')}</div>
        <a class="btn btn-kola" href="#/publier?cat=${c.id}">Publier un besoin en ${esc(c.label.toLowerCase())}</a>
      </div></div>
      <div class="wrap pad">
        ${experts.length ? `<div class="block-head"><h2 class="h2">Experts</h2><a class="more" href="#/experts?cat=${c.id}">Tous</a></div><div class="shop-grid">${experts.slice(0, 6).map(shopCard).join('')}</div>` : ''}
        <div class="block-head"><h2 class="h2">Prestations</h2><a class="more" href="#/explorer?cat=${c.id}&p=1">Voir les ${items.length}</a></div>
        ${items.length ? `<div class="results">${items.slice(0, 12).map(p => productCard(p)).join('')}</div>` : empty('Pas encore de prestation ici.', 'Publiez votre besoin : les experts du domaine vous enverront leurs propositions.', `<a class="btn btn-kola" href="#/publier?cat=${c.id}">Publier un besoin</a>`)}
        ${projs.length ? `<div class="block-head"><h2 class="h2">Besoins ouverts</h2><a class="more" href="#/projets?cat=${c.id}">Tous</a></div><div class="proj-list">${projs.map(projectRow).join('')}</div>` : ''}
      </div>`;
  },
};

export function budgetText(p) {
  if (!p.budgetMin && !p.budgetMax) return 'Budget à proposer';
  if (p.budgetMin && p.budgetMax) return `${fmt(p.budgetMin)} à ${fmt(p.budgetMax)} FCFA`;
  return `${p.budgetMax ? 'Jusqu\'à ' + fmt(p.budgetMax) : 'À partir de ' + fmt(p.budgetMin)} FCFA`;
}
export function projectRow(p) {
  const c = catOf(p.cat);
  return `<a class="proj-row" href="#/projet/${p.id}" style="--c:${c.color}">
    <span class="proj-ico" aria-hidden="true">${c.emoji}</span>
    <span class="proj-main"><b>${esc(p.title)}</b><small>${esc(p.sub || c.label)} · ${esc(communeName(p.commune))}${p.remote ? ' · 🌐 à distance possible' : ''} · publié ${ago(p.createdAt)}</small></span>
    <span class="proj-side"><b>${budgetText(p)}</b><small>${plural(p.proposalsCount || 0, 'proposition', 'propositions')}</small></span></a>`;
}

/* ---------- Fiche prestation ---------- */
export const product = {
  title: ({ params }) => (db.getProduct(params[0]) || {}).title || 'Prestation',
  render({ params }) {
    const p = db.getProduct(params[0]); if (!p) return notFound('Prestation');
    const s = db.getShop(p.shopId), c = catOf(p.cat);
    db.prefs.track('views', p.id); db.prefs.pushRecent('viewed', p.id, 12);
    const me = db.user(), mine = me && s.owner === me.id;
    const others = db.products().filter(x => x.id !== p.id && x.shopId === p.shopId).slice(0, 4);
    const similar = db.products().filter(x => x.shopId !== p.shopId && x.cat === p.cat && x.sub === p.sub).slice(0, 8);
    const fav = db.prefs.has('favs', p.id);
    return `<div class="wrap pad">
      ${crumbs([[c.label, '#/d/' + c.id], [p.sub || c.label, `#/explorer?cat=${c.id}&sub=${encodeURIComponent(p.sub || '')}&p=1`], [p.title]])}
      <div class="product-grid">
        <div>
          <a class="card-cat" style="--c:${c.color}" href="#/d/${c.id}">${c.emoji} ${esc(p.sub || c.label)}</a>
          <h1 class="h1 p-title">${esc(p.title)}</h1>
          <div class="p-price">${p.price && !['devis', 'pourcent', 'forfait'].includes(p.unit) ? '<small>à partir de</small> ' : ''}${price(p.price, p.unit)}</div>
          <div class="p-tags">${p.delay ? `<span class="tag">⏱ ${esc(p.delay)}</span>` : ''}${p.remote ? '<span class="tag">🌐 Possible à distance</span>' : ''}${openBadge(p)}${db.canPayOnline(s) ? '<span class="tag ok">🔒 Paiement sécurisé</span>' : ''}</div>
          <h2 class="h3">Ce qui est inclus</h2>
          <p class="p-desc">${esc(p.deliverables || '')}</p>
          ${p.desc ? `<h2 class="h3">Description</h2><p class="p-desc">${esc(p.desc)}</p>` : ''}
          <div class="safety"><b>Comment ça marche</b><p>Envoyez votre demande : l'expert vous répond avec une proposition détaillée. Si vous l'acceptez, vous payez Djéli Pro, qui garde l'argent jusqu'à ce que vous validiez le travail livré.</p></div>
        </div>
        <aside class="p-info">
          <div class="panel">
            <a class="btn btn-kola btn-wide" href="#/publier?expert=${s.id}&service=${p.id}">Demander un devis</a>
            <div class="p-row">
              <a class="wa" href="${waProduct(p)}" target="_blank" rel="noopener" data-wa="${p.id}">${WA} WhatsApp</a>
              ${s.phone ? `<a class="btn btn-line" href="tel:+${normPhone(s.phone)}">📞 Appeler</a>` : ''}
            </div>
            <div class="p-row small-actions">
              <button class="ghost" data-fav="${p.id}" aria-pressed="${fav}">${fav ? '♥ Dans vos favoris' : '♡ Ajouter aux favoris'}</button>
              <button class="ghost" data-share-p>Partager</button>
              ${mine ? `<a class="ghost" href="#/vendre?id=${p.id}">✏️ Modifier</a>` : ''}
              <button class="ghost" data-report>Signaler</button>
            </div>
          </div>
          ${expertBox(s)}
        </aside>
      </div>
      ${others.length ? `<div class="block-head"><h2 class="h2">Autres prestations de ${esc(s.name)}</h2><a class="more" href="#/e/${s.id}">Voir le profil</a></div><div class="results">${others.map(x => productCard(x)).join('')}</div>` : ''}
      ${similar.length ? `<div class="block-head"><h2 class="h2">Autres experts en ${esc(p.sub || c.label)}</h2></div><div class="rail">${similar.map(x => productCard(x)).join('')}</div>` : ''}
    </div>`;
  },
  mount(el, { params }) {
    const p = db.getProduct(params[0]); if (!p) return;
    el.addEventListener('click', async e => {
      if (e.target.closest('[data-share-p]')) share({ title: p.title, text: `${p.title} par ${p.shop}, sur Djéli Pro`, url: link('#/s/' + p.id) });
      if (e.target.closest('[data-report]') && confirm('Signaler cette prestation à l\'équipe Djéli Pro ?')) { await db.hideProduct(p.id); toast('Merci, c\'est signalé.'); location.hash = '#/explorer'; }
    });
  },
};

function expertBox(s) {
  const c = catOf(s.cat);
  return `<a class="shop-box" href="#/e/${s.id}">
    <span class="shop-av" style="--c:${c.color}">${esc(s.name[0])}</span>
    <span><b>${esc(s.name)}${s.verified ? ' <span class="vbadge">✓ Vérifié</span>' : ''}</b>
    <span>${esc(s.headline || '')}</span>
    <span>${s.reviews ? `${stars(s.rating, 'sm')} ${s.rating.toFixed(1)} sur ${s.reviews} avis` : 'Nouveau sur Djéli Pro'}</span>
    <span>${kindLabel(s.kind)} · ${esc(communeName(s.commune))}${s.years ? ` · ${s.years} ans d'expérience` : ''}</span></span>
    <span class="more">Voir le profil</span></a>`;
}

/* ---------- Profil d'expert ---------- */
export const shop = {
  title: ({ params }) => (db.getShop(params[0]) || {}).name || 'Expert',
  render({ params }) {
    const s = db.getShop(params[0]); if (!s) return notFound('Profil');
    const c = catOf(s.cat);
    const items = db.products().filter(p => p.shopId === s.id);
    const reviews = db.reviewsOf(s.id);
    const me = db.user(), mine = me && s.owner === me.id;
    const followed = db.prefs.has('follows', s.id);
    const dist5 = [5, 4, 3, 2, 1].map(n => reviews.filter(r => r.rating === n).length);
    return `<div class="shop-hero" style="--c:${c.color}"><div class="wrap">
        ${crumbs([['Experts', '#/experts'], [s.name]])}
        <div class="shop-head">
          <span class="shop-av xl">${esc(s.name[0])}</span>
          <div><h1 class="h1">${esc(s.name)}${s.verified ? ' <span class="vbadge lg">✓ Vérifié</span>' : ''}</h1>
            <p class="shop-sub lead">${esc(s.headline || c.label)}</p>
            <p class="shop-sub">${c.emoji} ${esc(c.label)} · ${kindLabel(s.kind)} · ${esc(communeName(s.commune))}${s.remote ? ' · 🌐 Missions à distance' : ''}</p>
            <p class="shop-sub">${s.reviews ? `${stars(s.rating)} <b>${s.rating.toFixed(1)}</b> sur ${s.reviews} avis · ` : ''}${openBadge(s)}</p></div>
        </div>
        <div class="p-row">
          <a class="btn btn-kola" href="#/publier?expert=${s.id}">Demander un devis</a>
          <a class="wa" href="${waShop(s)}" target="_blank" rel="noopener">${WA} WhatsApp</a>
          ${s.phone ? `<a class="btn btn-line" href="tel:+${normPhone(s.phone)}">📞 Appeler</a>` : ''}
          <button class="btn btn-line" data-follow aria-pressed="${followed}">${followed ? '✓ Enregistré' : '+ Enregistrer'}</button>
          <button class="btn btn-line" data-share-s>Partager</button>
          ${mine ? '<a class="btn btn-line" href="#/espace">Gérer mon profil</a>' : ''}
        </div>
      </div></div>
      <div class="wrap pad">
        <div class="facts">
          <div><b>${s.years || '—'}</b><span>ans d'expérience</span></div>
          <div><b>${s.kind === 'freelance' ? 'Indépendant' : (s.team || 1) + ' pers.'}</b><span>${s.kind === 'freelance' ? 'travaille seul' : 'dans l\'équipe'}</span></div>
          <div><b>${esc(s.languages || 'FR')}</b><span>langues</span></div>
          <div><b>${items.length}</b><span>prestations</span></div>
        </div>
        <div class="profile-grid">
          <div>
            <h2 class="h2">Présentation</h2><p class="lede">${esc(s.desc || '')}</p>
            <h2 class="h2">Prestations</h2>
            ${items.length ? `<div class="results">${items.map(p => productCard(p)).join('')}</div>` : empty('Pas encore de prestation publiée.', 'Vous pouvez quand même demander un devis.')}
          </div>
          <aside>
            ${s.certifications && s.certifications.length ? `<section class="panel"><h2 class="h3">Agréments et certifications</h2><ul class="check-list">${s.certifications.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
            ${s.clients && s.clients.length ? `<section class="panel"><h2 class="h3">Références</h2><ul class="check-list">${s.clients.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
            <section class="panel"><h2 class="h3">Localisation</h2><p>${esc(communeName(s.commune))}, Côte d'Ivoire${s.remote ? '<br>Intervient aussi à distance dans tout le pays.' : ''}</p></section>
          </aside>
        </div>
        <section id="avis" class="gap"><h2 class="h2">Avis clients <small>${s.reviews}</small></h2>
          ${s.reviews ? `<div class="rev-sum"><div class="rev-big">${s.rating.toFixed(1)}<span>${stars(s.rating)}</span></div>
            <div class="rev-bars">${dist5.map((n, i) => `<div><span>${5 - i} ★</span><i style="--w:${reviews.length ? n / reviews.length * 100 : 0}%"></i></div>`).join('')}</div></div>` : ''}
          ${mine ? '' : `<form id="revForm" class="rev-form">
            <fieldset class="star-in"><legend>Votre note</legend>${[5, 4, 3, 2, 1].map(n => `<input type="radio" id="st${n}" name="rating" value="${n}" ${n === 5 ? 'checked' : ''}><label for="st${n}" title="${n} sur 5">★</label>`).join('')}</fieldset>
            <label>Votre avis sur la mission<textarea name="text" required maxlength="400" rows="3" placeholder="Qualité du travail, respect des délais, communication…"></textarea></label>
            <button class="btn btn-green">Publier mon avis</button></form>`}
          <ul class="rev-list">${reviews.map(r => `<li><div><b>${esc(r.author)}</b> ${stars(r.rating, 'sm')} <small>${ago(r.createdAt)}</small></div><p>${esc(r.text)}</p></li>`).join('') || '<li class="muted">Aucun avis pour le moment.</li>'}</ul>
        </section>
      </div>`;
  },
  mount(el, { params }) {
    const s = db.getShop(params[0]); if (!s) return;
    el.addEventListener('click', e => {
      if (e.target.closest('[data-follow]')) { const on = db.prefs.toggle('follows', s.id); toast(on ? 'Expert enregistré dans vos favoris.' : 'Retiré de vos favoris.'); rerender(); }
      if (e.target.closest('[data-share-s]')) share({ title: s.name, text: `${s.name}, ${s.headline || ''}, sur Djéli Pro`, url: link('#/e/' + s.id) });
    });
    $('#revForm', el)?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!db.user()) { sessionStorage.setItem('djeli.after', location.hash + '#avis'); toast('Créez votre compte pour publier votre avis.'); location.hash = '#/compte'; return; }
      const f = new FormData(e.target);
      try { await db.addReview({ shopId: s.id, rating: f.get('rating'), text: f.get('text').trim() }); toast('Merci pour votre avis'); rerender(); } catch (err) { toast(err.message); }
    });
  },
};

/* ---------- Annuaire des experts ---------- */
export const shops = {
  title: 'Experts',
  render({ query }) {
    const q = norm(query.get('q') || ''), cat = query.get('cat') || '', commune = query.get('commune') || '', kind = query.get('kind') || '', sort = query.get('sort') || 'rating';
    let list = db.shops().filter(s => (!cat || s.cat === cat) && (!commune || s.commune === commune) && (!kind || s.kind === kind) && (!query.get('ver') || s.verified)
      && (!query.get('remote') || s.remote) && (!query.get('dispo') || s.available) && (!q || norm([s.name, s.desc, s.headline, catOf(s.cat).label].join(' ')).includes(q)));
    list.sort(sort === 'name' ? (a, b) => a.name.localeCompare(b.name) : sort === 'xp' ? (a, b) => (b.years || 0) - (a.years || 0)
      : (a, b) => b.verified - a.verified || b.rating * Math.log10(10 + b.reviews) - a.rating * Math.log10(10 + a.reviews));
    return `<div class="wrap pad">${crumbs([['Experts']])}
      <h1 class="h1">Trouver un expert</h1>
      <p class="muted">${plural(list.length, 'cabinet ou indépendant', 'cabinets et indépendants')} en Côte d'Ivoire.</p>
      <form id="shopFilt" class="inline-filters">
        <input name="q" type="search" placeholder="Nom, compétence…" value="${esc(query.get('q') || '')}" aria-label="Recherche">
        <select name="cat" aria-label="Domaine">${catOptions(cat, true).replace('Toutes les catégories', 'Tous les domaines')}</select>
        <select name="commune" aria-label="Ville">${communeOptions(commune, true).replace('Toutes les communes', 'Toutes les villes')}</select>
        <select name="kind" aria-label="Type"><option value="">Cabinets et indépendants</option><option value="cabinet" ${kind === 'cabinet' ? 'selected' : ''}>Cabinets</option><option value="freelance" ${kind === 'freelance' ? 'selected' : ''}>Indépendants</option></select>
        <select name="sort" aria-label="Trier">${[['rating', 'Mieux notés'], ['xp', 'Plus expérimentés'], ['name', 'Nom (A à Z)']].map(([v, l]) => `<option value="${v}" ${v === sort ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <label class="check"><input type="checkbox" name="ver" value="1" ${query.get('ver') ? 'checked' : ''}> Vérifiés</label>
        <label class="check"><input type="checkbox" name="remote" value="1" ${query.get('remote') ? 'checked' : ''}> À distance</label>
        <label class="check"><input type="checkbox" name="dispo" value="1" ${query.get('dispo') ? 'checked' : ''}> Disponibles</label>
      </form>
      ${list.length ? `<div class="shop-grid">${list.map(shopCard).join('')}</div>` : empty('Aucun expert ne correspond.', 'Publiez votre besoin : les experts concernés vous écriront.', '<a class="btn btn-kola" href="#/publier">Publier un besoin</a>')}
    </div>`;
  },
  mount(el) {
    const f = $('#shopFilt', el);
    const apply = () => { const d = new FormData(f), n = new URLSearchParams(); for (const [k, v] of d) if (v) n.set(k, v); location.hash = '#/experts?' + n.toString(); };
    f.addEventListener('change', apply);
    f.addEventListener('submit', e => { e.preventDefault(); apply(); });
  },
};
