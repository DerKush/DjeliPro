import * as db from '../store.js';
import { searchProducts } from './explore.js';
import { PAYMENTS } from '../data.js';
import { $, $$, esc, fmt, catOf, communeName, productCard, shopCard, crumbs, empty, toast, communeOptions, waHref, plural, dateFr, ago } from '../ui.js';

const rerender = () => window.dispatchEvent(new Event('djeli:render'));

/* ---------- Formulaire de compte (réutilisé par Vendre et Espace vendeur) ---------- */
export function accountForm(mode = 'signup') {
  if (db.isCloud()) {
    if (db.inRecovery()) return `<form id="recForm" class="panel form-grid"><h2 class="h3">Choisissez un nouveau mot de passe</h2>
      <label>Nouveau mot de passe<input name="password" type="password" required minlength="6" autocomplete="new-password"></label>
      <button class="btn btn-green btn-wide">Enregistrer</button></form>`;
    const signup = mode !== 'login';
    return `<div class="panel">
      <div class="how-tabs" role="tablist"><button type="button" role="tab" class="ht ${signup ? 'on' : ''}" data-accmode="signup" aria-selected="${signup}">Créer un compte</button>
        <button type="button" role="tab" class="ht ${signup ? '' : 'on'}" data-accmode="login" aria-selected="${!signup}">J'ai déjà un compte</button></div>
      <form id="accForm" class="form-grid" data-mode="${signup ? 'signup' : 'login'}">
        ${signup ? `<label>Votre nom<input name="name" required maxlength="40" autocomplete="name" placeholder="Aya Koné"></label>` : ''}
        <label>E-mail<input name="email" type="email" required autocomplete="email" placeholder="vous@exemple.com"></label>
        <label>Mot de passe<input name="password" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="6 caractères minimum"></label>
        ${signup ? `<div class="row2"><label>Téléphone<input name="phone" inputmode="tel" autocomplete="tel" placeholder="07 00 00 00 00"></label>
          <label>Commune<select name="commune">${communeOptions('cocody')}</select></label></div>` : ''}
        <button class="btn btn-green btn-wide">${signup ? 'Créer mon compte' : 'Me connecter'}</button>
        ${signup ? '' : '<button type="button" class="linkbtn" data-forgot>Mot de passe oublié ?</button>'}
      </form></div>`;
  }
  return `<form id="accForm" class="panel form-grid" data-mode="local">
      <h2 class="h3">Créer mon compte</h2>
      <label>Votre nom<input name="name" required maxlength="40" autocomplete="name" placeholder="Aya Koné"></label>
      <div class="row2"><label>Téléphone<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="07 00 00 00 00"></label>
      <label>Commune<select name="commune">${communeOptions('cocody')}</select></label></div>
      <button class="btn btn-green btn-wide">Créer mon compte</button>
      <p class="small muted">Mode démonstration : votre compte est enregistré sur cet appareil uniquement.</p></form>`;
}
function goAfter(after) {
  const back = sessionStorage.getItem('djeli.after');
  if (back) { sessionStorage.removeItem('djeli.after'); location.hash = back.split('#').slice(0, 2).join('#'); } else after();
}
export function mountAccountForm(el, after) {
  const bind = () => {
    const form = $('#accForm', el);
    form && form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(form), btn = form.querySelector('.btn-green');
      btn.disabled = true;
      try {
        if (form.dataset.mode === 'local') {
          const phone = String(f.get('phone')).replace(/\D/g, '');
          if (phone.length < 8) { toast('Indiquez un numéro de téléphone valide.'); btn.disabled = false; return; }
          db.signInLocal({ name: f.get('name').trim(), phone, commune: f.get('commune') });
          toast('Bienvenue ' + f.get('name').trim()); goAfter(after); return;
        }
        if (form.dataset.mode === 'signup') {
          const ok = await db.signUpPassword({ email: f.get('email').trim(), password: f.get('password'), name: f.get('name').trim(),
            phone: String(f.get('phone') || '').replace(/\D/g, ''), commune: f.get('commune') });
          if (!ok) { form.innerHTML = '<h2 class="h3">Confirmez votre e-mail</h2><p>Nous vous avons envoyé un lien de confirmation. Ouvrez-le, puis revenez vous connecter avec « J\'ai déjà un compte ».</p>'; return; }
          toast('Bienvenue ' + f.get('name').trim());
        } else {
          await db.signInPassword({ email: f.get('email').trim(), password: f.get('password') });
          toast('Vous êtes connecté');
        }
        goAfter(after);
      } catch (err) { toast(err.message); btn.disabled = false; }
    });
  };
  bind();
  if (el._accBound) return;
  el._accBound = true;
  el.addEventListener('click', async e => {
    const m = e.target.closest('[data-accmode]');
    const host = $('#accForm', el)?.closest('.panel');
    if (m && host) { const tmp = document.createElement('div'); tmp.innerHTML = accountForm(m.dataset.accmode); host.replaceWith(tmp.firstElementChild); mountAccountForm(el, after); return; }
    if (e.target.closest('[data-forgot]')) {
      const email = ($('#accForm [name=email]', el) || {}).value;
      if (!email) { toast('Tapez d\'abord votre e-mail.'); return; }
      try { await db.resetPassword(email.trim()); toast('Si ce compte existe, un e-mail de réinitialisation vient de partir.'); } catch (err) { toast(err.message); }
    }
  });
  $('#recForm', el)?.addEventListener('submit', async e => {
    e.preventDefault();
    try { await db.setNewPassword(new FormData(e.target).get('password')); db.endRecovery(); toast('Mot de passe modifié'); after(); } catch (err) { toast(err.message); }
  });
}

