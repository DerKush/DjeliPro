import { CONFIG } from '../config.js';
import * as db from '../store.js';
import { $, esc, crumbs, empty, toast } from '../ui.js';
import { planCards, contactPlan } from './seller.js';
import { CATEGORIES } from '../data.js';

const contactLink = (text) => CONFIG.contactWhatsApp ? `https://wa.me/${CONFIG.contactWhatsApp}?text=${encodeURIComponent(text)}` : `mailto:${CONFIG.contactEmail}`;

export const pricing = {
  title: 'Tarifs',
  render() {
    return `<div class="wrap pad">${crumbs([['Tarifs']])}
      <h1 class="h1">Gratuit pour les entreprises. Simple pour les experts.</h1>
      <p class="lede">Publier un besoin et recevoir des propositions est gratuit. Les experts commencent gratuitement et passent à une offre payante quand Djéli Pro leur apporte des missions.</p>
      <h2 class="h2">Pour les experts</h2>
      <div class="plans">${planCards(db.myShop() ? db.myShop().plan : '')}</div>
      <section class="panel"><h2 class="h3">Missions payées sur Djéli Pro</h2><p>Quand une entreprise vous paie par la plateforme (paiement sécurisé), Djéli Pro prélève une commission de ${CONFIG.commissionPercent} % sur le montant de la mission. Elle couvre la gestion du paiement, la garantie et l'arbitrage en cas de désaccord. Les missions conclues en dehors de la plateforme ne sont pas commissionnées.</p></section>
      <section class="faq"><h2 class="h2">Questions fréquentes</h2>
        <details><summary>Les entreprises paient-elles quelque chose ?</summary><p>Non. Publier un besoin, recevoir et comparer des propositions est gratuit. L'entreprise paie seulement la mission qu'elle choisit, au prix proposé par l'expert.</p></details>
        <details><summary>Comment obtenir le badge « Vérifié » ?</summary><p>Envoyez à l'équipe Djéli Pro votre RCCM, vos agréments (Ordre des experts-comptables, Barreau, etc.) ou vos diplômes. Nous les contrôlons sous 72 h.</p></details>
        <details><summary>Comment je paie mon abonnement ?</summary><p>Par Mobile Money ou virement auprès de l'équipe Djéli Pro. L'offre est activée sous 24 h, sans engagement.</p></details>
      </section></div>`;
  },
  mount(el) { el.addEventListener('click', e => { const t = e.target.closest('[data-plan]'); if (t) contactPlan(t.dataset.plan, db.myShop()); }); },
};

const FAQ = [
  ['Entreprises', [
    ['Comment trouver le bon expert ?', 'Tapez votre besoin dans la recherche, par exemple « expert-comptable au Plateau » ou « développeur d\'application à distance ». Ou publiez votre besoin : les experts du domaine vous envoient leurs propositions.'],
    ['Combien de temps pour recevoir des propositions ?', 'Les premières arrivent en général sous 48 h. Vous pouvez aussi demander directement un devis à un expert depuis son profil.'],
    ['Comment choisir entre plusieurs propositions ?', 'Comparez le prix, le délai, la méthode décrite, les références, les agréments et les avis. N\'hésitez pas à échanger avec les experts sur WhatsApp avant de choisir.'],
    ['Comment fonctionne le paiement sécurisé ?', 'Quand vous choisissez un expert, vous payez Djéli Pro par virement, Wave, Orange Money, MTN ou Moov. L\'argent est conservé pendant la mission. L\'expert est payé quand vous validez le travail livré. En cas de problème, signalez-le : l\'argent reste bloqué et notre équipe arbitre.'],
    ['Recevez-vous des factures ?', 'L\'expert vous établit sa facture pour la mission. Djéli Pro vous remet un reçu pour le paiement sécurisé.'],
  ]],
  ['Experts', [
    ['Qui peut s\'inscrire ?', 'Les cabinets, entreprises de services et indépendants exerçant en Côte d\'Ivoire. Les professions réglementées (expertise comptable, avocats, architectes…) doivent justifier de leur inscription pour obtenir le badge « Vérifié ».'],
    ['Comment recevoir des besoins ?', 'Votre espace expert, onglet Opportunités, liste les besoins de votre domaine et les demandes de devis qui vous sont adressées.'],
    ['Quand suis-je payé ?', 'Le client paie avant que vous démarriez. Dès qu\'il valide votre travail, Djéli Pro vous verse le montant moins la commission, sur votre Mobile Money ou par virement.'],
    ['Et si le client ne valide pas ?', 'Si le client ne répond pas 7 jours après votre livraison, l\'équipe Djéli Pro le contacte puis peut valider à sa place. En cas de désaccord, nous examinons les échanges et les livrables.'],
  ]],
  ['Plateforme', [
    ['Faut-il installer une application ?', 'Non. Djéli Pro s\'ouvre dans le navigateur et peut s\'installer sur l\'écran d\'accueil, comme une application.'],
    ['Djéli Pro et Djéli, c\'est pareil ?', 'Djéli fait connaître les commerces de proximité. Djéli Pro est dédié aux services professionnels pour les entreprises.'],
  ]],
];

