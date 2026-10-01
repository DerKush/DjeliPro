import { CATEGORIES, COMMUNES } from '../data.js';
import * as db from '../store.js';
import { $, $$, esc, catOf, productCard, shopCard, reduced } from '../ui.js';
import { projectRow } from './catalog.js';
import { searchBox, mountSearch } from '../searchbox.js';

const CENTER = { x: 200, y: 195 };
const proj = c => ({ x: 200 + (c.lng + 3.99) * 1400, y: 195 - (c.lat - 5.335) * 1400 });
const CITY_POS = { bouake: 50, yamoussoukro: 125, 'san-pedro': 200, daloa: 275, korhogo: 350 };
const SIDE = { treichville: 'left', plateau: 'left', adjame: 'left', marcory: 'below', 'port-bouet': 'left', bingerville: 'left' };

function radar() {
  const counts = {};
  db.shops().forEach(s => counts[s.commune] = (counts[s.commune] || 0) + 1);
  const rings = [60, 110, 160].map(r => `<circle class="ring" cx="${CENTER.x}" cy="${CENTER.y}" r="${r}"/>`).join('');
  const waves = [1, 2, 3].map(i => `<circle class="wave w${i}" cx="${CENTER.x}" cy="${CENTER.y}" r="185" style="--cx:${CENTER.x}px;--cy:${CENTER.y}px"/>`).join('');
  const nodes = COMMUNES.map(c => {
    const p = c.city ? { x: CITY_POS[c.id], y: 350 } : proj(c);
    const k = counts[c.id] || 0, r = k ? Math.min(7 + k * 1.3, 16) : 4;
    const side = c.city ? 'below' : (SIDE[c.id] || 'right');
    const lx = side === 'left' ? p.x - r - 5 : side === 'below' ? p.x : p.x + r + 5;
    const ly = side === 'below' ? p.y + r + 12 : p.y + 4;
    const anchor = side === 'left' ? 'end' : side === 'below' ? 'middle' : 'start';
    return `<a href="#/experts?commune=${c.id}" class="node ${k ? 'hit' : ''}" aria-label="${esc(c.name)} : ${k} experts">
      <circle class="dot" cx="${p.x}" cy="${p.y}" r="${r}"/>${k && r >= 9 ? `<text class="count" x="${p.x}" y="${p.y}">${k}</text>` : ''}
      <text x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(c.name)}</text></a>`;
  }).join('');
  const total = db.shops().length;
  return `<figure class="radar-wrap"><svg viewBox="0 0 400 380" role="img" aria-label="Carte des annonces par commune">${rings}
    <path class="lagoon" d="M28 236 C 90 222, 140 246, 196 230 S 300 220, 388 236"/>
    <line x1="20" y1="324" x2="380" y2="324" stroke="rgba(255,255,255,.18)" stroke-dasharray="4 5"/>
    <text x="20" y="316" fill="rgba(255,255,255,.55)" font-size="10" font-family="Figtree">Autres villes</text>${waves}${nodes}</svg>
    <figcaption class="radar-cap">${total} cabinets et indépendants à Abidjan et dans les grandes villes. Touchez une commune pour voir ses experts.</figcaption></figure>`;
}

