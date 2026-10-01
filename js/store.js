// Couche de données : mode local (démonstration, sur l'appareil) ou mode en ligne (Supabase).
import { CONFIG } from './config.js';
import { DEMO_SHOPS, DEMO_PRODUCTS, DEMO_REVIEWS, DEMO_PROJECTS, DEMO_PROPOSALS, COMMUNES } from './data.js';
import { prepare } from './search.js';

export const LS = {
  get(k, d) { try { const v = localStorage.getItem('djelipro.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('djelipro.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
};

let sb = null;
let KEY = '';
const S = { shops: [], products: [], reviews: [], projects: [], proposals: [], user: null };
const listeners = new Set();
export const onChange = fn => listeners.add(fn);
const emit = () => listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } });
export const isCloud = () => !!sb;

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
const userFrom = session => session ? {
  id: session.user.id, email: session.user.email,
  name: (session.user.user_metadata || {}).name || session.user.email.split('@')[0],
  phone: (session.user.user_metadata || {}).phone || '', commune: (session.user.user_metadata || {}).commune || '',
} : null;

const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + ' : délai dépassé')), ms))]);

export async function init() {
  KEY = (CONFIG.supabaseKey || CONFIG.supabaseAnonKey || '').trim();
  if (CONFIG.supabaseUrl && KEY) {
    try {
      await withTimeout(loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'), 8000, 'Chargement de Supabase');
      sb = window.supabase.createClient(CONFIG.supabaseUrl.trim().replace(/\/+$/, ''), KEY.trim(), { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } });
      const { data } = await withTimeout(sb.auth.getSession(), 8000, 'Session Supabase');
      S.user = userFrom(data.session);
      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') { S.recovery = true; setTimeout(() => { location.hash = '#/compte'; window.dispatchEvent(new Event('djeli:render')); }, 0); } const was = S.user && S.user.id; S.user = userFrom(session); if (was !== (S.user && S.user.id)) reload().then(emit); });
      if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + '#/compte');
    } catch (e) { console.warn('Supabase indisponible, passage en mode local.', e); sb = null; }
  }
  if (!sb) S.user = LS.get('user', null);
  try { await withTimeout(reload(), 10000, 'Lecture de la base'); }
  catch (e) {
    console.warn(e);
    if (sb) { sb = null; S.user = LS.get('user', null); await reload(); throw new Error('Base de données injoignable : vérifiez supabaseUrl et supabaseAnonKey dans js/config.js. Affichage en mode démonstration.'); }
  }
}

/* ---------- Conversion lignes <-> objets ---------- */
const arr = v => Array.isArray(v) ? v : (v ? String(v).split(/;\s*/) : []);
const toShop = r => ({ id: r.id, owner: r.owner, name: r.name, cat: r.cat, commune: r.commune, verified: !!r.verified, delivery: !!r.delivery,
  kind: r.kind || 'cabinet', headline: r.headline || '', years: r.years || 0, team: r.team_size || 1, languages: r.languages || 'FR', remote: !!r.remote,
  available: r.available !== false, certifications: arr(r.certifications), clients: arr(r.clients),
  open: r.open_hour ?? 8, close: r.close_hour ?? 20, desc: r.description || '', whatsapp: r.whatsapp || '', phone: r.phone || '',
  plan: r.plan || 'free', lat: r.lat, lng: r.lng, createdAt: r.created_at, baseRating: 0, baseReviews: 0, onlinePayment: !!r.online_payment });
const fromShop = s => ({ id: s.id, owner: s.owner, name: s.name, cat: s.cat, commune: s.commune, delivery: !!s.delivery,
  open_hour: +s.open || 8, close_hour: +s.close || 18, description: s.desc, whatsapp: s.whatsapp, phone: s.phone, lat: s.lat, lng: s.lng,
  kind: s.kind, headline: s.headline, years: +s.years || 0, team_size: +s.team || 1, languages: s.languages, remote: !!s.remote, available: s.available !== false,
  certifications: arr(s.certifications), clients: arr(s.clients) });
const toProduct = r => ({ id: r.id, shopId: r.shop_id, owner: r.owner, cat: r.cat, sub: r.sub, title: r.title, desc: r.description || '',
  price: +r.price, unit: r.unit || '', condition: r.condition || '', tags: r.tags || '', photos: r.photos || [], status: r.status || 'active', createdAt: r.created_at,
  delay: r.delay || '', deliverables: r.deliverables || '' });
