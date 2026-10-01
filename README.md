# Djéli Pro

La plateforme des services professionnels en Côte d'Ivoire : les entreprises trouvent des experts vérifiés (informatique, finance et recouvrement, juridique, RH, marketing, ingénierie…), publient leurs besoins, comparent les propositions et paient la mission en toute sécurité.

Djéli Pro est un site statique (HTML, CSS, JavaScript) : aucun serveur à gérer. Il fonctionne tout de suite en **mode démonstration** (26 experts, 62 prestations, 8 besoins fictifs, données enregistrées dans le navigateur), puis en **mode réel** dès que vous branchez une base Supabase.

## 1. Ce que fait le site

- **13 domaines, 75 spécialités** : informatique et digital, finance et comptabilité (dont recouvrement de créances), juridique, ressources humaines, marketing et communication, stratégie et management, BTP et ingénierie, foncier et immobilier, logistique et import-export, services aux entreprises, traduction et rédaction, énergie et environnement, agriculture et agro-industrie.
- **Recherche en langage naturel** : « expert-comptable au Plateau », « développeur freelance à distance », « recouvrement de factures impayées ».
- **Profils d'experts** : cabinet ou indépendant, années d'expérience, équipe, langues, agréments, références, avis, disponibilité, missions à distance.
- **Prestations** au forfait, à la journée, à l'heure, au mois, à la page, au pourcentage recouvré, ou sur devis.
- **Besoins et propositions** : l'entreprise publie un besoin (ou demande un devis privé à un expert), les experts envoient une proposition chiffrée, l'entreprise compare et choisit.
- **Paiement sécurisé (séquestre)** : le client paie Djéli Pro (virement bancaire, Wave, Orange Money, MTN, Moov), l'expert réalise, le client valide, Djéli Pro reverse l'expert moins la commission.
- **Espace expert** : opportunités du domaine, propositions envoyées, missions et paiements, prestations, profil, offre.
- **Administration** : paiements à vérifier, experts à payer, litiges, missions non validées.

## 2. Mettre le site en ligne (GitHub Pages)

1. Créez un **nouveau dépôt** GitHub, par exemple `DjeliPro` (gardez Djéli dans son propre dépôt).
2. Envoyez **le contenu** du dossier `djelipro` (pas le dossier lui-même) : `index.html` doit être à la racine du dépôt.
3. Dans le dépôt : **Settings → Pages → Branch : main, dossier / (root) → Save**.
4. Après une à deux minutes, le site est en ligne à `https://VOTRE-NOM.github.io/DjeliPro/` (attention aux majuscules).

À ce stade, le site tourne en mode démonstration.

## 3. Brancher la base de données (Supabase)

Utilisez un **projet Supabase séparé** de celui de Djéli (le plan gratuit permet deux projets).

1. Sur supabase.com : **New project**, nommez-le `djelipro`, région Europe (la plus proche d'Abidjan).
2. **SQL Editor → New query** : collez tout le fichier `supabase/schema.sql`. **Avant d'exécuter**, remplacez tout en bas `VOTRE-EMAIL@exemple.com` par votre e-mail (vous serez administrateur). Cliquez sur **Run** : le message « Installation de Djéli Pro terminée » s'affiche. Le script peut être relancé sans risque.
3. **Authentication → Sign In / Providers → Email** : désactivez **Confirm email** (sinon les inscriptions sont bloquées par la limite d'e-mails du plan gratuit).
4. **Authentication → URL Configuration** : mettez l'adresse de votre site en **Site URL**.
5. **Project Settings → API Keys** : copiez l'URL du projet et la clé **Publishable** (commence par `sb_publishable_`). N'utilisez jamais la clé secrète dans le site.

## 4. Régler `js/config.js`

| Réglage | À mettre |
|---|---|
| `supabaseUrl`, `supabaseKey` | L'URL et la clé Publishable de l'étape 3 |
| `payAccounts` | Votre lien Wave Business (avec `{montant}`) et vos numéros Wave, Orange, MTN, Moov |
| `bank` | Nom de la banque, titulaire et RIB du compte de Djéli Pro (conseillé pour les gros montants) |
| `adminEmails` | Le même e-mail que dans `schema.sql` |
| `commissionPercent` | Votre commission (8 par défaut) ; elle doit être égale à `commission_percent` dans la table `settings` |
| `contactWhatsApp` | Votre numéro WhatsApp au format `2250700000000` |
| `showDemoData` | `false` au lancement réel, pour masquer les experts fictifs |

Envoyez le fichier modifié sur GitHub. Videz le cache du navigateur (ou ouvrez une fenêtre privée) pour voir la nouvelle version.

## 5. Le paiement sécurisé au quotidien

1. Le client choisit un expert : une mission « À payer » est créée avec une référence `DP-XXXXXX`.
2. Le client paie sur vos comptes et déclare son paiement (moyen, numéro ou compte, référence).
3. Vous ouvrez **Administration → Paiements à vérifier**, vérifiez dans votre banque ou votre application Mobile Money, puis touchez **Reçu ✓**. L'expert peut démarrer.
4. L'expert déclare la livraison ; le client valide (ou signale un problème : l'argent reste bloqué).
5. **Experts à payer** : envoyez le montant indiqué (déjà diminué de la commission) au numéro ou au RIB affiché, puis touchez **Versé ✓** avec la référence du transfert.

L'onglet **Livrées non validées (+7 j)** liste les clients qui tardent : contactez-les, puis validez à leur place s'ils sont satisfaits.

## 6. Avant le lancement commercial

- **Juridique** : complétez les CGU (raison sociale, RCCM, taux de commission, clause de non-contournement), les mentions légales et la politique de confidentialité, et faites-les relire par un juriste. Déclarez le traitement de données à l'ARTCI.
- **Encaissement pour le compte de tiers** : garder l'argent des clients pour le reverser aux experts peut relever de la réglementation BCEAO sur les services de paiement. Faites valider le montage par un avocat ou votre banque ; un compte bancaire dédié aux fonds des clients est fortement conseillé.
- **Vérification des experts** : contrôlez RCCM, agréments (Ordre des experts-comptables, Barreau, Ordre des architectes…) et diplômes avant d'attribuer le badge « Vérifié » (colonne `verified` de la table `shops`).

## 7. Limites connues

- Pas d'acompte ni de paiement par étapes : la mission est payée en une fois.
- La vérification des paiements est manuelle (pas d'agrégateur de paiement).
- Une mission payée sur la plateforme n'est créée que si le montant proposé est d'au moins 1 000 FCFA et si l'expert a activé ses reversements. Sinon, l'expert est choisi et le client le contacte directement (cas des honoraires au résultat en recouvrement, par exemple).
- Pas de messagerie interne : les échanges passent par WhatsApp.
- En mode démonstration, tout est enregistré dans le navigateur de l'appareil.

## 8. Dépannage

- **Page blanche ou contenu qui ne charge pas** : vérifiez que l'adresse est exacte (majuscules), que `index.html` est à la racine, puis utilisez le bouton « Réparer et recharger » affiché par le site.
- **« La base n'est pas à jour »** : relancez `supabase/schema.sql` dans le SQL Editor.
- **Inscription impossible** : vérifiez que « Confirm email » est désactivé.
- **Accès à l'administration refusé** : l'e-mail doit être à la fois dans `adminEmails` et dans la table `admins`.
