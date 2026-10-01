// Espace expert : profil, prestations, opportunités, propositions, missions et paiements.
import { CATEGORIES, UNITS } from '../data.js';
import * as db from '../store.js';
import { detectCategory, norm } from '../search.js';
import { $, $$, esc, fmt, catOf, communeName, productCard, crumbs, empty, toast, communeOptions, catOptions, share, link, plural, price, ago } from '../ui.js';
import { CONFIG } from '../config.js';
import { accountForm, mountAccountForm } from './account.js';
import { expertTab, mountExpertTab } from './missions.js';
import { projectRow } from './catalog.js';

const rerender = () => window.dispatchEvent(new Event('djeli:render'));
const lines = v => (Array.isArray(v) ? v : []).join('\n');

function expertForm(s = {}) {
  return `<form id="shopForm" class="panel form-grid">
    <div class="row2"><label>Nom du cabinet ou votre nom<input name="name" required maxlength="60" value="${esc(s.name || '')}" placeholder="Cabinet Aya Conseil"></label>
      <label>Vous êtes<select name="kind"><option value="cabinet" ${s.kind !== 'freelance' ? 'selected' : ''}>Un cabinet ou une entreprise</option><option value="freelance" ${s.kind === 'freelance' ? 'selected' : ''}>Un indépendant</option></select></label></div>
    <label>Accroche<input name="headline" required maxlength="80" value="${esc(s.headline || '')}" placeholder="Ex. Expert-comptable pour PME, Développeur mobile Flutter"></label>
    <div class="row2"><label>Domaine principal<select name="cat" required>${catOptions(s.cat || '')}</select></label>
      <label>Ville<select name="commune" required>${communeOptions(s.commune || (db.user() || {}).commune || 'plateau')}</select></label></div>
    <div class="row2"><label>Années d'expérience<input name="years" type="number" min="0" max="60" value="${esc(s.years || '')}"></label>
      <label>Taille de l'équipe<input name="team" type="number" min="1" max="5000" value="${esc(s.team || 1)}"></label></div>
    <div class="row2"><label>Numéro WhatsApp<input name="whatsapp" required inputmode="tel" value="${esc(s.whatsapp || (db.user() || {}).phone || '')}" placeholder="07 00 00 00 00"></label>
      <label>Langues<input name="languages" value="${esc(s.languages || 'FR')}" placeholder="FR, EN"></label></div>
    <label>Présentation<textarea name="desc" required rows="4" maxlength="1200" placeholder="Votre expertise, vos méthodes, ce qui vous distingue">${esc(s.desc || '')}</textarea></label>
    <label>Agréments et certifications <small class="muted">(un par ligne)</small><textarea name="certifications" rows="3" placeholder="Expert-comptable inscrit à l'Ordre&#10;Certification Scrum Master">${esc(lines(s.certifications))}</textarea></label>
    <label>Références clients <small class="muted">(une par ligne, sans nom si vous préférez)</small><textarea name="clients" rows="3" placeholder="Une banque de la place&#10;Une PME industrielle">${esc(lines(s.clients))}</textarea></label>
    <label class="check"><input type="checkbox" name="remote" ${s.remote !== false ? 'checked' : ''}> J'interviens aussi à distance</label>
    <label class="check"><input type="checkbox" name="available" ${s.available !== false ? 'checked' : ''}> Disponible pour de nouvelles missions</label>
    <button class="btn btn-green btn-wide">${s.id ? 'Enregistrer mon profil' : 'Créer mon profil d\'expert'}</button>
    <p class="small muted">Le badge « Vérifié » est attribué après contrôle de votre RCCM, de vos agréments ou de vos diplômes par l'équipe Djéli Pro.</p>
  </form>`;
}
function mountExpertForm(el, after) {
  $('#shopForm', el)?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const wa = String(f.whatsapp).replace(/\D/g, '');
    if (wa.length < 8) { toast('Indiquez un numéro WhatsApp valide.'); return; }
    const list = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12);
    try {
      await db.saveShop({ name: f.name.trim(), kind: f.kind, headline: f.headline.trim(), cat: f.cat, commune: f.commune, whatsapp: wa, phone: '', languages: f.languages.trim(),
        years: +f.years || 0, team: +f.team || 1, desc: f.desc.trim(), certifications: list(f.certifications), clients: list(f.clients), remote: !!f.remote, available: !!f.available,
        open: 8, close: 18, delivery: false });
      toast('Profil enregistré'); after();
    } catch (err) { toast(err.message); }
  });
}

