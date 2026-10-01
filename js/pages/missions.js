// Missions payées sur les comptes de Djéli Pro (séquestre) : paiement, suivi, validation, reversement.
import * as db from '../store.js';
import { CONFIG } from '../config.js';
import { $, esc, fmt, crumbs, empty, toast, dateFr, ago, waHref, plural, link, catOf } from '../ui.js';

const rerender = () => window.dispatchEvent(new Event('djeli:render'));
const PAY = CONFIG.payAccounts || {}, BANK = CONFIG.bank || {};
export const STATUS = {
  awaiting_payment: ['À payer', 'hot'], payment_declared: ['Paiement en vérification', ''], paid: ['En cours', 'ok'], delivered: ['Livrée, à valider', 'hot'],
  completed: ['Terminée', 'ok'], disputed: ['Litige en cours', 'hot'], cancelled: ['Annulée', ''], refunded: ['Remboursée', ''],
};
export const METHODS = [['wave-ci', 'Wave'], ['orange-money-ci', 'Orange Money'], ['mtn-ci', 'MTN MoMo'], ['moov-ci', 'Moov Money'], ['virement', 'Virement bancaire']];
const METHOD_LABEL = Object.fromEntries(METHODS);
const WALLETS = [
  { id: 'wave', label: 'Wave', number: PAY.wave, link: PAY.waveLink, ussd: '' },
  { id: 'orange', label: 'Orange Money', number: PAY.orange, ussd: '#144#' },
  { id: 'mtn', label: 'MTN MoMo', number: PAY.mtn, ussd: '*133#' },
  { id: 'moov', label: 'Moov Money', number: PAY.moov, ussd: '*155#' },
].filter(w => w.number || w.link);
const PAY_LABEL = { wave: 'Wave', orange: 'Orange Money', mtn: 'MTN MoMo', moov: 'Moov Money', virement: 'virement bancaire' };
const tag = s => { const [l, c] = STATUS[s] || [s, '']; return `<span class="tag ${c}">${l}</span>`; };
const tel = code => 'tel:' + code.replace(/#/g, '%23');
const spaced = n => /^\d+$/.test(String(n || '')) ? String(n).replace(/(\d{2})(?=\d)/g, '$1 ') : esc(n || '');
const waveHref = amount => PAY.waveLink && PAY.waveLink.includes('{montant}') ? PAY.waveLink.replace('{montant}', amount) : PAY.waveLink;
const copyBtn = (v, l) => `<button type="button" class="ghost sm-btn" data-copy="${esc(v)}">${l}</button>`;

function timeline(m) {
  const steps = [['Payée', m.paid_at, 'Djéli Pro garde l\'argent en sécurité.'], ['Livrée', m.delivered_at, 'L\'expert livre le travail.'],
    ['Validée', m.completed_at, 'Vous validez le travail.'], ['Expert payé', m.payout_at, 'Djéli Pro reverse à l\'expert.']];
  return `<ol class="timeline">${steps.map(([l, d, t]) => `<li class="${d ? 'done' : ''}"><b>${l}</b><span>${d ? dateFr(d) : t}</span></li>`).join('')}</ol>`;
}

function payBox(m) {
  const opts = [...WALLETS];
  if (!opts.length && !BANK.rib) return '<p class="note">Aucun moyen de paiement n\'est configuré (payAccounts et bank dans js/config.js).</p>';
  const big = m.total > 2000000;
  return `<section class="panel paybox">
    <h2 class="h2">Payez ${fmt(m.total)} FCFA à ${esc(PAY.holder || 'Djéli Pro')}</h2>
    <p>Référence de la mission : <b class="ref">${esc(m.ref)}</b> ${copyBtn(m.ref, 'Copier')} <small class="muted">À indiquer en libellé du virement.</small></p>
    ${m.admin_note ? `<p class="note">Paiement précédent non retrouvé : ${esc(m.admin_note)} Vérifiez puis déclarez à nouveau.</p>` : ''}
    ${big && BANK.rib ? '<p class="note">Pour ce montant, le virement bancaire est conseillé (les comptes Mobile Money ont des plafonds).</p>' : ''}
    <div class="pay-opts">
      ${BANK.rib ? `<div class="pay-opt pay-bank"><b class="pay-name">Virement bancaire</b>
        <p>${esc(BANK.name || '')}<br>Titulaire : <b>${esc(BANK.holder || PAY.holder || 'Djéli Pro')}</b><br>RIB : <b class="num">${esc(BANK.rib)}</b></p>
        <div class="p-row tight">${copyBtn(BANK.rib, 'Copier le RIB')}${copyBtn(m.total, 'Copier le montant')}</div></div>` : ''}
      ${opts.map(w => `<div class="pay-opt pay-${w.id}"><b class="pay-name">${w.label}</b>
        ${w.link ? `<a class="btn btn-wave" href="${esc(waveHref(m.total))}" target="_blank" rel="noopener">Payer ${fmt(m.total)} FCFA avec Wave</a>${PAY.waveLink.includes('{montant}') ? '' : `<small>Saisissez <b>${fmt(m.total)} FCFA</b> dans Wave.</small>`}` : ''}
        ${w.number ? `<p>${w.link ? 'ou envoyez' : 'Envoyez'} <b>${fmt(m.total)} FCFA</b> au <b class="num">${spaced(w.number)}</b></p>
          <div class="p-row tight">${copyBtn(w.number, 'Copier le numéro')}${copyBtn(m.total, 'Copier le montant')}${w.ussd ? `<a class="ghost sm-btn" href="${tel(w.ussd)}">Ouvrir ${w.ussd}</a>` : ''}</div>` : ''}</div>`).join('')}
    </div>
    <form id="declForm" class="form-grid decl"><h3 class="h3">Après avoir payé, prévenez-nous</h3>
      <div class="row2"><label>Payé par<select name="method">${BANK.rib ? '<option value="virement">Virement bancaire</option>' : ''}${opts.map(w => `<option value="${w.id}">${w.label}</option>`).join('')}</select></label>
        <label>Numéro ou compte qui a payé<input name="phone" required value="${esc(m.payer_phone || m.client_phone || '')}"></label></div>
      <label>Référence de la transaction <small class="muted">(code du SMS ou référence du virement)</small><input name="tx" maxlength="60" value="${esc(m.payer_tx || '')}"></label>
      <button class="btn btn-green btn-wide">J'ai payé ${fmt(m.total)} FCFA</button></form>
    <p class="small muted">L'expert démarre dès que Djéli Pro a vérifié votre paiement. Il n'est payé qu'après votre validation du travail livré. <button class="linkbtn" data-op="cancel">Annuler la mission</button></p>
  </section>`;
}

/* ---------- Page d'une mission ---------- */
export const missionPage = {
  title: 'Mission',
  async render({ params }) {
    if (!db.isCloud()) return `<div class="wrap pad narrow">${empty('Paiement sécurisé indisponible.', 'Cette fonction demande la base de données en ligne.')}</div>`;
    if (!db.user()) { sessionStorage.setItem('djeli.after', location.hash); return `<div class="wrap pad narrow">${empty('Connectez-vous pour voir cette mission.', '', '<a class="btn btn-green" href="#/compte">Me connecter</a>')}</div>`; }
    let m; try { m = await db.getMission(params[0]); } catch (e) { m = null; }
    if (!m) return `<div class="wrap pad narrow">${empty('Mission introuvable.', 'Elle n\'existe pas ou ne vous concerne pas.', '<a class="btn btn-green" href="#/compte">Mon compte</a>')}</div>`;
    const me = db.user(), shop = m.shops || {};
    const admin = db.isAdminUser(), client = m.client === me.id, expert = shop.owner === me.id;
    let payout = null;
    if (admin) { try { payout = (await db.adminData()).payouts[m.shop_id]; } catch (e) {} }
    const acts = [];
    if (expert && m.status === 'paid') acts.push('<button class="btn btn-green" data-op="deliver">J\'ai livré le travail</button>');
    if (client && ['paid', 'delivered'].includes(m.status)) acts.push('<button class="btn btn-green" data-op="validate">Valider le travail et payer l\'expert</button><button class="btn btn-line" data-op="dispute">Signaler un problème</button>');
    if (admin && ['awaiting_payment', 'payment_declared'].includes(m.status)) acts.push('<button class="btn btn-green" data-op="verify">Paiement reçu ✓</button>' + (m.status === 'payment_declared' ? '<button class="btn btn-line" data-op="reject">Paiement introuvable</button>' : '') + '<button class="btn btn-line" data-op="cancel">Annuler</button>');
    if (admin && ['paid', 'delivered', 'disputed'].includes(m.status)) acts.push('<button class="btn btn-green" data-op="release">Valider pour le client</button><button class="btn btn-line" data-op="refunded">Marquer remboursée</button>');
    if (admin && m.status === 'completed' && m.payout_status !== 'paid') acts.push('<button class="btn btn-kola" data-op="payout_done">Marquer versé à l\'expert</button>');
    const notify = CONFIG.contactWhatsApp && client && m.status === 'payment_declared' ? `<a class="wa" href="${waHref(CONFIG.contactWhatsApp, `Bonjour Djéli Pro, j'ai payé la mission ${m.ref} : ${fmt(m.total)} FCFA par ${PAY_LABEL[m.pay_method] || ''}${m.payer_tx ? ', réf. ' + m.payer_tx : ''}.`)}" target="_blank" rel="noopener">Prévenir Djéli Pro sur WhatsApp</a>` : '';
    const notifyExpert = admin && shop.whatsapp && m.status === 'paid' ? `<a class="wa" href="${waHref(shop.whatsapp, `Bonjour ${shop.name}, la mission ${m.ref} (« ${m.title} ») est payée sur Djéli Pro. Vous pouvez démarrer : ${link('#/mission/' + m.id)}`)}" target="_blank" rel="noopener">Prévenir l'expert</a>` : '';
    const contact = client ? (shop.whatsapp && !['awaiting_payment', 'payment_declared'].includes(m.status) ? `<a class="wa" href="${waHref(shop.whatsapp, `Bonjour ${shop.name}, à propos de la mission ${m.ref} sur Djéli Pro.`)}" target="_blank" rel="noopener">Écrire à l'expert</a>` : '')
      : `<a class="wa" href="${waHref(m.client_phone, `Bonjour ${m.client_name}, ici ${expert ? shop.name : 'Djéli Pro'}, à propos de la mission ${m.ref}.`)}" target="_blank" rel="noopener">Écrire au client</a>`;
    return `<div class="wrap pad narrow">${crumbs([[admin && !client && !expert ? 'Administration' : 'Mon compte', admin && !client && !expert ? '#/admin' : '#/compte'], ['Mission ' + (m.ref || '')]])}
      <h1 class="h1">${esc(m.title)} ${tag(m.status)}</h1>
      <p class="muted">Mission ${esc(m.ref)} · ${esc(shop.name || '')} · ${dateFr(m.created_at)}${m.project_id ? ` · <a href="#/projet/${m.project_id}">voir le besoin</a>` : ''}</p>
      ${client && m.status === 'awaiting_payment' ? payBox(m) : ''}
      ${m.status === 'payment_declared' ? `<div class="panel"><p><b>Paiement déclaré ${ago(m.declared_at)}</b> : ${fmt(m.total)} FCFA par ${PAY_LABEL[m.pay_method] || ''} depuis ${spaced(m.payer_phone)}${m.payer_tx ? `, réf. ${esc(m.payer_tx)}` : ''}.</p>
        ${client ? `<p>Djéli Pro vérifie la réception (sous ${esc(CONFIG.paymentCheckDelay || 'quelques heures')}). L'expert est prévenu dès la vérification.</p>${notify}` : ''}</div>` : ''}
      ${['paid', 'delivered', 'completed'].includes(m.status) ? timeline(m) : ''}
      ${m.status === 'delivered' && client ? `<p class="note">L'expert indique avoir livré le travail${m.delivery_note ? ` : « ${esc(m.delivery_note)} »` : ''}. Vérifiez puis validez. Sans réponse sous 7 jours, Djéli Pro pourra valider après vous avoir contacté.</p>` : ''}
      ${m.status === 'disputed' ? `<p class="note">Litige ouvert : ${esc(m.dispute_reason || '')}. Djéli Pro contacte les deux parties. L'argent reste bloqué en attendant.</p>` : ''}
      ${acts.length || notifyExpert ? `<div class="p-row">${acts.join('')}${notifyExpert}</div>` : ''}
      ${admin && payout && m.status === 'completed' && m.payout_status !== 'paid' ? `<p class="note">À verser : <b>${fmt(m.expert_amount)} FCFA</b> par ${METHOD_LABEL[payout.method]} : <b>${spaced(payout.number)}</b> ${copyBtn(payout.number, 'Copier')}</p>` : ''}
      <section class="panel"><h2 class="h3">Détail</h2>
        <dl class="specs"><div><dt>Montant de la mission</dt><dd>${fmt(m.total)} FCFA</dd></div><div><dt>Délai annoncé</dt><dd>${esc(m.delay || '')}</dd></div>
        ${!client ? `<div><dt>Commission Djéli Pro</dt><dd>${fmt(m.commission)} FCFA</dd></div><div><dt>Pour l'expert</dt><dd><b>${fmt(m.expert_amount)} FCFA</b></dd></div>` : ''}
        <div><dt>Versement à l'expert</dt><dd>${m.payout_status === 'paid' ? 'Effectué le ' + dateFr(m.payout_at) : 'Après validation'}</dd></div></dl>
        ${m.description ? `<p class="p-desc">${esc(m.description)}</p>` : ''}</section>
      <section class="panel"><h2 class="h3">Contacts</h2><p>Client : ${esc(m.client_name || '')}, ${spaced(m.client_phone)}<br>Expert : ${esc(shop.name || '')}</p>${contact}</section>
    </div>`;
  },
  mount(el, { params }) {
    const id = params[0];
    el.addEventListener('click', async e => {
      const c = e.target.closest('[data-copy]');
      if (c) { try { await navigator.clipboard.writeText(c.dataset.copy); toast('Copié : ' + c.dataset.copy); } catch (err) { toast(c.dataset.copy); } return; }
      const b = e.target.closest('[data-op]'); if (!b) return;
      const op = b.dataset.op; let note = null;
      const ask = { validate: 'Validez-vous le travail livré ? L\'expert sera alors payé.', verify: 'Avez-vous bien vu ce paiement arriver sur vos comptes ?', release: 'Valider la mission à la place du client et libérer le paiement ?', cancel: 'Annuler cette mission ?' };
      if (ask[op] && !confirm(ask[op])) return;
      if (op === 'deliver') { note = prompt('Message au client (lien vers les livrables, résumé…) :', ''); if (note === null) return; }
      if (op === 'dispute') { note = prompt('Décrivez le problème :'); if (!note || !note.trim()) return; }
      if (op === 'reject') { note = prompt('Message pour le client :', 'Nous ne trouvons pas votre paiement.'); if (note === null) return; }
      if (op === 'refunded') { note = prompt('Comment avez-vous remboursé le client ?'); if (note === null) return; }
      if (op === 'payout_done') { note = prompt('Référence du transfert à l\'expert :'); if (note === null) return; }
      b.disabled = true;
      try { await db.missionOp(id, op, note); toast('C\'est enregistré'); rerender(); } catch (err) { toast(err.message); b.disabled = false; }
    });
    $('#declForm', el)?.addEventListener('submit', async e => {
      e.preventDefault(); const f = new FormData(e.target), btn = e.target.querySelector('button'); btn.disabled = true;
      try { await db.declarePayment(id, f.get('method'), f.get('phone'), f.get('tx')); toast('Merci ! Nous vérifions votre paiement.'); rerender(); } catch (err) { toast(err.message); btn.disabled = false; }
    });
  },
};

export function missionRows(list, who) {
  return list.map(m => `<a class="panel order-row" href="#/mission/${m.id}"><span><b>${esc(m.title)}</b><small>${esc(m.ref || '')} · ${who === 'client' ? esc((m.shops || {}).name || '') : esc(m.client_name || '')} · ${dateFr(m.created_at)}</small></span><span>${fmt(who === 'expert' ? m.expert_amount : m.total)} FCFA</span>${tag(m.status)}</a>`).join('');
}

/* ---------- Onglet « Missions et paiements » de l'espace expert ---------- */
export async function expertTab() {
  if (!db.isCloud()) return `<p class="note">Le paiement sécurisé des missions fonctionne une fois la base de données branchée (voir README).</p>`;
  const [payout, list] = await Promise.all([db.getPayout(), db.expertMissions()]);
  const sum = f => list.filter(f).reduce((t, m) => t + Number(m.expert_amount), 0);
  return `<div class="kpis"><div><b>${list.filter(m => ['paid', 'delivered'].includes(m.status)).length}</b><span>missions en cours</span></div>
      <div><b>${fmt(sum(m => ['paid', 'delivered', 'disputed'].includes(m.status) || (m.status === 'completed' && m.payout_status !== 'paid')))}</b><span>FCFA à recevoir</span></div>
      <div><b>${fmt(sum(m => m.payout_status === 'paid'))}</b><span>FCFA reçus</span></div></div>
    <form id="payoutForm" class="panel form-grid"><h2 class="h3">Où recevoir vos paiements</h2>
      <p class="muted small">Le client paie Djéli Pro avant que vous démarriez. Vous êtes payé dès qu'il valide votre travail, moins la commission de ${CONFIG.commissionPercent} %.</p>
      <div class="row2"><label>Moyen<select name="method">${METHODS.map(([v, l]) => `<option value="${v}" ${payout && payout.method === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Numéro (10 chiffres) ou RIB complet<input name="number" required value="${esc(payout ? payout.number : '')}" placeholder="0700000000"></label></div>
      <button class="btn btn-green">${payout ? 'Mettre à jour' : 'Activer le paiement sécurisé'}</button>
      ${payout ? '<p class="small ok-text">✓ Le paiement sécurisé est activé : les clients peuvent vous choisir et payer sur Djéli Pro.</p>' : '<p class="small muted">Sans cela, les clients ne pourront pas vous payer via Djéli Pro.</p>'}</form>
    <h2 class="h3">Mes missions</h2>${list.length ? missionRows(list, 'expert') : empty('Aucune mission pour le moment.', 'Répondez aux besoins des entreprises pour décrocher vos premières missions.', '<a class="btn btn-kola" href="#/projets">Voir les besoins</a>')}`;
}
export function mountExpertTab(el) {
  $('#payoutForm', el)?.addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.target);
    try { await db.savePayout({ method: f.get('method'), number: f.get('number') }); toast('Paiement sécurisé activé'); rerender(); } catch (err) { toast(err.message); }
  });
}

/* ---------- Administration ---------- */
export const adminPage = {
  title: 'Administration',
  async render({ query }) {
    if (!db.user()) return `<div class="wrap pad narrow">${empty('Réservé à l\'équipe Djéli Pro.', '', '<a class="btn btn-green" href="#/compte">Me connecter</a>')}</div>`;
    if (!db.isAdminUser()) return `<div class="wrap pad narrow">${empty('Accès réservé à l\'équipe Djéli Pro.', 'Ajoutez votre e-mail dans adminEmails (js/config.js) et dans la table admins de Supabase.')}</div>`;
    let d; try { d = await db.adminData(); } catch (e) { return `<div class="wrap pad narrow">${empty('Accès impossible.', esc(e.message))}</div>`; }
    const ms = d.missions, P = d.payouts;
    const late = new Date(Date.now() - 7 * 864e5).toISOString();
    const groups = {
      verify: ['Paiements à vérifier', ms.filter(m => m.status === 'payment_declared')],
      payout: ['Experts à payer', ms.filter(m => m.status === 'completed' && m.payout_status !== 'paid')],
      late: ['Livrées non validées (+7 j)', ms.filter(m => m.status === 'delivered' && m.delivered_at < late)],
      disputes: ['Litiges', ms.filter(m => m.status === 'disputed')],
      unpaid: ['Non payées', ms.filter(m => m.status === 'awaiting_payment')],
      all: ['Toutes', ms],
    };
    const tab = groups[query.get('tab')] ? query.get('tab') : (groups.verify[1].length ? 'verify' : groups.payout[1].length ? 'payout' : 'all');
    const cashed = ms.filter(m => ['paid', 'delivered', 'completed', 'disputed'].includes(m.status)).reduce((t, m) => t + Number(m.total), 0);
    const owed = ms.filter(m => ['paid', 'delivered', 'disputed'].includes(m.status) || (m.status === 'completed' && m.payout_status !== 'paid')).reduce((t, m) => t + Number(m.expert_amount), 0);
    const earned = ms.filter(m => m.payout_status === 'paid').reduce((t, m) => t + Number(m.commission), 0);
    const row = m => {
      const p = P[m.shop_id];
      const info = m.status === 'payment_declared' ? `${PAY_LABEL[m.pay_method] || ''}<br><small>de ${spaced(m.payer_phone)}${m.payer_tx ? '<br>réf. ' + esc(m.payer_tx) : ''}<br>${ago(m.declared_at)}</small>`
        : m.status === 'completed' && m.payout_status !== 'paid' && p ? `<b>${fmt(m.expert_amount)}</b> par ${METHOD_LABEL[p.method]}<br><small>${spaced(p.number)}</small> ${copyBtn(p.number, 'Copier')}`
        : m.payout_status === 'paid' ? `<small>Versé ${ago(m.payout_at)}<br>${esc(m.payout_ref || '')}</small>` : '';
      const btns = [];
      if (m.status === 'payment_declared') btns.push(`<button class="btn btn-green sm" data-a="verify" data-o="${m.id}">Reçu ✓</button><button class="linkbtn" data-a="reject" data-o="${m.id}">Pas reçu</button>`);
      if (m.status === 'awaiting_payment') btns.push(`<button class="linkbtn" data-a="verify" data-o="${m.id}">Reçu ✓</button><button class="linkbtn" data-a="cancel" data-o="${m.id}">Annuler</button>`);
      if (m.status === 'completed' && m.payout_status !== 'paid') btns.push(`<button class="btn btn-kola sm" data-a="payout_done" data-o="${m.id}">Versé ✓</button>`);
      if (['paid', 'delivered', 'disputed'].includes(m.status)) btns.push(`<button class="linkbtn" data-a="release" data-o="${m.id}">Valider</button><button class="linkbtn" data-a="refunded" data-o="${m.id}">Remboursée</button>`);
      return `<tr><td><a href="#/mission/${m.id}"><b>${esc(m.ref || '')}</b></a><br><small>${esc(m.title)}</small></td><td>${esc((m.shops || {}).name || '')}</td>
        <td>${esc(m.client_name || '')}<br><small>${spaced(m.client_phone)}</small></td><td><b>${fmt(m.total)}</b></td><td>${tag(m.status)}${m.dispute_reason ? `<br><small>${esc(m.dispute_reason)}</small>` : ''}</td>
        <td>${info}</td><td class="acts">${btns.join('')}</td></tr>`;
    };
    const list = groups[tab][1];
    return `<div class="wrap pad">${crumbs([['Administration']])}<h1 class="h1">Administration des missions</h1>
      <div class="kpis"><div><b>${groups.verify[1].length}</b><span>paiements à vérifier</span></div><div><b>${fmt(cashed)}</b><span>FCFA encaissés</span></div>
        <div><b>${fmt(owed)}</b><span>FCFA dus aux experts</span></div><div><b>${fmt(earned)}</b><span>FCFA de commissions</span></div></div>
      <nav class="tabs">${Object.entries(groups).map(([k, [l, a]]) => `<a href="#/admin?tab=${k}" class="${k === tab ? 'on' : ''}">${l} (${a.length})</a>`).join('')}</nav>
      ${{ verify: '<p class="small muted">Vérifiez dans votre banque ou votre application Mobile Money que le montant est arrivé, puis touchez « Reçu ». L\'expert peut alors démarrer.</p>',
          payout: '<p class="small muted">Envoyez le montant indiqué à l\'expert, puis touchez « Versé » avec la référence du transfert.</p>',
          late: '<p class="small muted">Contactez le client. S\'il est satisfait, validez la mission à sa place.</p>' }[tab] || ''}
      ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mission</th><th>Expert</th><th>Client</th><th>Montant</th><th>Statut</th><th>Paiement / versement</th><th></th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>` : empty('Rien à traiter ici.', '')}</div>`;
  },
  mount(el) {
    el.addEventListener('click', async e => {
      const c = e.target.closest('[data-copy]');
      if (c) { try { await navigator.clipboard.writeText(c.dataset.copy); toast('Copié'); } catch (err) { toast(c.dataset.copy); } return; }
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a; let note = null;
      if (a === 'verify' && !confirm('Avez-vous bien vu ce paiement arriver ?')) return;
      if (a === 'release' && !confirm('Valider la mission et libérer le paiement à l\'expert ?')) return;
      if (a === 'cancel' && !confirm('Annuler cette mission ?')) return;
      if (a === 'reject') { note = prompt('Message pour le client :', 'Nous ne trouvons pas votre paiement.'); if (note === null) return; }
      if (a === 'refunded') { note = prompt('Comment avez-vous remboursé le client ?'); if (note === null) return; }
      if (a === 'payout_done') { note = prompt('Référence du transfert à l\'expert :'); if (note === null) return; }
      b.disabled = true;
      try { await db.missionOp(b.dataset.o, a, note); toast('C\'est fait'); rerender(); } catch (err) { toast(err.message); b.disabled = false; }
    });
  },
};

/* ---------- Mes missions (côté entreprise et expert) ---------- */
export const myMissions = {
  title: 'Mes missions',
  async render() {
    if (!db.user()) return `<div class="wrap pad narrow">${empty('Connectez-vous pour voir vos missions.', '', '<a class="btn btn-green" href="#/compte">Me connecter</a>')}</div>`;
    if (!db.isCloud()) return `<div class="wrap pad narrow">${crumbs([['Mon compte', '#/compte'], ['Mes missions']])}<h1 class="h1">Mes missions</h1>${empty('Paiement sécurisé indisponible en mode démonstration.', 'Les missions payées apparaissent ici une fois la base de données branchée (voir README).')}</div>`;
    const [asClient, asExpert] = await Promise.all([db.myMissions(), db.expertMissions()]);
    return `<div class="wrap pad narrow">${crumbs([['Mon compte', '#/compte'], ['Mes missions']])}<h1 class="h1">Mes missions</h1>
      ${asClient.length ? `<h2 class="h2">En tant que client</h2>${missionRows(asClient, 'client')}` : ''}
      ${asExpert.length ? `<h2 class="h2 gap">En tant qu'expert</h2>${missionRows(asExpert, 'expert')}` : ''}
      ${!asClient.length && !asExpert.length ? empty('Aucune mission pour le moment.', 'Quand vous choisissez un expert sur un de vos besoins, la mission apparaît ici.', '<a class="btn btn-kola" href="#/publier">Publier un besoin</a>') : ''}</div>`;
  },
};