const fromProduct = p => ({ id: p.id, shop_id: p.shopId, owner: p.owner, cat: p.cat, sub: p.sub, title: p.title, description: p.desc,
  price: p.price, unit: p.unit, condition: p.condition, tags: p.tags, photos: p.photos, status: p.status || 'active', delay: p.delay || '', deliverables: p.deliverables || '' });
const toProject = r => ({ id: r.id, owner: r.owner, clientLabel: r.client_label, title: r.title, cat: r.cat, sub: r.sub, budgetMin: +r.budget_min || 0, budgetMax: +r.budget_max || 0,
  durationDays: r.duration_days, commune: r.commune, remote: !!r.remote, desc: r.description, status: r.status, createdAt: r.created_at, proposalsCount: r.proposals_count || 0, invitedShop: r.invited_shop || null });
const toProposal = r => ({ id: r.id, projectId: r.project_id, shopId: r.shop_id, amount: +r.amount || 0, delay: r.delay, message: r.message, status: r.status, createdAt: r.created_at });
const toReview = r => ({ id: r.id, shopId: r.shop_id, author: r.author, rating: r.rating, text: r.text, createdAt: r.created_at, userId: r.user_id });

/* ---------- Chargement ---------- */
export async function reload() {
  const demo = CONFIG.showDemoData;
  let shops = demo ? DEMO_SHOPS.map(s => ({ ...s })) : [];
  let products = demo ? DEMO_PRODUCTS.map(p => ({ ...p })) : [];
  let reviews = demo ? DEMO_REVIEWS.map(r => ({ ...r })) : [];
  let projects = demo ? DEMO_PROJECTS.map(r => ({ ...r })) : [];
  let proposals = demo ? DEMO_PROPOSALS.map(r => ({ ...r })) : [];
  if (sb) {
    const [a, b, c, d, e] = await Promise.all([
      sb.from('shops').select('*'), sb.from('products').select('*').neq('status', 'deleted'), sb.from('reviews').select('*'),
      sb.from('projects').select('*').order('created_at', { ascending: false }).limit(300), sb.from('proposals').select('*'),
    ]);
    projects = projects.concat((d.data || []).map(toProject));
    proposals = proposals.concat((e.data || []).map(toProposal));
    const err = a.error || b.error || c.error;
    if (err) { console.error(err); setTimeout(() => window.dispatchEvent(new CustomEvent('djeli:dberror', { detail: frError(err).message })), 500); }
    shops = shops.concat((a.data || []).map(toShop));
    products = products.concat((b.data || []).map(toProduct));
    reviews = reviews.concat((c.data || []).map(toReview));
  } else {
    const db = LS.get('db', { shops: [], products: [], reviews: [] });
    shops = shops.concat(db.shops); products = products.concat(db.products); reviews = reviews.concat(db.reviews);
    projects = projects.concat(db.projects || []); proposals = proposals.concat(db.proposals || []);
  }
  const hidden = new Set(LS.get('hidden', []));
  products = products.filter(p => !hidden.has(p.id));
  enrich(shops, products, reviews);
  proposals = Object.values(Object.fromEntries(proposals.map(p => [p.id, p])));
  S.proposals = proposals;
  S.projects = projects.map(p => ({ ...p, proposalsCount: Math.max(p.proposalsCount || 0, proposals.filter(x => x.projectId === p.id).length) }));
}