export const help = {
  title: 'Aide',
  render() {
    return `<div class="wrap pad narrow">${crumbs([['Aide']])}<h1 class="h1">Comment pouvons-nous vous aider ?</h1>
      ${FAQ.map(([t, qs]) => `<section class="faq"><h2 class="h2">${t}</h2>${qs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>`).join('')}
      <section class="panel"><h2 class="h3">Vous n'avez pas trouvé ?</h2><p>Écrivez-nous, nous répondons sous 24 h.</p><a class="btn btn-green" href="#/contact">Nous contacter</a></section></div>`;
  },
};

export const about = {
  title: 'À propos',
  render() {
    return `<div class="wrap pad narrow prose">${crumbs([['À propos']])}<h1 class="h1">Le griot des professionnels ivoiriens</h1>
      <p class="lede">Dans la tradition mandingue, le djéli fait connaître les noms et les réputations. Djéli Pro fait connaître les experts qui font avancer les entreprises de Côte d'Ivoire.</p>
      <p>Trouver un bon développeur, un cabinet de recouvrement sérieux ou un expert-comptable disponible se fait encore surtout par le bouche-à-oreille. Les entreprises perdent du temps, et beaucoup de professionnels compétents restent invisibles.</p>
      <p>Djéli Pro réunit les cabinets et les indépendants dans ${CATEGORIES.length} domaines, de l'informatique à la finance en passant par le juridique, les ressources humaines, le marketing, l'ingénierie ou la logistique. Les entreprises décrivent leur besoin, comparent les propositions et paient en toute sécurité.</p>
      <h2 class="h2">Nos engagements</h2>
      <ul><li><b>Des experts vérifiés</b> : RCCM, agréments et diplômes contrôlés.</li><li><b>Un paiement sécurisé</b> : l'expert est payé quand le client valide.</li>
      <li><b>Gratuit pour les entreprises</b> : publier un besoin ne coûte rien.</li><li><b>Un arbitrage humain</b> en cas de désaccord.</li></ul>
      <a class="btn btn-kola" href="#/publier">Publier un besoin</a> <a class="btn btn-line" href="#/vendre">Devenir expert</a></div>`;
  },
};

export const contact = {
  title: 'Contact',
  render() {
    return `<div class="wrap pad narrow">${crumbs([['Contact']])}<h1 class="h1">Nous contacter</h1>
      <p class="lede">Une question, un partenariat, un problème sur une mission ? Écrivez-nous.</p>
      <form id="contactForm" class="panel form-grid">
        <div class="row2"><label>Nom<input name="name" required></label><label>Téléphone ou e-mail<input name="from" required></label></div>
        <label>Sujet<select name="subject"><option>Trouver un expert</option><option>Mon profil d'expert</option><option>Paiement d'une mission</option><option>Vérification (badge)</option><option>Offres Pro et Premium</option><option>Signaler un problème</option><option>Partenariat</option></select></label>
        <label>Message<textarea name="msg" rows="5" required></textarea></label>
        <button class="btn btn-green">Envoyer ${CONFIG.contactWhatsApp ? 'sur WhatsApp' : 'par e-mail'}</button>
      </form>
      <p class="muted">E-mail : <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a></p></div>`;
  },
  mount(el) {
    $('#contactForm', el).addEventListener('submit', e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      const text = `[${f.subject}] ${f.msg}\n\n${f.name}, ${f.from}`;
      if (CONFIG.contactWhatsApp) window.open(contactLink(text), '_blank');
      else location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent('Djéli Pro : ' + f.subject)}&body=${encodeURIComponent(text)}`;
      toast('Merci, votre message est prêt à être envoyé.');
    });
  },
};

const legal = (title, body) => ({ title, render: () => `<div class="wrap pad narrow prose">${crumbs([[title]])}<h1 class="h1">${title}</h1>
  <p class="note">Modèle à compléter et à faire valider par un juriste avant le lancement. Les passages entre crochets sont à remplacer.</p>${body}</div>` });

export const cgu = legal('Conditions générales d\'utilisation', `
  <h2 class="h3">1. Objet</h2><p>Les présentes conditions encadrent l'utilisation de Djéli Pro, plateforme de mise en relation entre entreprises et prestataires de services professionnels, éditée par [raison sociale], [forme juridique] au capital de [montant] FCFA, RCCM [numéro], Abidjan.</p>
  <h2 class="h3">2. Rôle de Djéli Pro</h2><p>Djéli Pro met en relation des clients et des experts. Le contrat de prestation est conclu directement entre le client et l'expert, qui reste seul responsable de la qualité, de la conformité et des délais de ses prestations, ainsi que du respect des règles de sa profession.</p>
  <h2 class="h3">3. Experts</h2><p>L'expert garantit l'exactitude de son profil (identité, agréments, références). Les professions réglementées n'exercent que dans les limites de leur inscription. Djéli Pro peut suspendre un profil trompeur.</p>
  <h2 class="h3">4. Besoins et propositions</h2><p>Le client décrit son besoin de bonne foi. Les propositions des experts engagent leurs auteurs dès leur acceptation par le client.</p>
  <h2 class="h3">5. Paiement sécurisé</h2><p>Lorsqu'une mission est payée sur la plateforme, Djéli Pro encaisse le prix au nom et pour le compte de l'expert, le conserve pendant la mission et le reverse à l'expert après validation du travail par le client, déduction faite d'une commission de [taux] %. Sans réponse du client [7] jours après la livraison déclarée, Djéli Pro peut valider la mission après l'avoir contacté. En cas de réclamation, les fonds restent bloqués jusqu'à la résolution du litige, qui peut aboutir à un remboursement total ou partiel.</p>
  <h2 class="h3">6. Non-contournement</h2><p>[À préciser : engagement des parties à régler via la plateforme les missions issues d'une mise en relation sur Djéli Pro, pendant une durée déterminée.]</p>
  <h2 class="h3">7. Confidentialité</h2><p>Les informations échangées dans le cadre d'un besoin ou d'une mission sont confidentielles. L'expert s'interdit de les utiliser à d'autres fins.</p>
  <h2 class="h3">8. Responsabilité et droit applicable</h2><p>Djéli Pro n'est pas responsable de l'exécution des prestations. Les présentes conditions sont soumises au droit ivoirien, notamment aux lois n° 2013-546 sur les transactions électroniques et n° 2016-412 sur la consommation. Tout litige relève des tribunaux d'Abidjan.</p>`);

export const privacy = legal('Politique de confidentialité', `
  <h2 class="h3">Données collectées</h2><p>Nom, téléphone, ville, e-mail, profil d'expert, besoins publiés, propositions, missions, avis, et données techniques de navigation. La position n'est utilisée que si vous touchez « Près de moi », pour trier les résultats, et n'est pas conservée.</p>
  <h2 class="h3">Finalités</h2><p>Faire fonctionner la plateforme, afficher vos annonces, mettre en relation acheteurs et commerçants, améliorer le service et lutter contre la fraude.</p>
  <h2 class="h3">Données sur votre appareil</h2><p>Favoris, alertes et préférences sont enregistrés dans votre navigateur. Vous pouvez les effacer à tout moment depuis Mon compte.</p>
  <h2 class="h3">Partage</h2><p>Vos coordonnées de commerçant sont visibles des acheteurs. Djéli ne vend pas vos données. Les prestataires techniques (hébergement, base de données) les traitent pour notre compte.</p>
  <h2 class="h3">Vos droits</h2><p>Conformément à la loi n° 2013-450 relative à la protection des données à caractère personnel, vous pouvez accéder à vos données, les rectifier ou les supprimer en écrivant à ${esc(CONFIG.contactEmail)}. Déclaration ARTCI n° [numéro].</p>`);

export const legalNotice = legal('Mentions légales', `
  <p><b>Éditeur :</b> [raison sociale], [adresse], Abidjan, Côte d'Ivoire. RCCM : [numéro]. Compte contribuable : [numéro].</p>
  <p><b>Directeur de la publication :</b> [nom].</p><p><b>Contact :</b> ${esc(CONFIG.contactEmail)}</p>
  <p><b>Hébergement :</b> GitHub Pages, GitHub Inc., 88 Colin P. Kelly Jr Street, San Francisco, CA 94107, États-Unis.</p>
  <p><b>Cartographie :</b> © les contributeurs d'OpenStreetMap.</p>`);

export const notFound = {
  title: 'Page introuvable',
  render: () => `<div class="wrap pad narrow">${empty('Cette page n\'existe pas.', 'Le lien est peut-être incomplet. Faites une recherche ou revenez à l\'accueil.', '<a class="btn btn-green" href="#/">Accueil</a> <a class="btn btn-line" href="#/explorer">Explorer</a>')}</div>`,
};