/* ---------- Mon compte ---------- */
export const account = {
  title: 'Mon compte',
  render() {
    const u = db.user();
    if (db.inRecovery()) return `<div class="wrap pad narrow">${crumbs([['Mon compte']])}<h1 class="h1">Nouveau mot de passe</h1>${accountForm()}</div>`;
    if (!u) return `<div class="wrap pad narrow">${crumbs([['Mon compte']])}<h1 class="h1">Mon compte</h1>
      <p class="lede">Un compte pour publier vos besoins, recevoir des propositions, suivre vos missions ou proposer vos services.</p>${accountForm()}</div>`;
    const alerts = db.prefs.list('alerts');
    const newAlerts = alerts.reduce((t, a) => t + newIn(a).length, 0);
    const links = [
      ['#/mes-besoins', '📝', 'Mes besoins', plural(db.myProjects().length, 'besoin publié', 'besoins publiés')],
      ['#/mes-missions', '💼', 'Mes missions', 'Suivi, paiement et validation'],
      ['#/favoris', '♥', 'Mes favoris', `${plural(db.prefs.list('favs').length, 'prestation', 'prestations')}, ${plural(db.prefs.list('follows').length, 'expert', 'experts')}`],
      ['#/alertes', '🔔', 'Mes alertes', newAlerts ? `${newAlerts} nouvelles prestations` : plural(alerts.length, 'alerte', 'alertes')],
      ['#/espace', '🧑‍💼', 'Espace expert', db.myShop() ? db.myShop().name : 'Proposer mes services'],
    ];
    if (db.isAdminUser()) links.push(['#/admin', '🛡️', 'Administration', 'Paiements, litiges, versements']);
    return `<div class="wrap pad narrow">${crumbs([['Mon compte']])}
      <h1 class="h1">Bonjour ${esc(u.name)}</h1>
      <div class="acc-links">${links.map(([h, i, t, s]) => `<a href="${h}"><span class="acc-ico">${i}</span><span><b>${t}</b><small>${esc(s)}</small></span></a>`).join('')}</div>
      <form id="profForm" class="panel form-grid"><h2 class="h3">Mes informations</h2>
        <label>Nom<input name="name" required value="${esc(u.name)}"></label>
        <div class="row2"><label>Téléphone<input name="phone" inputmode="tel" value="${esc(u.phone || '')}"></label>
        <label>Commune<select name="commune">${communeOptions(u.commune || 'cocody')}</select></label></div>
        ${u.email ? `<p class="small muted">Connecté avec ${esc(u.email)}</p>` : ''}
        <button class="btn btn-green">Enregistrer</button></form>
      <div class="p-row"><button class="btn btn-line" data-logout>Se déconnecter</button>
        <button class="btn btn-line danger" data-wipe>Effacer mes données de cet appareil</button></div></div>`;
  },
  mount(el) {
    if (!db.user() || db.inRecovery()) { mountAccountForm(el, rerender); return; }
    $('#profForm', el).addEventListener('submit', async e => {
      e.preventDefault(); const f = new FormData(e.target);
      await db.updateProfile({ name: f.get('name').trim(), phone: String(f.get('phone')).replace(/\D/g, ''), commune: f.get('commune') });
      toast('Informations enregistrées');
    });
    el.addEventListener('click', async e => {
      if (e.target.closest('[data-logout]')) { await db.signOut(); toast('Vous êtes déconnecté'); location.hash = '#/'; }
      if (e.target.closest('[data-wipe]') && confirm('Effacer favoris, alertes, besoins et prestations enregistrés sur cet appareil ?')) {
        Object.keys(localStorage).filter(k => k.startsWith('djelipro.')).forEach(k => localStorage.removeItem(k));
        await db.signOut(); toast('Données effacées'); location.hash = '#/';
      }
    });
  },
};