function enrich(shops, products, reviews) {
  const byShop = {};
  reviews.forEach(r => (byShop[r.shopId] ||= []).push(r));
  shops.forEach(s => {
    const rs = byShop[s.id] || [];
    const extra = rs.filter(r => !r.demo);
    const n = (s.baseReviews || 0) + extra.length;
    const sum = (s.baseRating || 0) * (s.baseReviews || 0) + extra.reduce((t, r) => t + r.rating, 0);
    s.reviews = n; s.rating = n ? sum / n : 0;
    s.productCount = 0;
  });
  const shopById = Object.fromEntries(shops.map(s => [s.id, s]));
  products = products.filter(p => shopById[p.shopId]).map(p => {
    const s = shopById[p.shopId];
    if (p.status !== 'sold') s.productCount++;
    return prepare(Object.assign(p, { shop: s.name, commune: s.commune, lat: s.lat, lng: s.lng, verified: s.verified, delivery: s.delivery,
      open: s.open, close: s.close, whatsapp: s.whatsapp, phone: s.phone, plan: s.plan, rating: s.rating, reviews: s.reviews, status: p.status || 'active',
      kind: s.kind, available: s.available, remote: s.remote, headline: s.headline, years: s.years }));
  });
  S.shops = shops; S.products = products;
  S.reviews = reviews.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

/* ---------- Lecture ---------- */
export const shops = () => S.shops;
export const products = ({ includeSold = false } = {}) => includeSold ? S.products : S.products.filter(p => p.status !== 'sold');
export const getShop = id => S.shops.find(s => s.id === id);
export const getProduct = id => S.products.find(p => p.id === id);
export const reviewsOf = shopId => S.reviews.filter(r => r.shopId === shopId);
export const user = () => S.user;
export const isAdminUser = () => !!(S.user && S.user.email && (CONFIG.adminEmails || []).map(e => e.toLowerCase()).includes(S.user.email.toLowerCase()));
export const canPayOnline = shop => !!(sb && shop && shop.onlinePayment && !shop.demo);
export const inRecovery = () => !!S.recovery;
export const endRecovery = () => { S.recovery = false; };
export const myShop = () => S.user ? S.shops.find(s => s.owner === S.user.id) : null;
export const myProducts = () => { const s = myShop(); return s ? S.products.filter(p => p.shopId === s.id) : []; };

/* ---------- Comptes ---------- */
function frError(e) {
  const m = (e && e.message) || String(e);
  const map = [
    [/invalid login credentials/i, 'E-mail ou mot de passe incorrect.'],
    [/already registered|already exists/i, 'Un compte existe déjà avec cet e-mail. Utilisez « J\'ai déjà un compte ».'],
    [/password should be at least|weak password/i, 'Mot de passe trop court : 6 caractères minimum.'],
    [/email not confirmed/i, 'Confirmez d\'abord votre e-mail avec le lien reçu, puis connectez-vous.'],
    [/rate limit|too many/i, 'Trop de tentatives. Patientez quelques minutes.'],
    [/invalid.*email|unable to validate email/i, 'Adresse e-mail invalide.'],
    [/duplicate key.*reviews|reviews_shop_id_user_id/i, 'Vous avez déjà laissé un avis pour cette boutique.'],
    [/permission denied/i, 'Accès refusé par la base : relancez le fichier supabase/schema.sql dans Supabase.'],
    [/row-level security/i, 'Action non autorisée pour ce compte.'],
    [/failed to fetch|network/i, 'Connexion impossible. Vérifiez votre réseau.'],
  ];
  const hit = map.find(([re]) => re.test(m));
  return new Error(hit ? hit[1] : m);
}
async function afterAuth(session) { S.user = userFrom(session); await reload(); emit(); }

// Inscription par e-mail et mot de passe. Renvoie false si Supabase demande de confirmer l'e-mail.
export async function signUpPassword({ email, password, name, phone, commune }) {
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name, phone, commune }, emailRedirectTo: location.origin + location.pathname } });
  if (error) throw frError(error);
  if (data.session) { await afterAuth(data.session); return true; }
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw frError('already registered');
  return false;
}
export async function signInPassword({ email, password }) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw frError(error);
  await afterAuth(data.session);
}
export async function resetPassword(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + '#/compte' });
  if (error) throw frError(error);
}
export async function setNewPassword(password) {
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw frError(error);
}
export { frError };
export function signInLocal({ name, phone, commune }) {
  S.user = { id: 'u' + Math.random().toString(36).slice(2, 10), name, phone, commune, email: '' };
  LS.set('user', S.user); emit();
}
export async function updateProfile(patch) {
  if (!S.user) return;
  Object.assign(S.user, patch);
  if (sb) await sb.auth.updateUser({ data: { name: S.user.name, phone: S.user.phone, commune: S.user.commune } });
  else LS.set('user', S.user);
  emit();
}
export async function signOut() {
  if (sb) await sb.auth.signOut();
  S.user = null; LS.set('user', null); await reload(); emit();
}