export default {
  title: 'Les experts qui font avancer votre entreprise',
  render() {
    const all = db.products();
    const topShops = [...db.shops()].sort((a, b) => b.verified - a.verified || b.rating * Math.log10(10 + b.reviews) - a.rating * Math.log10(10 + a.reviews)).slice(0, 6);
    const popular = [...all].sort((a, b) => b.rating * Math.log10(10 + b.reviews) - a.rating * Math.log10(10 + a.reviews)).slice(0, 8);
    const needs = db.projects().filter(p => p.status === 'open' && !p.invitedShop && !p.invited).slice(0, 5);
    const counts = {}; db.shops().forEach(s => counts[s.cat] = (counts[s.cat] || 0) + 1);
    return `
    <section class="hero"><div class="wrap hero-grid">
      <div class="hero-text">
        <h1>Les experts qui font avancer votre entreprise.</h1>
        <p class="lede">Développeurs, experts-comptables, cabinets de recouvrement, avocats, recruteurs, agences… Djéli Pro réunit les professionnels vérifiés de Côte d'Ivoire. Décrivez votre besoin, comparez les propositions, payez en toute sécurité.</p>
        ${searchBox('', { big: true, id: 'hq' })}
        <div class="tries"><span>Essayez</span>
          ${['développeur pour une application mobile', 'recouvrement de factures impayées', 'expert-comptable au Plateau', 'création de SARL', 'community manager à distance'].map(t => `<a class="try" href="#/explorer?q=${encodeURIComponent(t)}">${t}</a>`).join('')}
        </div>
        <div class="hero-cta"><a class="btn btn-kola" href="#/publier">Publier un besoin, c'est gratuit</a><a class="linkbtn" href="#/vendre">Je suis expert</a></div>
      </div>
      ${radar()}
    </div></section>

    <section class="block"><div class="wrap">
      <div class="block-head"><h2 class="h2">${CATEGORIES.length} domaines d'expertise</h2><a class="more" href="#/domaines">Toutes les spécialités</a></div>
      <div class="cat-grid">${CATEGORIES.map(c => `<a class="cat" style="--c:${c.color}" href="#/d/${c.id}"><span class="em" aria-hidden="true">${c.emoji}</span>${esc(c.label)}<small>${counts[c.id] || 0} experts</small></a>`).join('')}</div>
    </div></section>

    <section class="block"><div class="wrap">
      <div class="block-head"><h2 class="h2">Experts recommandés</h2><a class="more" href="#/experts">Tous les experts</a></div>
      <div class="shop-grid">${topShops.map(shopCard).join('')}</div>
    </div></section>

    <section class="block"><div class="wrap">
      <div class="block-head"><h2 class="h2">Prestations populaires</h2><a class="more" href="#/explorer">Toutes les prestations</a></div>
      <div class="rail">${popular.map(p => productCard(p)).join('')}</div>
    </div></section>

    ${needs.length ? `<section class="block"><div class="wrap">
      <div class="block-head"><h2 class="h2">Derniers besoins publiés</h2><a class="more" href="#/projets">Tous les besoins</a></div>
      <div class="proj-list">${needs.map(projectRow).join('')}</div>
    </div></section>` : ''}

    <section class="block how"><div class="wrap">
      <h2 class="h2">Comment ça marche</h2>
      <div class="how-tabs" role="tablist">
        <button role="tab" aria-selected="true" class="ht on" data-how="client">Je cherche un expert</button>
        <button role="tab" aria-selected="false" class="ht" data-how="vendeur">Je suis expert</button>
      </div>
      <ol class="steps" data-how-panel="client">
        <li><h3>Décrivez votre besoin</h3><p>En quelques lignes, gratuitement. Ou demandez directement un devis à l'expert de votre choix.</p></li>
        <li><h3>Comparez les propositions</h3><p>Prix, délais, références, avis : vous choisissez l'expert qui vous convient.</p></li>
        <li><h3>Payez en sécurité</h3><p>Vous payez Djéli Pro. L'expert n'est payé qu'une fois le travail livré et validé par vous.</p></li>
      </ol>
      <ol class="steps" data-how-panel="vendeur" hidden>
        <li><h3>Créez votre profil</h3><p>Expertise, agréments, références, tarifs. Gratuit, en dix minutes.</p></li>
        <li><h3>Répondez aux besoins</h3><p>Recevez les besoins de votre domaine et envoyez vos propositions chiffrées.</p></li>
        <li><h3>Travaillez l'esprit tranquille</h3><p>Le client a payé avant que vous démarriez. Vous êtes réglé dès qu'il valide votre travail.</p></li>
      </ol>
    </div></section>

    <section class="pay escrow"><div class="wrap escrow-in">
      <div><h2 class="h2">Le paiement sécurisé, pour les deux côtés</h2>
      <p>L'entreprise paie Djéli Pro par virement, Wave, Orange Money, MTN ou Moov. L'argent est conservé pendant la mission et versé à l'expert après validation. En cas de désaccord, notre équipe arbitre.</p></div>
      <ol class="escrow-steps"><li>Le client paie</li><li>L'expert réalise</li><li>Le client valide</li><li>L'expert est payé</li></ol>
    </div></section>

    <section class="block"><div class="wrap">
      <div class="cta-sell">
        <div><h2 class="h2">Vous êtes consultant, cabinet ou indépendant ?</h2><p>Rejoignez Djéli Pro et recevez chaque semaine des besoins d'entreprises dans votre domaine.</p></div>
        <div class="cta-row"><a class="btn btn-kola" href="#/vendre">Créer mon profil d'expert</a><a class="btn btn-line" href="#/tarifs">Voir les offres</a></div>
      </div>
    </div></section>`;
  },
  mount(el) {
    mountSearch(el, q => { location.hash = '#/explorer?q=' + encodeURIComponent(q); });
    if (!reduced()) $$('.wave', el).forEach(w => w.classList.add('go'));
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-how]'); if (!t) return;
      $$('.ht', el).forEach(b => { b.classList.toggle('on', b === t); b.setAttribute('aria-selected', b === t); });
      $$('[data-how-panel]', el).forEach(p => p.hidden = p.dataset.howPanel !== t.dataset.how);
    });
  },
};
