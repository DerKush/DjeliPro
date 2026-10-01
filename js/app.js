// Point d'entrée : routeur, en-tête, actions globales, PWA.
import * as db from './store.js';
import { $, $$, toast, esc } from './ui.js';
import home from './pages/home.js';
import explore from './pages/explore.js';
import { categories, category, product, shop, shops } from './pages/catalog.js';
import { sell, dashboard } from './pages/seller.js';
import { account, favorites, alerts, alertCount } from './pages/account.js';
import { missionPage, myMissions, adminPage } from './pages/missions.js';
import { projectsList, projectPage, publish, myNeeds } from './pages/projects.js';
import { pricing, help, about, contact, cgu, privacy, legalNotice, notFound } from './pages/info.js';

const ROUTES = [
  [/^\/$/, home], [/^\/explorer$/, explore], [/^\/domaines$/, categories], [/^\/d\/([\w-]+)$/, category],
  [/^\/s\/([\w-]+)$/, product], [/^\/e\/([\w-]+)$/, shop], [/^\/experts$/, shops],
  [/^\/projets$/, projectsList], [/^\/projet\/([\w-]+)$/, projectPage], [/^\/publier$/, publish], [/^\/mes-besoins$/, myNeeds],
  [/^\/mission\/([\w-]+)$/, missionPage], [/^\/mes-missions$/, myMissions], [/^\/admin$/, adminPage],
  [/^\/vendre$/, sell], [/^\/espace$/, dashboard], [/^\/compte$/, account], [/^\/favoris$/, favorites], [/^\/alertes$/, alerts],
  [/^\/tarifs$/, pricing], [/^\/aide$/, help], [/^\/a-propos$/, about], [/^\/contact$/, contact],
  [/^\/cgu$/, cgu], [/^\/confidentialite$/, privacy], [/^\/mentions-legales$/, legalNotice],
];

let lastPath = null;
function parseHash() {
  let h = location.hash.replace(/^#/, '');
  try { h = decodeURI(h); } catch (e) {}
  h = h || '/';
  const [path, qs] = h.split('?');
  return { path: path.split('#')[0] || '/', query: new URLSearchParams(qs ? qs.split('#')[0] : '') };
}

async function render() {
  const { path, query } = parseHash();
  let page = notFound, params = [];
  for (const [re, pg] of ROUTES) { const m = path.match(re); if (m) { page = pg; params = m.slice(1); break; } }
  const ctx = { params, query };
  const main = $('#app');
  const view = document.createElement('div');
  view.className = 'view';
  try { view.innerHTML = await page.render(ctx); }
  catch (e) { console.error(e); view.innerHTML = `<div class="wrap pad"><div class="empty"><p class="empty-title">Cette page n'a pas pu s'afficher.</p><p>${esc(e.message)}</p><a class="btn btn-green" href="#/">Accueil</a></div></div>`; }
  main.replaceChildren(view);
  try { page.mount && page.mount(view, ctx); } catch (e) { console.error(e); }
  const t = typeof page.title === 'function' ? page.title(ctx) : page.title;
  document.title = `${t} | Djéli Pro`;
  if (path !== lastPath) { scrollTo({ top: 0 }); main.focus({ preventScroll: true }); }
  if (location.hash.includes('#avis')) setTimeout(() => $('#avis')?.scrollIntoView(), 50);
  lastPath = path;
  updateChrome(path);
}

function updateChrome(path = parseHash().path) {
  const favs = db.prefs.list('favs').length + db.prefs.list('follows').length;
  let alertsN = 0; try { alertsN = alertCount(); } catch (e) {}
  $$('[data-badge="favs"]').forEach(b => { b.textContent = favs; b.hidden = !favs; });
  const needs = db.myProjects().reduce((t, p) => t + (p.status === 'open' ? db.proposalsOf(p.id).filter(x => x.status === 'sent').length : 0), 0);
  $$('[data-badge="needs"]').forEach(b => { b.textContent = needs; b.hidden = !needs; });
  $$('[data-badge="alerts"]').forEach(b => { b.textContent = alertsN; b.hidden = !alertsN; });
  const u = db.user();
  $$('[data-account-label]').forEach(el => el.textContent = u ? u.name.split(' ')[0] : 'Compte');
  $$('.mainnav a, .tabbar a').forEach(a => {
    const href = a.getAttribute('href').slice(1);
    a.classList.toggle('on', href === '/' ? path === '/' : path.startsWith(href));
  });
}

/* ---------- Actions globales ---------- */
document.addEventListener('click', e => {
  const fav = e.target.closest('[data-fav]');
  if (fav) {
    e.preventDefault();
    const on = db.prefs.toggle('favs', fav.dataset.fav);
    $$(`[data-fav="${fav.dataset.fav}"]`).forEach(b => {
      b.setAttribute('aria-pressed', on);
      b.textContent = b.classList.contains('fav') ? (on ? '♥' : '♡') : (on ? '♥ Dans vos favoris' : '♡ Ajouter aux favoris');
    });
    toast(on ? 'Ajouté à vos favoris' : 'Retiré de vos favoris'); updateChrome(); return;
  }

  const wa = e.target.closest('[data-wa]');
  if (wa) db.prefs.track('wa', wa.dataset.wa);
  if (e.target.closest('#themeBtn')) {
    const root = document.documentElement;
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = cur === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('djelipro.theme', root.dataset.theme); } catch (err) {}
  }
  if (e.target.closest('#menuBtn')) document.body.classList.toggle('menu-open');
  else if (e.target.closest('.drawer a')) document.body.classList.remove('menu-open');
});
addEventListener('keydown', e => {
  if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); const i = $('form[data-search] input'); i ? i.focus() : (location.hash = '#/explorer'); }
  if (e.key === 'Escape') document.body.classList.remove('menu-open');
});

/* ---------- PWA ---------- */
function initPWA() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {});
  }
  let deferred;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $$('[data-install]').forEach(b => b.hidden = false); });
  document.addEventListener('click', async e => {
    if (!e.target.closest('[data-install]') || !deferred) return;
    deferred.prompt(); await deferred.userChoice; deferred = null; $$('[data-install]').forEach(b => b.hidden = true);
  });
  addEventListener('appinstalled', () => toast('Djéli Pro est installé sur votre téléphone'));
  addEventListener('offline', () => toast('Vous êtes hors connexion. Les pages déjà vues restent disponibles.'));
}

/* ---------- Démarrage ---------- */
(async () => {
  initPWA();
  try { await db.init(); } catch (e) { console.error(e); setTimeout(() => toast(e.message), 800); }
  db.onChange(() => updateChrome());
  addEventListener('hashchange', render);
  addEventListener('djeli:render', render);
  addEventListener('djeli:dberror', e => toast(e.detail));
  await render();
  window.__djeliBooted = true;
  const n = alertCount(); if (n) setTimeout(() => toast(`🔔 ${n} nouvelles annonces pour vos alertes`), 1500);
})();
