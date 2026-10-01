// Besoins publiés par les entreprises et propositions des experts.
import { CONFIG } from '../config.js';
import { CATEGORIES } from '../data.js';
import * as db from '../store.js';
import { detectCategory, norm } from '../search.js';
import { $, $$, esc, fmt, catOf, communeName, crumbs, empty, toast, communeOptions, catOptions, plural, ago, dateFr, waHref, WA, stars, kindLabel, link } from '../ui.js';
import { budgetText, projectRow } from './catalog.js';
import { accountForm, mountAccountForm } from './account.js';

const rerender = () => window.dispatchEvent(new Event('djeli:render'));
const DURATIONS = [[7, '1 semaine'], [14, '2 semaines'], [30, '1 mois'], [60, '2 mois'], [90, '3 mois'], [180, '6 mois'], [365, 'Plus de 6 mois']];
const durText = d => (DURATIONS.find(([v]) => v >= d) || DURATIONS[DURATIONS.length - 1])[1];
const STATUS = { open: ['Ouvert aux propositions', 'ok'], assigned: ['Expert choisi', ''], closed: ['Fermé', ''] };
const isPublic = p => !p.invitedShop && !p.invited;

/* ---------- Liste des besoins ouverts ---------- */
export const projectsList = {
  title: 'Besoins des entreprises',
  render({ query }) {
    const cat = query.get('cat') || '', q = norm(query.get('q') || ''), commune = query.get('commune') || '';
    const list = db.projects().filter(p => p.status === 'open' && isPublic(p) && (!cat || p.cat === cat) && (!commune || p.commune === commune)
      && (!query.get('remote') || p.remote) && (!q || norm(p.title + ' ' + p.desc + ' ' + (p.sub || '')).includes(q)));
    const shop = db.myShop();
    return `<div class="wrap pad">${crumbs([['Besoins']])}
      <div class="block-head top"><div><h1 class="h1">Besoins des entreprises</h1>
        <p class="muted">${plural(list.length, 'besoin ouvert', 'besoins ouverts')}. ${shop ? 'Envoyez vos propositions aux besoins de votre domaine.' : 'Vous êtes expert ? Créez votre profil pour répondre.'}</p></div>
        <a class="btn btn-kola" href="#/publier">Publier un besoin</a></div>
      <form id="projFilt" class="inline-filters">
        <input name="q" type="search" placeholder="Mot-clé" value="${esc(query.get('q') || '')}" aria-label="Mot-clé">
        <select name="cat" aria-label="Domaine">${catOptions(cat, true).replace('Toutes les catégories', 'Tous les domaines')}</select>
        <select name="commune" aria-label="Ville">${communeOptions(commune, true).replace('Toutes les communes', 'Toutes les villes')}</select>
        <label class="check"><input type="checkbox" name="remote" value="1" ${query.get('remote') ? 'checked' : ''}> À distance possible</label>
        ${shop ? `<a class="ghost" href="#/projets?cat=${shop.cat}">Mon domaine</a>` : ''}
      </form>
      ${list.length ? `<div class="proj-list">${list.map(projectRow).join('')}</div>` : empty('Aucun besoin ne correspond.', 'Changez de domaine ou revenez bientôt.')}</div>`;
  },
  mount(el) {
    const f = $('#projFilt', el);
    const apply = () => { const d = new FormData(f), n = new URLSearchParams(); for (const [k, v] of d) if (v) n.set(k, v); location.hash = '#/projets?' + n.toString(); };
    f.addEventListener('change', apply); f.addEventListener('submit', e => { e.preventDefault(); apply(); });
  },
};