/* ---------- Favoris ---------- */
export const favorites = {
  title: 'Mes favoris',
  render() {
    const favs = db.prefs.list('favs').map(db.getProduct).filter(Boolean);
    const follows = db.prefs.list('follows').map(db.getShop).filter(Boolean);
    const viewed = db.prefs.list('viewed').map(db.getProduct).filter(Boolean);
    return `<div class="wrap pad">${crumbs([['Mes favoris']])}<h1 class="h1">Mes favoris</h1>
      <h2 class="h2">Prestations <small>${favs.length}</small></h2>
      ${favs.length ? `<div class="results">${favs.map(p => productCard(p)).join('')}</div>` : empty('Aucune prestation en favori.', 'Touchez ♡ sur une prestation pour la retrouver ici.')}
      <h2 class="h2 gap">Experts enregistrés <small>${follows.length}</small></h2>
      ${follows.length ? `<div class="shop-grid">${follows.map(shopCard).join('')}</div>` : empty('Aucun expert enregistré.', 'Touchez « Enregistrer » sur le profil d\'un expert.')}
      ${viewed.length ? `<h2 class="h2 gap">Vus récemment</h2><div class="rail">${viewed.map(p => productCard(p)).join('')}</div>` : ''}</div>`;
  },
};

/* ---------- Panier et commande WhatsApp ---------- */
export const cart = {
  title: 'Mon panier',
  render() {
    const lines = db.prefs.cart().map(l => ({ ...l, p: db.getProduct(l.id) })).filter(l => l.p);
    if (!lines.length) return `<div class="wrap pad narrow">${crumbs([['Panier']])}<h1 class="h1">Mon panier</h1>${empty('Votre panier est vide.', 'Ajoutez des articles depuis les annonces, puis envoyez votre commande au commerçant sur WhatsApp.', '<a class="btn btn-green" href="#/explorer">Explorer les annonces</a>')}</div>`;
    const groups = {};
    lines.forEach(l => (groups[l.p.shopId] ||= []).push(l));
    const u = db.user() || {};
    const total = lines.reduce((t, l) => t + l.p.price * l.qty, 0);
    return `<div class="wrap pad">${crumbs([['Panier']])}<h1 class="h1">Mon panier <small>${fmt(total)} FCFA</small></h1>
      <p class="muted">Payez en ligne chez les vendeurs qui l'acceptent (💳), ou envoyez votre commande sur WhatsApp et réglez directement le vendeur.</p>
      <div class="cart-grid"><div>
        ${Object.entries(groups).map(([sid, ls]) => { const s = db.getShop(sid); const sub = ls.reduce((t, l) => t + l.p.price * l.qty, 0);
          return `<section class="panel cart-shop"><h2 class="h3"><a href="#/b/${sid}">${esc(s.name)}</a> <small>${esc(communeName(s.commune))}</small></h2>
          ${ls.map(l => `<div class="cart-line"><a class="cl-ico" href="#/p/${l.p.id}" style="--c:${catOf(l.p.cat).color}">${l.p.photos && l.p.photos[0] ? `<img src="${esc(l.p.photos[0])}" alt="">` : catOf(l.p.cat).emoji}</a>
            <div class="cl-info"><a href="#/p/${l.p.id}">${esc(l.p.title)}</a><small>${fmt(l.p.price)} FCFA${l.p.unit ? ' par ' + esc(l.p.unit) : ''}</small></div>
            <div class="qty sm"><button data-dq="${l.id}" data-d="-1" aria-label="Moins">−</button><span>${l.qty}</span><button data-dq="${l.id}" data-d="1" aria-label="Plus">+</button></div>
            <b class="cl-total">${fmt(l.p.price * l.qty)}</b><button class="linkbtn danger" data-rmline="${l.id}" aria-label="Retirer">×</button></div>`).join('')}
          <div class="cart-foot"><span>Sous-total <b>${fmt(sub)} FCFA</b></span>
            ${db.canPayOnline(s) ? `<span class="pay-btns"><button class="btn btn-kola" data-payonline="${sid}">💳 Payer ${fmt(sub)} FCFA</button><button class="linkbtn" data-order="${sid}">ou commander sur WhatsApp</button></span>`
              : `<button class="wa" data-order="${sid}">Commander chez ${esc(s.name)} sur WhatsApp</button>`}</div>
          ${db.canPayOnline(s) ? '<p class="small muted secure">🔒 Payez Djéli par Wave, Orange Money, MTN ou Moov. Djéli garde l\'argent et ne paie le vendeur qu\'après votre confirmation de réception.</p>' : ''}</section>`; }).join('')}
      </div>
      <aside><form id="buyer" class="panel form-grid"><h2 class="h3">Vos coordonnées</h2>
        <label>Nom<input name="name" required value="${esc(u.name || db.LS.get('buyer', {}).name || '')}"></label>
        <label>Téléphone<input name="phone" required inputmode="tel" value="${esc(u.phone || db.LS.get('buyer', {}).phone || '')}"></label>
        <fieldset><legend>Réception</legend><div class="seg"><label><input type="radio" name="mode" value="Livraison" checked><span>Livraison</span></label><label><input type="radio" name="mode" value="Retrait en boutique"><span>Retrait</span></label></div></fieldset>
        <label>Adresse de livraison<input name="address" value="${esc(db.LS.get('buyer', {}).address || '')}" placeholder="Commune, quartier, repère"></label>
        <label>Paiement (commande WhatsApp)<select name="pay">${PAYMENTS.map(p => `<option>${p}</option>`).join('')}</select></label>
        <label>Message (facultatif)<textarea name="note" rows="2" placeholder="Taille, couleur, heure de passage…"></textarea></label>
      </form></aside></div></div>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      let c = db.prefs.cart();
      if (t.dataset.dq) { const l = c.find(x => x.id === t.dataset.dq); l.qty = Math.max(1, l.qty + +t.dataset.d); db.prefs.setCart(c); rerender(); }
      if (t.dataset.rmline) { db.prefs.setCart(c.filter(x => x.id !== t.dataset.rmline)); rerender(); }
      if (t.dataset.payonline) {
        const f = $('#buyer', el);
        if (!f.reportValidity()) return;
        if (!db.user()) { sessionStorage.setItem('djeli.after', '#/panier'); toast('Connectez-vous pour payer en ligne.'); location.hash = '#/compte'; return; }
        const b = Object.fromEntries(new FormData(f));
        db.LS.set('buyer', { name: b.name, phone: b.phone, address: b.address });
        const s = db.getShop(t.dataset.payonline);
        const lines = c.filter(l => { const p = db.getProduct(l.id); return p && p.shopId === s.id; });
        t.disabled = true; t.textContent = 'Création de la commande…';
        db.createOrder(s.id, lines.map(l => ({ id: l.id, qty: l.qty })), { name: b.name, phone: b.phone, mode: b.mode, address: b.address, note: b.note })
          .then(o => { db.prefs.setCart(c.filter(x => !lines.some(l => l.id === x.id))); location.hash = '#/commande/' + o.id; })
          .catch(err => { toast(err.message); t.disabled = false; t.textContent = 'Réessayer'; });
        return;
      }
      if (t.dataset.order) {
        const f = $('#buyer', el);
        if (!f.reportValidity()) return;
        const b = Object.fromEntries(new FormData(f));
        db.LS.set('buyer', { name: b.name, phone: b.phone, address: b.address });
        const s = db.getShop(t.dataset.order);
        const lines = c.map(l => ({ ...l, p: db.getProduct(l.id) })).filter(l => l.p && l.p.shopId === s.id);
        const total = lines.reduce((x, l) => x + l.p.price * l.qty, 0);
        const msg = `Bonjour ${s.name}, je souhaite commander via Djéli :\n` + lines.map(l => `• ${l.qty} × ${l.p.title} (${fmt(l.p.price)} FCFA)`).join('\n') +
          `\nTotal : ${fmt(total)} FCFA\n\n${b.mode}${b.mode === 'Livraison' && b.address ? ' : ' + b.address : ''}\nPaiement : ${b.pay}\nNom : ${b.name}\nTéléphone : ${b.phone}${b.note ? '\nMessage : ' + b.note : ''}`;
        window.open(waHref(s.whatsapp, msg), '_blank');
        lines.forEach(l => db.prefs.track('wa', l.p.id));
        const orders = db.prefs.list('orders');
        orders.unshift({ id: 'o' + Date.now(), shopId: s.id, shopName: s.name, items: lines.map(l => ({ id: l.p.id, title: l.p.title, qty: l.qty, price: l.p.price })), total, mode: b.mode, pay: b.pay, status: 'Envoyée', date: new Date().toISOString() });
        db.LS.set('orders', orders);
        db.prefs.setCart(c.filter(x => !lines.some(l => l.id === x.id)));
        toast('Commande envoyée. Retrouvez-la dans Mes commandes.'); rerender();
      }
    });
  },
};

/* ---------- Alertes ---------- */
function newIn(a) {
  const qs = new URLSearchParams(a.hash.split('?')[1] || '');
  const seen = new Set(a.seen);
  return searchProducts(qs).filter(x => !seen.has(x.it.id));
}
export function alertCount() { return db.prefs.list('alerts').reduce((t, a) => t + newIn(a).length, 0); }
export const alerts = {
  title: 'Mes alertes',
  render() {
    const as = db.prefs.list('alerts');
    return `<div class="wrap pad narrow">${crumbs([['Mes alertes']])}<h1 class="h1">Mes alertes</h1>
      <p class="muted">Enregistrez une recherche depuis la page Explorer : Djéli Pro vous montre ici les nouvelles prestations qui correspondent.</p>
      ${as.length ? `<ul class="alert-list">${as.map(a => { const n = newIn(a).length; return `<li class="panel"><div><b>${esc(a.label)}</b><small class="muted">Créée ${ago(a.createdAt)}</small></div>
        <span class="tag ${n ? 'hot' : ''}">${n ? plural(n, 'nouvelle prestation', 'nouvelles prestations') : 'Rien de nouveau'}</span>
        <span class="p-row"><button class="btn btn-green sm" data-open-alert="${a.id}">Voir</button><button class="linkbtn danger" data-del-alert="${a.id}">Supprimer</button></span></li>`; }).join('')}</ul>`
        : empty('Aucune alerte.', 'Faites une recherche, puis touchez « Me prévenir des nouvelles annonces ».', '<a class="btn btn-green" href="#/explorer">Faire une recherche</a>')}</div>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      const as = db.prefs.list('alerts');
      if (t.dataset.openAlert) { const a = as.find(x => x.id === t.dataset.openAlert); a.seen = [...new Set([...a.seen, ...newIn(a).map(x => x.it.id)])]; db.LS.set('alerts', as); location.hash = a.hash; }
      if (t.dataset.delAlert) { db.LS.set('alerts', as.filter(x => x.id !== t.dataset.delAlert)); toast('Alerte supprimée'); rerender(); }
    });
  },
};