/* ---------- Publier / modifier une prestation ---------- */
export const sell = {
  title: 'Publier une prestation',
  render({ query }) {
    if (!db.user()) return `<div class="wrap pad narrow">${crumbs([['Devenir expert']])}<h1 class="h1">Proposez vos services</h1>
      <p class="lede">Trois étapes, gratuit : votre compte, votre profil d'expert, votre première prestation.</p><ol class="stepper"><li class="on">Compte</li><li>Profil</li><li>Prestation</li></ol>${accountForm()}</div>`;
    const shop = db.myShop();
    if (!shop) return `<div class="wrap pad narrow">${crumbs([['Devenir expert']])}<h1 class="h1">Votre profil d'expert</h1><ol class="stepper"><li class="done">Compte</li><li class="on">Profil</li><li>Prestation</li></ol>${expertForm()}</div>`;
    const edit = query.get('id') ? db.getProduct(query.get('id')) : null;
    if (edit && edit.shopId !== shop.id) return `<div class="wrap pad">${empty('Vous ne pouvez modifier que vos propres prestations.', '')}</div>`;
    const p = edit || { cat: shop.cat, unit: 'forfait' };
    const c = catOf(p.cat);
    return `<div class="wrap pad">${crumbs([['Espace expert', '#/espace'], [edit ? 'Modifier la prestation' : 'Nouvelle prestation']])}
      <h1 class="h1">${edit ? 'Modifier la prestation' : 'Publier une prestation'}</h1>
      ${edit ? '' : '<ol class="stepper"><li class="done">Compte</li><li class="done">Profil</li><li class="on">Prestation</li></ol>'}
      <div class="sell-grid">
        <form id="prodForm" class="panel form-grid">
          <label>Intitulé de la prestation<input name="title" required maxlength="80" value="${esc(p.title || '')}" placeholder="Ex. Tenue de comptabilité PME, Application mobile Android et iOS"></label>
          <p class="autocat" id="autoCat" aria-live="polite"></p>
          <div class="row2"><label>Domaine<select name="cat" id="pCat">${catOptions(p.cat)}</select></label>
            <label>Spécialité<select name="sub" id="pSub">${c.subs.map(s => `<option ${s === p.sub ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label></div>
          <div class="row2"><label>Tarification<select name="unit" id="pUnit">${UNITS.map(([v, l]) => `<option value="${v}" ${v === (p.unit || 'forfait') ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            <label id="priceLbl">Prix (FCFA)<input name="price" inputmode="numeric" value="${p.price ? (p.unit === 'pourcent' ? p.price : fmt(p.price)) : ''}" placeholder="450 000"></label></div>
          <label>Délai ou disponibilité<input name="delay" maxlength="40" value="${esc(p.delay || '')}" placeholder="Ex. 3 semaines, Immédiat, 48 h"></label>
          <label>Ce qui est inclus<textarea name="deliverables" required rows="3" maxlength="400" placeholder="Livrables, nombre de réunions, garanties…">${esc(p.deliverables || '')}</textarea></label>
          <label>Description détaillée <small class="muted">(facultatif)</small><textarea name="desc" rows="4" maxlength="1500">${esc(p.desc || '')}</textarea></label>
          <button class="btn btn-green btn-wide">${edit ? 'Enregistrer' : 'Publier la prestation'}</button>
          ${db.isCloud() ? '' : '<p class="small muted">Mode démonstration : la prestation est enregistrée sur cet appareil.</p>'}
        </form>
        <aside class="preview"><p class="preview-label">Aperçu</p><div id="preview"></div></aside>
      </div></div>`;
  },
  mount(el, { query }) {
    if (!db.user()) { mountAccountForm(el, rerender); return; }
    if (!db.myShop()) { mountExpertForm(el, rerender); return; }
    const f = $('#prodForm', el); if (!f) return;
    const shop = db.myShop(), edit = query.get('id') ? db.getProduct(query.get('id')) : null;
    let touched = !!edit;
    const priceVal = () => f.unit.value === 'pourcent' ? Math.min(100, +String(f.price.value).replace(/[^\d.]/g, '') || 0) : (+String(f.price.value).replace(/\D/g, '') || 0);
    const read = () => ({ id: edit && edit.id, title: f.title.value.trim() || 'Votre prestation', cat: f.cat.value, sub: f.sub.value, unit: f.unit.value, price: f.unit.value === 'devis' ? 0 : priceVal(),
      delay: f.delay.value.trim(), deliverables: f.deliverables.value.trim(), desc: f.desc.value.trim(), shopId: shop.id, shop: shop.name, commune: shop.commune, kind: shop.kind,
      verified: shop.verified, remote: shop.remote, available: shop.available, rating: 0, reviews: 0, status: 'active', photos: [] });
    const draw = () => {
      const u = f.unit.value; f.price.disabled = u === 'devis';
      $('#priceLbl', el).firstChild.textContent = u === 'pourcent' ? 'Pourcentage (%)' : u === 'devis' ? 'Prix (sur devis)' : 'Prix (FCFA)';
      $('#preview', el).innerHTML = productCard(read(), { preview: true });
    };
    const setSubs = (cat, pick) => { $('#pSub', el).innerHTML = catOf(cat).subs.map(s => `<option ${s === pick ? 'selected' : ''}>${esc(s)}</option>`).join(''); };
    f.title.addEventListener('input', () => {
      if (touched) return;
      const cat = detectCategory(f.title.value); if (!cat) return;
      f.cat.value = cat;
      const t = norm(f.title.value);
      setSubs(cat, catOf(cat).subs.find(s => norm(s).split(' ').some(w => w.length > 4 && t.includes(w.slice(0, -1)))));
      $('#autoCat', el).textContent = `Rangée dans ${catOf(cat).emoji} ${catOf(cat).label}, ${f.sub.value}`;
    });
    f.cat.addEventListener('change', () => { touched = true; setSubs(f.cat.value); $('#autoCat', el).textContent = ''; });
    f.price.addEventListener('input', () => { if (f.unit.value !== 'pourcent') { const n = f.price.value.replace(/\D/g, ''); f.price.value = n ? fmt(+n) : ''; } });
    f.addEventListener('input', draw); f.addEventListener('change', draw);
    f.addEventListener('submit', async e => {
      e.preventDefault(); const p = read();
      if (p.unit !== 'devis' && !p.price) { toast('Indiquez un prix, ou choisissez « Sur devis ».'); return; }
      try { const id = await db.saveProduct({ ...p, tags: '' }); toast(edit ? 'Prestation enregistrée' : 'Prestation publiée'); location.hash = '#/s/' + id; } catch (err) { toast(err.message); }
    });
    draw();
  },
};

/* ---------- Espace expert ---------- */
export const dashboard = {
  title: 'Espace expert',
  async render({ query }) {
    if (!db.user()) return `<div class="wrap pad narrow">${crumbs([['Espace expert']])}<h1 class="h1">Espace expert</h1><p class="lede">Connectez-vous pour gérer votre profil.</p>${accountForm()}</div>`;
    const s = db.myShop();
    if (!s) return `<div class="wrap pad narrow">${crumbs([['Espace expert']])}<h1 class="h1">Créez votre profil d'expert</h1><p class="lede">Gratuit. Les entreprises vous trouvent et vous envoient leurs demandes.</p>${expertForm()}</div>`;
    const tab = query.get('tab') || 'apercu';
    const items = db.myProducts();
    const props = db.myProposals();
    const opps = db.projects().filter(p => p.status === 'open' && (p.cat === s.cat || p.invitedShop === s.id || p.invited === s.id) && p.owner !== (db.user() || {}).id && !props.some(x => x.projectId === p.id) && (!(p.invitedShop || p.invited) || (p.invitedShop || p.invited) === s.id));
    const views = items.reduce((t, p) => t + db.prefs.stat('views', p.id), 0);
    const plan = { free: 'Découverte (gratuit)', pro: 'Pro', premium: 'Premium' }[s.plan] || 'Découverte';
    const tabs = [['apercu', 'Aperçu'], ['opportunites', `Opportunités (${opps.length})`], ['propositions', `Propositions (${props.length})`], ['missions', 'Missions et paiements'], ['prestations', `Prestations (${items.length})`], ['profil', 'Profil'], ['offre', 'Mon offre']];
    let body = '';
    if (tab === 'apercu') body = `<div class="kpis">
        <div><b>${opps.length}</b><span>besoins pour vous</span></div><div><b>${props.length}</b><span>propositions envoyées</span></div>
        <div><b>${props.filter(p => p.status === 'accepted').length}</b><span>propositions retenues</span></div><div><b>${views}</b><span>vues de vos prestations</span></div>
        <div><b>${s.reviews ? s.rating.toFixed(1) + ' ★' : '—'}</b><span>${plural(s.reviews, 'avis', 'avis')}</span></div></div>
      <div class="dash-actions"><a class="btn btn-kola" href="#/espace?tab=opportunites">Voir les besoins pour moi</a><a class="btn btn-line" href="#/vendre">+ Publier une prestation</a>
        <a class="btn btn-line" href="#/e/${s.id}">Voir mon profil</a><button class="btn btn-line" data-share-shop>Partager mon profil</button><button class="btn btn-line" data-poster>🖨️ Carte avec QR code</button></div>
      <h2 class="h3">Pour décrocher plus de missions</h2><ul class="tips">
        ${!s.certifications || !s.certifications.length ? '<li>Ajoutez vos agréments et certifications dans l\'onglet Profil : c\'est le premier critère de confiance.</li>' : ''}
        ${!s.clients || !s.clients.length ? '<li>Citez quelques références clients, même sans les nommer.</li>' : ''}
        ${items.length < 3 ? '<li>Publiez au moins 3 prestations avec un prix indicatif : les entreprises comparent plus volontiers.</li>' : ''}
        <li>Répondez aux nouveaux besoins sous 24 h : les premières propositions sont les plus lues.</li>
        <li>Activez le paiement sécurisé (onglet Missions et paiements) : les clients choisissent plus facilement un expert payé en séquestre.</li></ul>`;
    if (tab === 'opportunites') body = opps.length ? `<p class="muted">Besoins ouverts dans votre domaine (${esc(catOf(s.cat).label)}) et demandes qui vous sont adressées.</p><div class="proj-list">${opps.map(projectRow).join('')}</div>`
      : empty('Aucun nouveau besoin dans votre domaine.', 'Revenez bientôt, ou consultez tous les besoins.', '<a class="btn btn-green" href="#/projets">Tous les besoins</a>');
    if (tab === 'propositions') body = props.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Besoin</th><th>Montant</th><th>Délai</th><th>Statut</th></tr></thead><tbody>
      ${props.map(x => { const p = db.getProject(x.projectId) || {}; return `<tr><td><a href="#/projet/${x.projectId}">${esc(p.title || 'Besoin')}</a><br><small class="muted">${ago(x.createdAt)}</small></td><td>${x.amount ? fmt(x.amount) + ' FCFA' : 'Au résultat'}</td><td>${esc(x.delay || '')}</td>
        <td><span class="tag ${x.status === 'accepted' ? 'ok' : ''}">${x.status === 'accepted' ? 'Retenue' : x.status === 'declined' ? 'Non retenue' : 'En attente'}</span></td></tr>`; }).join('')}</tbody></table></div>`
      : empty('Aucune proposition envoyée.', 'Répondez aux besoins de votre domaine.', '<a class="btn btn-green" href="#/espace?tab=opportunites">Voir les opportunités</a>');
    if (tab === 'missions') body = await expertTab();
    if (tab === 'prestations') body = items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Prestation</th><th>Prix</th><th>Vues</th><th>Actions</th></tr></thead><tbody>
      ${items.map(p => `<tr><td><a href="#/s/${p.id}">${esc(p.title)}</a><br><small class="muted">${esc(p.sub || '')}</small></td><td>${price(p.price, p.unit)}</td><td>${db.prefs.stat('views', p.id)}</td>
        <td class="acts"><a href="#/vendre?id=${p.id}">Modifier</a><button class="linkbtn danger" data-delete="${p.id}">Supprimer</button></td></tr>`).join('')}</tbody></table></div><a class="btn btn-kola" href="#/vendre">+ Publier une prestation</a>`
      : empty('Aucune prestation publiée.', 'Décrivez vos offres avec un prix indicatif.', '<a class="btn btn-kola" href="#/vendre">Publier une prestation</a>');
    if (tab === 'profil') body = expertForm(s);
    if (tab === 'offre') body = `<p>Votre offre actuelle : <b>${plan}</b>.</p><div class="plans">${planCards(s.plan)}</div><p class="small muted">L'abonnement se règle par Mobile Money ou virement auprès de l'équipe Djéli Pro, qui active votre offre sous 24 h.</p>`;
    return `<div class="wrap pad">${crumbs([['Espace expert']])}
      <div class="dash-head"><span class="shop-av lg" style="--c:${catOf(s.cat).color}">${esc(s.name[0])}</span><div><h1 class="h1">${esc(s.name)}</h1><p class="muted">${esc(s.headline || '')} · Offre ${plan}</p></div></div>
      <nav class="tabs" role="tablist">${tabs.map(([k, l]) => `<a role="tab" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}" href="#/espace?tab=${k}">${l}</a>`).join('')}</nav>
      <div class="tab-body">${body}</div></div><dialog id="poster" class="detail poster-dlg"></dialog>`;
  },
  mount(el) {
    if (!db.user()) { mountAccountForm(el, rerender); return; }
    const s = db.myShop();
    mountExpertForm(el, rerender);
    if (!s) return;
    mountExpertTab(el);
    el.addEventListener('click', async e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.delete && confirm('Supprimer cette prestation ?')) { try { await db.setProductStatus(t.dataset.delete, 'deleted'); toast('Prestation supprimée'); rerender(); } catch (err) { toast(err.message); } }
      if (t.hasAttribute('data-share-shop')) share({ title: s.name, text: `${s.name}, ${s.headline || ''}, sur Djéli Pro`, url: link('#/e/' + s.id) });
      if (t.hasAttribute('data-poster')) poster(el, s);
      if (t.dataset.plan) contactPlan(t.dataset.plan, s);
    });
  },
};

export function planCards(current = '') {
  const plans = [
    ['free', 'Découverte', 'Gratuit', ['Profil d\'expert complet', '3 prestations publiées', '5 propositions par mois', 'Paiement sécurisé des missions']],
    ['pro', 'Pro', '15 000 FCFA / mois', ['Prestations illimitées', 'Propositions illimitées', 'Badge « Vérifié » après contrôle', 'Alerte immédiate des nouveaux besoins']],
    ['premium', 'Premium', '40 000 FCFA / mois', ['Tout le Pro', 'Mise en avant « À la une » dans votre domaine', 'Page cabinet avec plusieurs consultants', 'Accompagnement personnalisé']],
  ];
  return plans.map(([id, name, pr, feats]) => `<div class="plan ${id === 'pro' ? 'feat' : ''}"><h3>${name}</h3><div class="plan-price">${pr}</div><ul>${feats.map(f => `<li>${f}</li>`).join('')}</ul>
    ${id === current ? '<span class="tag ok">Votre offre</span>' : id === 'free' ? '<a class="btn btn-line btn-wide" href="#/vendre">Commencer</a>' : `<button class="btn ${id === 'pro' ? 'btn-green' : 'btn-line'} btn-wide" data-plan="${id}">Choisir ${name}</button>`}</div>`).join('');
}
export function contactPlan(plan, s) {
  const text = `Bonjour Djéli Pro, je souhaite passer à l'offre ${plan === 'pro' ? 'Pro' : 'Premium'}${s ? ` pour « ${s.name} »` : ''}.`;
  if (CONFIG.contactWhatsApp) window.open(`https://wa.me/${CONFIG.contactWhatsApp}?text=${encodeURIComponent(text)}`, '_blank');
  else location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent('Offre ' + plan)}&body=${encodeURIComponent(text)}`;
}
async function poster(el, s) {
  const d = $('#poster', el), url = link('#/e/' + s.id);
  d.innerHTML = `<button class="d-close" aria-label="Fermer">×</button><div class="poster"><p class="poster-top">Retrouvez-nous sur</p><p class="poster-logo">djéli pro</p>
    <div id="qr" class="qr"></div><p class="poster-name">${esc(s.name)}</p><p>${esc(s.headline || '')}</p><p class="small">${esc(url)}</p></div>
    <div class="p-row center"><button class="btn btn-green" data-print>Imprimer</button></div>`;
  d.showModal();
  d.onclick = e => { if (e.target.closest('.d-close') || e.target === d) d.close(); if (e.target.closest('[data-print]')) window.print(); };
  try {
    if (!window.QRCode) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
    new window.QRCode($('#qr', d), { text: url, width: 180, height: 180, colorDark: '#13235B', colorLight: '#ffffff' });
  } catch (e) { $('#qr', d).textContent = 'QR code indisponible hors connexion.'; }
}