/* ---------- Publier un besoin / demander un devis ---------- */
export const publish = {
  title: 'Publier un besoin',
  render({ query }) {
    const expert = query.get('expert') ? db.getShop(query.get('expert')) : null;
    const service = query.get('service') ? db.getProduct(query.get('service')) : null;
    const head = expert ? `Demander un devis à ${esc(expert.name)}` : 'Publiez votre besoin, recevez des propositions';
    if (!db.user()) return `<div class="wrap pad narrow">${crumbs([[expert ? 'Demande de devis' : 'Publier un besoin']])}<h1 class="h1">${head}</h1>
      <p class="lede">Créez votre compte en une minute pour envoyer votre demande et suivre les réponses.</p>${accountForm()}</div>`;
    const cat = service ? service.cat : expert ? expert.cat : (query.get('cat') || 'it');
    const c = catOf(cat);
    return `<div class="wrap pad">${crumbs([[expert ? 'Demande de devis' : 'Publier un besoin']])}
      <h1 class="h1">${head}</h1>
      <p class="lede">${expert ? 'Décrivez votre besoin : l\'expert vous répondra avec une proposition chiffrée.' : 'Décrivez votre besoin en quelques lignes. Les experts du domaine vous envoient leurs propositions : vous comparez et choisissez.'}</p>
      <div class="sell-grid">
        <form id="projForm" class="panel form-grid">
          <label>Titre de votre besoin<input name="title" required maxlength="100" value="${esc(service ? service.title : '')}" placeholder="Ex. Application de livraison pour notre restaurant"></label>
          <label>Description<textarea name="desc" required rows="6" maxlength="2000" placeholder="Contexte, objectifs, ce que vous attendez, contraintes…"></textarea></label>
          <p class="autocat" id="autoCat" aria-live="polite"></p>
          <div class="row2"><label>Domaine<select name="cat" id="pCat">${catOptions(cat)}</select></label>
            <label>Spécialité<select name="sub" id="pSub">${c.subs.map(s => `<option ${service && s === service.sub ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label></div>
          <fieldset><legend>Budget (FCFA)</legend><div class="row2">
            <input name="budgetMin" inputmode="numeric" placeholder="Minimum" aria-label="Budget minimum">
            <input name="budgetMax" inputmode="numeric" placeholder="Maximum" aria-label="Budget maximum"></div>
            <small class="muted">Laissez vide si vous préférez recevoir des propositions.</small></fieldset>
          <div class="row2"><label>Délai souhaité<select name="durationDays">${DURATIONS.map(([v, l]) => `<option value="${v}" ${v === 30 ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            <label>Ville<select name="commune">${communeOptions((db.user() || {}).commune || 'plateau')}</select></label></div>
          <label class="check"><input type="checkbox" name="remote" checked> Le travail peut se faire à distance</label>
          <label>Nom affiché<input name="clientLabel" maxlength="60" placeholder="Ex. Clinique privée à Cocody (vous pouvez rester discret)"></label>
          <button class="btn btn-kola btn-wide">${expert ? 'Envoyer ma demande de devis' : 'Publier mon besoin'}</button>
          ${expert ? '<p class="small muted">Votre demande n\'est visible que par cet expert.</p>' : '<p class="small muted">Votre besoin est visible par les experts de Djéli Pro. Vos coordonnées ne sont partagées qu\'avec l\'expert que vous choisissez.</p>'}
          ${db.isCloud() ? '' : '<p class="small muted">Mode démonstration : le besoin est enregistré sur cet appareil.</p>'}
        </form>
        <aside class="preview">${expert ? `<p class="preview-label">Destinataire</p><a class="shop-card" href="#/e/${expert.id}" style="--c:${catOf(expert.cat).color}"><span class="shop-av">${esc(expert.name[0])}</span><span class="shop-info"><b>${esc(expert.name)}</b><span>${esc(expert.headline || '')}</span></span></a>` : `
          <div class="panel tips-box"><h2 class="h3">Pour recevoir de bonnes propositions</h2><ul class="tips"><li>Expliquez votre activité et le résultat attendu.</li><li>Donnez un ordre de grandeur de budget, même large.</li><li>Précisez vos délais et contraintes (lieu, langue, outils).</li></ul></div>`}</aside>
      </div></div>`;
  },
  mount(el, { query }) {
    if (!db.user()) { mountAccountForm(el, rerender); return; }
    const f = $('#projForm', el); let touched = !!(query.get('expert') || query.get('service') || query.get('cat'));
    const setSubs = (cat) => { $('#pSub', el).innerHTML = catOf(cat).subs.map(s => `<option>${esc(s)}</option>`).join(''); };
    const guess = () => {
      if (touched) return;
      const cat = detectCategory(f.title.value + ' ' + f.desc.value);
      if (cat && cat !== f.cat.value) { f.cat.value = cat; setSubs(cat); }
      if (cat) {
        const t = norm(f.title.value + ' ' + f.desc.value);
        const sub = catOf(cat).subs.find(s => norm(s).split(' ').some(w => w.length > 4 && t.includes(w.slice(0, -1))));
        if (sub) f.sub.value = sub;
        $('#autoCat', el).textContent = `Domaine détecté : ${catOf(cat).emoji} ${catOf(cat).label}, ${f.sub.value}`;
      }
    };
    f.title.addEventListener('input', guess); f.desc.addEventListener('input', guess);
    f.cat.addEventListener('change', () => { touched = true; setSubs(f.cat.value); $('#autoCat', el).textContent = ''; });
    ['budgetMin', 'budgetMax'].forEach(k => f[k].addEventListener('input', () => { const n = f[k].value.replace(/\D/g, ''); f[k].value = n ? fmt(+n) : ''; }));
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      const num = v => +String(v || '').replace(/\D/g, '') || 0;
      if (num(d.budgetMin) && num(d.budgetMax) && num(d.budgetMin) > num(d.budgetMax)) { toast('Le budget minimum dépasse le maximum.'); return; }
      const btn = f.querySelector('.btn-kola'); btn.disabled = true;
      try {
        const id = await db.saveProject({ ...d, budgetMin: num(d.budgetMin), budgetMax: num(d.budgetMax), remote: !!d.remote, clientLabel: d.clientLabel.trim() || `Entreprise à ${communeName(d.commune)}`, inviteShop: query.get('expert') || null });
        toast(query.get('expert') ? 'Demande envoyée' : 'Besoin publié'); location.hash = '#/projet/' + id;
      } catch (err) { toast(err.message); btn.disabled = false; }
    });
  },
};

/* ---------- Page d'un besoin ---------- */
export const projectPage = {
  title: ({ params }) => (db.getProject(params[0]) || {}).title || 'Besoin',
  render({ params }) {
    const p = db.getProject(params[0]);
    if (!p) return `<div class="wrap pad">${empty('Besoin introuvable.', 'Il a peut-être été retiré, ou il ne vous est pas destiné.', '<a class="btn btn-green" href="#/projets">Voir les besoins</a>')}</div>`;
    const c = catOf(p.cat), me = db.user(), owner = me && p.owner === me.id, shop = db.myShop();
    const props = db.proposalsOf(p.id).map(x => ({ ...x, shop: db.getShop(x.shopId) })).filter(x => x.shop);
    const mine = shop ? props.find(x => x.shopId === shop.id) : null;
    const invited = p.invitedShop || p.invited ? db.getShop(p.invitedShop || p.invited) : null;
    const [stl, stc] = STATUS[p.status] || STATUS.open;
    let side = '';
    if (owner) {
      side = props.length ? `<h2 class="h2">Propositions reçues <small>${props.length}</small></h2>
        <div class="props">${props.sort((a, b) => (a.amount || 1e15) - (b.amount || 1e15)).map(x => `<article class="panel prop ${x.status}">
          <a class="svc-expert" href="#/e/${x.shop.id}"><span class="mini-av" style="--c:${catOf(x.shop.cat).color}">${esc(x.shop.name[0])}</span><span><b>${esc(x.shop.name)}</b>${x.shop.verified ? ' <span class="vbadge">✓</span>' : ''}<small>${kindLabel(x.shop.kind)} · ${x.shop.reviews ? stars(x.shop.rating, 'sm') + ' ' + x.shop.rating.toFixed(1) : 'Nouveau'}</small></span></a>
          <div class="prop-figs"><b>${x.amount ? fmt(x.amount) + ' FCFA' : 'Au résultat / à discuter'}</b><span>⏱ ${esc(x.delay || '')}</span></div>
          <p>${esc(x.message || '')}</p>
          <div class="p-row">${x.status === 'sent' && p.status === 'open' ? `<button class="btn btn-green sm" data-accept="${x.id}">Choisir cet expert</button><button class="linkbtn" data-decline="${x.id}">Refuser</button>` : `<span class="tag ${x.status === 'accepted' ? 'ok' : ''}">${x.status === 'accepted' ? 'Choisi' : x.status === 'declined' ? 'Refusée' : 'Envoyée'}</span>`}
            ${x.shop.whatsapp ? `<a class="ghost" href="${waHref(x.shop.whatsapp, `Bonjour ${x.shop.name}, à propos de votre proposition pour « ${p.title} » sur Djéli Pro.`)}" target="_blank" rel="noopener">${WA} Discuter</a>` : ''}</div>
        </article>`).join('')}</div>` : empty('Pas encore de proposition.', invited ? `Votre demande a été envoyée à ${esc(invited.name)}.` : 'Les experts du domaine sont prévenus. Les premières propositions arrivent en général sous 48 h.',
          invited && invited.whatsapp ? `<a class="wa" href="${waHref(invited.whatsapp, `Bonjour ${invited.name}, je vous ai envoyé une demande de devis sur Djéli Pro : « ${p.title} ». ${link('#/projet/' + p.id)}`)}" target="_blank" rel="noopener">${WA} Prévenir l'expert</a>` : '');
      if (p.status === 'open') side += `<p class="small"><button class="linkbtn" data-close>Fermer ce besoin</button></p>`;
    } else if (mine) {
      side = `<section class="panel"><h2 class="h3">Votre proposition</h2><p><b>${mine.amount ? fmt(mine.amount) + ' FCFA' : 'Au résultat / à discuter'}</b> · ${esc(mine.delay || '')}</p><p>${esc(mine.message || '')}</p>
        <span class="tag ${mine.status === 'accepted' ? 'ok' : ''}">${mine.status === 'accepted' ? 'Acceptée : le client va payer la mission' : mine.status === 'declined' ? 'Non retenue' : 'Envoyée, en attente de réponse'}</span></section>`;
    } else if (p.status === 'open' && shop) {
      side = `<form id="propForm" class="panel form-grid"><h2 class="h3">Envoyer une proposition</h2>
        <label>Montant total (FCFA)<input name="amount" inputmode="numeric" placeholder="Ex. 1 500 000"><small class="muted">Laissez vide pour une rémunération au résultat ou à discuter.</small></label>
        <label>Délai de réalisation<input name="delay" required maxlength="40" placeholder="Ex. 6 semaines"></label>
        <label>Votre message<textarea name="message" required rows="5" maxlength="1500" placeholder="Votre compréhension du besoin, votre méthode, vos références similaires…"></textarea></label>
        <button class="btn btn-kola btn-wide">Envoyer ma proposition</button>
        <p class="small muted">Djéli Pro prélève une commission de ${CONFIG.commissionPercent} % sur les missions payées sur la plateforme.</p></form>`;
    } else if (p.status === 'open') {
      side = `<section class="panel"><h2 class="h3">Vous êtes expert ?</h2><p>Créez votre profil pour répondre à ce besoin.</p><a class="btn btn-kola" href="#/espace">Créer mon profil d'expert</a></section>`;
    }
    return `<div class="wrap pad">${crumbs([['Besoins', '#/projets'], [p.title]])}
      <div class="product-grid">
        <div>
          <a class="card-cat" style="--c:${c.color}" href="#/d/${c.id}">${c.emoji} ${esc(p.sub || c.label)}</a>
          <h1 class="h1 p-title">${esc(p.title)}</h1>
          <p class="muted">${esc(p.clientLabel || 'Entreprise')} · publié ${ago(p.createdAt)} <span class="tag ${stc}">${stl}</span>${invited ? ` <span class="tag">Demande privée à ${esc(invited.name)}</span>` : ''}</p>
          <dl class="specs">
            <div><dt>Budget</dt><dd>${budgetText(p)}</dd></div>
            <div><dt>Délai souhaité</dt><dd>${durText(p.durationDays)}</dd></div>
            <div><dt>Lieu</dt><dd>${esc(communeName(p.commune))}${p.remote ? ', à distance possible' : ''}</dd></div>
            <div><dt>Propositions</dt><dd>${p.proposalsCount || props.length}</dd></div>
          </dl>
          <h2 class="h3">Description</h2><p class="p-desc">${esc(p.desc || '')}</p>
        </div>
        <aside>${side}</aside>
      </div></div>`;
  },
  mount(el, { params }) {
    const p = db.getProject(params[0]); if (!p) return;
    el.addEventListener('click', async e => {
      const a = e.target.closest('[data-accept]'), d = e.target.closest('[data-decline]');
      try {
        if (a && confirm('Choisir cet expert ? Les autres propositions seront refusées et vous pourrez payer la mission en toute sécurité.')) {
          a.disabled = true;
          const mission = await db.proposalOp(a.dataset.accept, 'accept');
          if (mission && mission.id) { toast('Expert choisi. Réglez maintenant la mission.'); location.hash = '#/mission/' + mission.id; }
          else { toast('Expert choisi. Contactez-le pour démarrer (paiement sécurisé disponible avec la base en ligne).'); rerender(); }
        }
        if (d) { await db.proposalOp(d.dataset.decline, 'decline'); toast('Proposition refusée'); rerender(); }
        if (e.target.closest('[data-close]') && confirm('Fermer ce besoin ? Les experts ne pourront plus répondre.')) { await db.setProjectStatus(p.id, 'closed'); toast('Besoin fermé'); rerender(); }
      } catch (err) { toast(err.message); if (a) a.disabled = false; }
    });
    const f = $('#propForm', el);
    if (f) {
      f.amount.addEventListener('input', () => { const n = f.amount.value.replace(/\D/g, ''); f.amount.value = n ? fmt(+n) : ''; });
      f.addEventListener('submit', async e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(f));
        try { await db.sendProposal(p.id, { amount: +String(d.amount).replace(/\D/g, '') || 0, delay: d.delay.trim(), message: d.message.trim() }); toast('Proposition envoyée'); rerender(); }
        catch (err) { toast(err.message); }
      });
    }
  },
};

/* ---------- Mes besoins (côté entreprise) ---------- */
export const myNeeds = {
  title: 'Mes besoins',
  render() {
    if (!db.user()) return `<div class="wrap pad narrow">${empty('Connectez-vous pour voir vos besoins.', '', '<a class="btn btn-green" href="#/compte">Me connecter</a>')}</div>`;
    const list = db.myProjects();
    return `<div class="wrap pad narrow">${crumbs([['Mon compte', '#/compte'], ['Mes besoins']])}
      <div class="block-head top"><h1 class="h1">Mes besoins</h1><a class="btn btn-kola" href="#/publier">Publier un besoin</a></div>
      ${list.length ? `<div class="proj-list">${list.map(projectRow).join('')}</div>` : empty('Vous n\'avez encore rien publié.', 'Décrivez votre besoin : les experts vous envoient leurs propositions.', '<a class="btn btn-kola" href="#/publier">Publier un besoin</a>')}</div>`;
  },
};