/* ---------- Écriture ---------- */
const needUser = () => { if (!S.user) throw new Error('Connectez-vous d\'abord.'); };
const jitter = () => (Math.random() - 0.5) * 0.012;
function localDb() { const d = LS.get('db', { shops: [], products: [], reviews: [] }); d.projects ||= []; d.proposals ||= []; return d; }
function saveLocalDb(db) { if (!LS.set('db', db)) throw new Error('La mémoire de cet appareil est pleine. Retirez des photos ou des annonces.'); }

async function uploadPhotos(photos) {
  if (!sb) return photos;
  const out = [];
  for (const ph of photos) {
    if (!ph.startsWith('data:')) { out.push(ph); continue; }
    const blob = await (await fetch(ph)).blob();
    const path = `${S.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error } = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw frError(error);
    out.push(sb.storage.from('photos').getPublicUrl(path).data.publicUrl);
  }
  return out;
}

export async function saveShop(data) {
  needUser();
  const existing = myShop();
  const c = COMMUNES.find(x => x.id === data.commune) || COMMUNES[0];
  const moved = !existing || existing.commune !== data.commune;
  const shop = { ...(existing || {}), ...data, owner: S.user.id,
    lat: moved ? c.lat + jitter() : existing.lat, lng: moved ? c.lng + jitter() : existing.lng };
  if (sb) {
    const row = fromShop(shop); if (!existing) delete row.id;
    const { error } = await sb.from('shops').upsert(row);
    if (error) throw frError(error);
  } else {
    const db = localDb();
    if (!existing) { shop.id = 'ls' + Date.now(); shop.createdAt = new Date().toISOString(); shop.plan = 'free'; shop.verified = false; shop.baseRating = 0; shop.baseReviews = 0; }
    const clean = { ...shop }; ['rating', 'reviews', 'productCount'].forEach(k => delete clean[k]);
    db.shops = db.shops.filter(s => s.id !== shop.id).concat(clean);
    saveLocalDb(db);
  }
  await reload(); emit();
  return myShop();
}

export async function saveProduct(data) {
  needUser();
  const shop = myShop(); if (!shop) throw new Error('Créez d\'abord votre boutique.');
  const existing = data.id ? getProduct(data.id) : null;
  const base = { id: data.id, shopId: shop.id, owner: S.user.id, cat: data.cat, sub: data.sub, title: data.title, desc: data.desc || '',
    price: +data.price || 0, unit: data.unit || '', condition: data.condition || '', tags: data.tags || '', photos: data.photos || [], delay: data.delay || '', deliverables: data.deliverables || '',
    status: data.status || (existing && existing.status) || 'active', createdAt: existing ? existing.createdAt : new Date().toISOString() };
  let id = base.id;
  if (sb) {
    base.photos = await uploadPhotos(base.photos);
    const row = fromProduct(base); if (!existing) delete row.id;
    const { data: saved, error } = await sb.from('products').upsert(row).select().single();
    if (error) throw frError(error); id = saved.id;
  } else {
    const db = localDb();
    if (!existing) base.id = id = 'lp' + Date.now();
    db.products = db.products.filter(p => p.id !== base.id).concat(base);
    saveLocalDb(db);
  }
  await reload(); emit();
  return id;
}

export async function setProductStatus(id, status) {
  needUser();
  if (sb) { const { error } = await sb.from('products').update({ status }).eq('id', id); if (error) throw frError(error); }
  else {
    const db = localDb();
    if (status === 'deleted') db.products = db.products.filter(p => p.id !== id);
    else db.products = db.products.map(p => p.id === id ? { ...p, status } : p);
    saveLocalDb(db);
  }
  await reload(); emit();
}

export async function addReview({ shopId, rating, text }) {
  needUser();
  const r = { shopId, rating: +rating, text, author: S.user.name, userId: S.user.id, createdAt: new Date().toISOString() };
  if (sb) {
    const { error } = await sb.from('reviews').insert({ shop_id: shopId, rating: r.rating, text, author: r.author, user_id: S.user.id });
    if (error) throw frError(error);
  } else {
    const db = localDb(); r.id = 'lr' + Date.now(); db.reviews.push(r); saveLocalDb(db);
  }
  await reload(); emit();
}

export function hideProduct(id) {
  const h = LS.get('hidden', []); h.push(id); LS.set('hidden', h);
  if (sb) sb.from('reports').insert({ product_id: id }).then(() => {}, () => {});
  return reload().then(emit);
}

/* ---------- Préférences du visiteur (toujours sur l'appareil) ---------- */
export const prefs = {
  list(k) { return LS.get(k, []); },
  toggle(k, id) { const a = LS.get(k, []); const i = a.indexOf(id); i > -1 ? a.splice(i, 1) : a.unshift(id); LS.set(k, a); emit(); return i === -1; },
  has(k, id) { return LS.get(k, []).includes(id); },
  pushRecent(k, v, max = 8) { const a = [v, ...LS.get(k, []).filter(x => x !== v)].slice(0, max); LS.set(k, a); },
  cart() { return LS.get('cart', []); },
  setCart(c) { LS.set('cart', c); emit(); },
  addToCart(id, qty = 1) { this.track('cart', id); const c = LS.get('cart', []); const l = c.find(x => x.id === id); l ? l.qty += qty : c.push({ id, qty }); LS.set('cart', c); emit(); },
  track(type, id) { const st = LS.get('stats', {}); (st[type] ||= {})[id] = (st[type][id] || 0) + 1; LS.set('stats', st); },
  stat(type, id) { return ((LS.get('stats', {})[type]) || {})[id] || 0; },
};

/* ---------- Projets (besoins publiés) et propositions ---------- */
export const projects = () => S.projects;
export const getProject = id => S.projects.find(p => p.id === id);
export const proposalsOf = projectId => S.proposals.filter(p => p.projectId === projectId);
export const myProjects = () => S.user ? S.projects.filter(p => p.owner === S.user.id) : [];
export const myProposals = () => { const s = myShop(); return s ? S.proposals.filter(p => p.shopId === s.id) : []; };

export async function saveProject(data) {
  needUser();
  const row = { title: data.title, cat: data.cat, sub: data.sub, budgetMin: +data.budgetMin || 0, budgetMax: +data.budgetMax || 0, durationDays: +data.durationDays || 30,
    commune: data.commune, remote: !!data.remote, desc: data.desc, clientLabel: data.clientLabel || S.user.name };
  let id;
  if (sb) {
    const { data: saved, error } = await sb.from('projects').insert({ owner: S.user.id, client_label: row.clientLabel, title: row.title, cat: row.cat, sub: row.sub,
      budget_min: row.budgetMin, budget_max: row.budgetMax, duration_days: row.durationDays, commune: row.commune, remote: row.remote, description: row.desc, invited_shop: data.inviteShop || null }).select('id').single();
    if (error) throw frError(error); id = saved.id;
  } else {
    const db = localDb(); id = 'lpr' + Date.now();
    db.projects.push({ ...row, id, owner: S.user.id, status: 'open', createdAt: new Date().toISOString(), invited: data.inviteShop || null });
    saveLocalDb(db);
  }
  await reload(); emit(); return id;
}
export async function setProjectStatus(id, status) {
  needUser();
  if (sb) { const { error } = await sb.from('projects').update({ status }).eq('id', id); if (error) throw frError(error); }
  else { const db = localDb(); db.projects = db.projects.map(p => p.id === id ? { ...p, status } : p); saveLocalDb(db); }
  await reload(); emit();
}
export async function sendProposal(projectId, { amount, delay, message }) {
  needUser();
  const shop = myShop(); if (!shop) throw new Error('Créez d\'abord votre profil d\'expert.');
  if (sb) {
    const { error } = await sb.rpc('send_proposal', { p_project: projectId, p_shop: shop.id, p_amount: +amount || 0, p_delay: delay, p_message: message });
    if (error) throw frError(error);
  } else {
    const p = getProject(projectId);
    if (p && p.owner === S.user.id) throw new Error('Vous ne pouvez pas répondre à votre propre besoin.');
    if (S.proposals.some(x => x.projectId === projectId && x.shopId === shop.id)) throw new Error('Vous avez déjà envoyé une proposition pour ce besoin.');
    const db = localDb(); db.proposals.push({ id: 'lpp' + Date.now(), projectId, shopId: shop.id, amount: +amount || 0, delay, message, status: 'sent', createdAt: new Date().toISOString() }); saveLocalDb(db);
  }
  await reload(); emit();
}
export async function proposalOp(id, op) {
  needUser();
  if (sb) {
    const { data, error } = await sb.rpc(op === 'accept' ? 'accept_proposal' : 'decline_proposal', { p_proposal: id });
    if (error) throw frError(error);
    await reload(); emit();
    return Array.isArray(data) ? data[0] : data;
  }
  const db = localDb();
  const p = S.proposals.find(x => x.id === id);
  const status = op === 'accept' ? 'accepted' : 'declined';
  const local = db.proposals.find(x => x.id === id);
  if (local) local.status = status; else db.proposals.push({ ...p, status, demoOverride: true });
  if (op === 'accept') db.projects = db.projects.map(pr => pr.id === p.projectId ? { ...pr, status: 'assigned' } : pr);
  saveLocalDb(db); await reload(); emit(); return null;
}

/* ---------- Missions payées sur les comptes Djéli Pro (séquestre) ---------- */
const PAY = CONFIG.payAccounts || {};
export const payConfigured = () => !!(PAY.waveLink || PAY.wave || PAY.orange || PAY.mtn || PAY.moov || (CONFIG.bank && CONFIG.bank.rib));
async function rpc(name, args) {
  if (!sb) throw new Error('Le paiement sécurisé nécessite la base de données (voir README).');
  if (!S.user) throw new Error('Connectez-vous pour continuer.');
  const { data, error } = await sb.rpc(name, args);
  if (error) {
    if (/could not find the function|function .* does not exist/i.test(error.message)) throw new Error('La base n\'est pas à jour : relancez supabase/schema.sql dans Supabase.');
    throw frError(error);
  }
  return Array.isArray(data) ? data[0] : data;
}
export const declarePayment = (id, method, phone, tx) => rpc('declare_payment', { p_mission: id, p_method: method, p_phone: phone, p_tx: tx });
export const missionOp = (id, op, note = null) => rpc('mission_op', { p_mission: id, p_op: op, p_note: note });
export async function getMission(id) {
  if (!sb) return null;
  const { data, error } = await sb.from('missions').select('*, shops(name, owner, whatsapp)').eq('id', id).maybeSingle();
  if (error) throw frError(error);
  return data;
}
export async function myMissions() {
  if (!sb || !S.user) return [];
  const { data, error } = await sb.from('missions').select('*, shops(name)').eq('client', S.user.id).order('created_at', { ascending: false }).limit(100);
  if (error) { console.error(error); return []; }
  return data;
}
export async function expertMissions() {
  const shop = myShop(); if (!sb || !shop) return [];
  const { data, error } = await sb.from('missions').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(200);
  if (error) { console.error(error); return []; }
  return data;
}
export async function adminData() {
  if (!sb || !S.user) throw new Error('Connectez-vous.');
  const [o, p] = await Promise.all([
    sb.from('missions').select('*, shops(name, whatsapp)').neq('status', 'cancelled').order('created_at', { ascending: false }).limit(500),
    sb.from('shop_payouts').select('*'),
  ]);
  if (o.error) throw frError(o.error);
  return { missions: o.data, payouts: Object.fromEntries((p.data || []).map(x => [x.shop_id, x])) };
}
export async function getPayout() {
  const shop = myShop(); if (!sb || !shop) return null;
  const { data } = await sb.from('shop_payouts').select('*').eq('shop_id', shop.id).maybeSingle();
  return data;
}
export async function savePayout({ method, number }) {
  const shop = myShop(); needUser(); if (!sb || !shop) throw new Error('Créez d\'abord votre profil d\'expert.');
  let n = String(number).trim();
  if (method === 'virement') { n = n.replace(/\s+/g, ' '); if (n.replace(/\s/g, '').length < 10) throw new Error('Indiquez votre RIB complet.'); }
  else { n = n.replace(/\D/g, '').replace(/^225(?=\d{10}$)/, ''); if (!/^\d{10}$/.test(n)) throw new Error('Le numéro doit comporter 10 chiffres.'); }
  const { error } = await sb.from('shop_payouts').upsert({ shop_id: shop.id, owner: S.user.id, method, number: n, updated_at: new Date().toISOString() });
  if (error) throw frError(error);
  await reload(); emit();
}
