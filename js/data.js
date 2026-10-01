// Référentiel Djéli Pro : domaines d'expertise, villes, données de démonstration.
export const CATEGORIES = [
  { id: 'it', label: 'Informatique et digital', emoji: '💻', color: '#3B5BDB',
    subs: ['Développement web', 'Applications mobiles', 'Logiciels métier et ERP', 'E-commerce', 'Design UX/UI', 'Cybersécurité', 'Cloud et DevOps', 'Data et intelligence artificielle', 'Infogérance et support', 'Réseaux et télécoms', 'Intégration Mobile Money et API'],
    kw: ['informatique','digital','developpement','developpeur','site','web','application','appli','mobile','android','ios','logiciel','erp','ecommerce','boutique en ligne','design','ux','ui','maquette','cybersecurite','securite informatique','pentest','cloud','devops','serveur','data','donnees','ia','intelligence artificielle','chatbot','power bi','infogerance','support','reseau','wifi','api','mobile money','integration','bug','code','wordpress'] },
  { id: 'finance', label: 'Finance et comptabilité', emoji: '📊', color: '#0B6E4F',
    subs: ['Expertise comptable', 'Tenue de comptabilité', 'Recouvrement de créances', 'Audit et commissariat aux comptes', 'Contrôle de gestion', 'Fiscalité', 'Levée de fonds', 'Business plan et analyse financière', 'Paie'],
    kw: ['finance','comptable','comptabilite','expert comptable','bilan','etats financiers','syscohada','recouvrement','creance','creances','impaye','impayes','facture','factures','relance','audit','commissaire aux comptes','controle de gestion','fiscal','fiscalite','impot','impots','dgi','tva','levee de fonds','investisseur','financement','business plan','modele financier','paie','salaires','tresorerie','credit'] },
  { id: 'juridique', label: 'Juridique', emoji: '⚖️', color: '#6741D9',
    subs: ['Création d\'entreprise', 'Droit des affaires', 'Contrats', 'Droit du travail', 'Propriété intellectuelle', 'Contentieux', 'Conformité et données personnelles'],
    kw: ['juridique','avocat','juriste','droit','creation d entreprise','creer une entreprise','sarl','sas','statuts','cepici','rccm','contrat','contrats','travail','licenciement','marque','oapi','brevet','contentieux','litige','proces','conformite','artci','donnees personnelles','notaire'] },
  { id: 'rh', label: 'Ressources humaines', emoji: '🤝', color: '#C2255C',
    subs: ['Recrutement', 'Intérim et mise à disposition', 'Formation', 'Coaching', 'Gestion de la paie', 'Conseil RH'],
    kw: ['rh','ressources humaines','recrutement','recruter','chasse de tete','candidat','commerciaux','interim','personnel','formation','former','coaching','coach','paie','conseil rh','evaluation','team building'] },
  { id: 'marketing', label: 'Marketing et communication', emoji: '📣', color: '#E8590C',
    subs: ['Stratégie marketing', 'Community management', 'Identité visuelle et graphisme', 'Vidéo et photo', 'Publicité digitale', 'Relations presse', 'Événementiel d\'entreprise'],
    kw: ['marketing','communication','com','strategie marketing','community manager','community management','reseaux sociaux','facebook','tiktok','instagram','linkedin','logo','charte graphique','identite visuelle','graphisme','graphiste','video','spot','photo','photographe','publicite','ads','campagne','lancement','relations presse','evenementiel','seminaire','seo','referencement'] },
  { id: 'strategie', label: 'Stratégie et management', emoji: '🧭', color: '#1971C2',
    subs: ['Conseil en stratégie', 'Étude de marché', 'Organisation et process', 'Gestion de projet', 'Qualité et normes ISO', 'Accompagnement de startups'],
    kw: ['strategie','conseil','consultant','management','etude de marche','marche','organisation','process','procedures','gestion de projet','chef de projet','qualite','iso','certification iso','startup','incubation','accompagnement','diagnostic'] },
  { id: 'btp', label: 'BTP et ingénierie', emoji: '🏗️', color: '#5C677D',
    subs: ['Architecture', 'Bureau d\'études', 'Topographie et géomètre', 'Suivi de chantier', 'QHSE'],
    kw: ['btp','construction','architecte','architecture','plan','plans','bureau d etudes','structure','beton','ingenieur','topographie','topographe','geometre','bornage','chantier','maitrise d oeuvre','qhse','securite chantier'] },
  { id: 'foncier', label: 'Foncier et immobilier', emoji: '🏠', color: '#2B8A3E',
    subs: ['Titres fonciers et ACD', 'Vérification foncière', 'Gestion locative', 'Expertise immobilière'],
    kw: ['foncier','terrain','acd','titre foncier','lotissement','verification fonciere','achat de terrain','gestion locative','immobilier','expertise immobiliere','evaluation immobiliere'] },
  { id: 'logistique', label: 'Logistique et import-export', emoji: '🚢', color: '#0C8599',
    subs: ['Transit et dédouanement', 'Transport', 'Supply chain', 'Entreposage'],
    kw: ['logistique','transit','transitaire','dedouanement','douane','conteneur','import','export','port','fret','transport','supply chain','entrepot','stock'] },
  { id: 'services', label: 'Services aux entreprises', emoji: '🏢', color: '#862E9C',
    subs: ['Domiciliation', 'Secrétariat externalisé', 'Nettoyage de bureaux', 'Gardiennage et sécurité', 'Archivage'],
    kw: ['domiciliation','siege social','secretariat','secretaire','assistante','nettoyage','bureaux','gardiennage','vigile','securite','archivage','archives'] },
  { id: 'langues', label: 'Traduction et rédaction', emoji: '🌍', color: '#D9480F',
    subs: ['Traduction', 'Interprétariat', 'Rédaction et correction'],
    kw: ['traduction','traducteur','anglais','english','interprete','interpretariat','redaction','redacteur','correction','relecture','appel d offres'] },
  { id: 'energie', label: 'Énergie et environnement', emoji: '🌱', color: '#5C940D',
    subs: ['Audit énergétique', 'Solaire', 'Études environnementales', 'RSE'],
    kw: ['energie','audit energetique','electricite','solaire','photovoltaique','environnement','etude d impact','environnementale','rse','developpement durable','carbone'] },
  { id: 'agri', label: 'Agriculture et agro-industrie', emoji: '🌾', color: '#E67700',
    subs: ['Conseil agronomique', 'Certification durable', 'Études agricoles', 'Transformation agroalimentaire'],
    kw: ['agriculture','agricole','agronome','agronomique','plantation','cacao','cafe','anacarde','hevea','certification','durable','elevage','agroalimentaire','transformation'] },
];

export const COMMUNES = [
  { id: 'plateau', name: 'Plateau', lat: 5.3230, lng: -4.0180, aliases: ['plateau'] },
  { id: 'cocody', name: 'Cocody', lat: 5.3600, lng: -3.9870, aliases: ['cocody','angre','riviera','2 plateaux','deux plateaux','palmeraie'] },
  { id: 'marcory', name: 'Marcory', lat: 5.3020, lng: -3.9830, aliases: ['marcory','zone 4','biafra'] },
  { id: 'yopougon', name: 'Yopougon', lat: 5.3450, lng: -4.0800, aliases: ['yopougon','yop'] },
  { id: 'treichville', name: 'Treichville', lat: 5.2930, lng: -4.0080, aliases: ['treichville'] },
  { id: 'adjame', name: 'Adjamé', lat: 5.3650, lng: -4.0250, aliases: ['adjame'] },
  { id: 'koumassi', name: 'Koumassi', lat: 5.2980, lng: -3.9480, aliases: ['koumassi'] },
  { id: 'port-bouet', name: 'Port-Bouët', lat: 5.2560, lng: -3.9260, aliases: ['port bouet','vridi'] },
  { id: 'abobo', name: 'Abobo', lat: 5.4180, lng: -4.0200, aliases: ['abobo'] },
  { id: 'bingerville', name: 'Bingerville', lat: 5.3550, lng: -3.8850, aliases: ['bingerville'] },
  { id: 'bouake', name: 'Bouaké', lat: 7.6900, lng: -5.0300, aliases: ['bouake'], city: true },
  { id: 'yamoussoukro', name: 'Yamoussoukro', lat: 6.8200, lng: -5.2760, aliases: ['yamoussoukro','yakro'], city: true },
  { id: 'san-pedro', name: 'San-Pédro', lat: 4.7480, lng: -6.6360, aliases: ['san pedro'], city: true },
  { id: 'daloa', name: 'Daloa', lat: 6.8770, lng: -6.4500, aliases: ['daloa'], city: true },
  { id: 'korhogo', name: 'Korhogo', lat: 9.4580, lng: -5.6290, aliases: ['korhogo'], city: true },
];

export const UNITS = [['forfait', 'Forfait'], ['jour', 'par jour'], ['heure', 'par heure'], ['mois', 'par mois'], ['page', 'par page'], ['pourcent', '% des sommes recouvrées'], ['devis', 'Sur devis']];
export const PAYMENTS = ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Virement bancaire'];

// ---------- Démonstration ----------
// [id, nom, type, domaine, commune, vérifié, disponible, à distance, années, équipe, note, avis, accroche, présentation, langues, certifications, références]
const SHOPS = [
  ['e1','Akwaba Digital','cabinet','it','cocody',1,1,1,8,12,4.8,46,'Agence web et mobile','Nous concevons des sites, applications mobiles et plateformes e-commerce pour les PME et institutions, avec intégration Mobile Money.','FR, EN','Scrum Master certifié; Développeurs certifiés cloud','Une banque de la place; Une chaîne de pharmacies; Un ministère'],
  ['e2','Yao Koné','freelance','it','yopougon',1,1,1,6,1,4.9,31,'Développeur full-stack','Développeur JavaScript, PHP et Flutter. Je reprends aussi les projets existants et corrige les bugs rapidement.','FR, EN','',  'Une startup de livraison; Un cabinet médical'],
  ['e3','CyberSafe CI','cabinet','it','plateau',1,0,1,10,9,4.7,22,'Cybersécurité et audit SI','Tests d\'intrusion, audit de sécurité et sensibilisation des équipes, pour banques, assurances et entreprises.','FR, EN','Auditeurs certifiés en sécurité offensive; ISO 27001 Lead Auditor','Une compagnie d\'assurance; Un opérateur de paiement'],
  ['e4','DataLagune','cabinet','it','marcory',1,1,1,5,7,4.6,18,'Data, BI et intelligence artificielle','Tableaux de bord, analyse de données et assistants intelligents sur WhatsApp pour piloter votre activité.','FR, EN','Certifiés Power BI','Un distributeur de boissons; Une microfinance'],
  ['e5','Mariam Touré','freelance','it','cocody',1,1,1,7,1,4.9,27,'Designer UX/UI','Je dessine des applications simples à utiliser, testées auprès de vrais utilisateurs ivoiriens.','FR, EN','',  'Une fintech; Une plateforme e-learning'],
  ['e6','InfoGérance Pro','cabinet','it','adjame',1,1,0,12,15,4.4,39,'Support informatique et réseaux','Maintenance de parc informatique, réseaux, Wi-Fi et support utilisateurs pour les PME d\'Abidjan.','FR','',  'Une clinique; Un groupe scolaire'],
  ['e7','Cabinet Kouadio & Associés','cabinet','finance','plateau',1,1,1,15,20,4.8,58,'Expertise comptable','Cabinet d\'expertise comptable inscrit à l\'Ordre : tenue, états financiers SYSCOHADA, fiscalité et conseil.','FR, EN','Experts-comptables inscrits à l\'Ordre','Des PME industrielles; Des ONG'],
  ['e8','Recouvra CI','cabinet','finance','plateau',1,1,1,9,14,4.6,41,'Recouvrement de créances','Recouvrement amiable et judiciaire de vos factures impayées, rémunéré au résultat, avec un suivi en ligne.','FR','Partenariat avec des commissaires de justice','Des distributeurs; Des sociétés de services'],
  ['e9','Fatou Diabaté','freelance','finance','cocody',1,1,1,11,1,4.9,19,'Contrôleuse de gestion','Ancienne directrice financière, j\'accompagne les PME à temps partagé : budgets, tableaux de bord, trésorerie.','FR, EN','',  'Un groupe hôtelier; Une agro-industrie'],
  ['e10','Ivoire Fiscal Conseil','cabinet','finance','marcory',1,1,1,13,8,4.5,24,'Conseil fiscal','Déclarations, optimisation et assistance lors des contrôles de la DGI.','FR','Conseils fiscaux agréés','Des commerçants importateurs; Des cliniques'],
  ['e11','Capital Lagune','cabinet','finance','plateau',0,1,1,6,5,4.4,9,'Levée de fonds et finance d\'entreprise','Préparation des dossiers investisseurs et bancaires, modèles financiers, mise en relation.','FR, EN','',  'Des startups agritech; Une PME de transformation'],
  ['e12','Maître Aya N\'Guessan','cabinet','juridique','plateau',1,1,1,14,6,4.9,33,'Avocate d\'affaires','Conseil et contentieux en droit des affaires, contrats et droit du travail.','FR, EN','Avocate inscrite au Barreau','Des groupes de distribution; Des startups'],
  ['e13','Juris Création','cabinet','juridique','cocody',1,1,1,7,4,4.7,52,'Création d\'entreprise et marques','Création de société clé en main au CEPICI, dépôt de marque à l\'OAPI, modifications statutaires.','FR','',  'Plus de 400 entreprises créées'],
  ['e14','TalentCI Recrutement','cabinet','rh','cocody',1,1,0,9,10,4.6,29,'Cabinet de recrutement','Recrutement de cadres et de profils terrain, évaluation, paie externalisée.','FR, EN','',  'Un opérateur télécom; Des PME du BTP'],
  ['e15','Formation Plus Académie','cabinet','rh','treichville',1,1,0,10,18,4.5,36,'Formation professionnelle','Formations inter et intra-entreprise : bureautique, management, vente, sécurité.','FR','Agrément FDFP','Des banques; Des industries'],
  ['e16','Lagune Com','cabinet','marketing','cocody',1,1,1,8,11,4.6,40,'Agence de communication','Stratégie de marque, création graphique, vidéo et publicité digitale.','FR, EN','',  'Une marque de cosmétiques; Une enseigne de mode'],
  ['e17','Ibrahim Sanogo','freelance','marketing','yopougon',0,1,1,4,1,4.7,21,'Community manager','Je gère vos pages Facebook, Instagram et TikTok avec du contenu qui parle aux Ivoiriens.','FR','',  'Des restaurants; Des boutiques'],
  ['e18','Stratégie & Croissance Afrique','cabinet','strategie','plateau',1,1,1,12,9,4.7,17,'Conseil en stratégie','Études de marché, plans stratégiques et accompagnement des startups et PME en croissance.','FR, EN','',  'Des institutions de développement; Des PME'],
  ['e19','Bureau d\'Études Bâtir','cabinet','btp','cocody',1,1,0,16,13,4.6,28,'Architecture et ingénierie','Plans, études de structure, permis de construire et suivi de chantier.','FR','Architectes inscrits à l\'Ordre','Des promoteurs immobiliers; Des écoles'],
  ['e20','Koffi Géomètre Expert','freelance','btp','bingerville',1,1,0,18,3,4.8,44,'Géomètre expert','Levés topographiques, bornage et plans pour vos terrains et projets.','FR','Géomètre expert agréé','Des lotisseurs; Des particuliers'],
  ['e21','Transit Express Port','cabinet','logistique','port-bouet',1,1,0,20,25,4.4,31,'Transit et dédouanement','Dédouanement, transit maritime et aérien, livraison jusqu\'à vos entrepôts.','FR, EN','Commissionnaire en douane agréé','Des importateurs; Des industriels'],
  ['e22','Domicilia Abidjan','cabinet','services','plateau',1,1,0,6,5,4.5,23,'Domiciliation et secrétariat','Adresse au Plateau, réception du courrier, salles de réunion et secrétariat.','FR, EN','',  'Plus de 200 entreprises domiciliées'],
  ['e23','Linguo Pro','cabinet','langues','cocody',1,1,1,9,8,4.8,26,'Traduction et interprétariat','Traduction certifiée français-anglais, interprétariat de conférence, rédaction d\'appels d\'offres.','FR, EN','Traducteurs assermentés','Des ONG internationales; Des ambassades'],
  ['e24','Énergie Verte Conseil','cabinet','energie','yamoussoukro',1,1,1,7,6,4.5,12,'Énergie et environnement','Audits énergétiques, études solaires et études d\'impact environnemental.','FR','',  'Des industriels; Des hôtels'],
  ['e25','AgroConseil Ivoire','cabinet','agri','bouake',1,1,0,11,9,4.6,15,'Conseil agricole','Conseil agronomique, certification durable et études de filières.','FR','',  'Des coopératives; Des exportateurs'],
  ['e26','Foncier Sûr','cabinet','foncier','cocody',1,1,0,8,6,4.7,34,'Sécurisation foncière','Vérification avant achat, obtention d\'ACD et accompagnement des acquéreurs.','FR','',  'Plus de 300 dossiers suivis'],
];

// [expert, spécialité, titre, prix (0 = sur devis), unité, délai, livrables, mots-clés]
const PRODUCTS = [
  ['e1','Développement web','Site vitrine professionnel',450000,'forfait','3 semaines','Site de 5 pages, adapté au mobile, hébergement 1 an','site web vitrine'],
  ['e1','Applications mobiles','Application mobile Android et iOS',3500000,'forfait','3 mois','Application publiée sur les stores, tableau de bord','application mobile android ios'],
  ['e1','E-commerce','Boutique en ligne avec paiement Mobile Money',1200000,'forfait','6 semaines','Boutique, paiement Wave et Orange Money, formation','ecommerce boutique mobile money'],
  ['e1','Développement web','Maintenance et hébergement de site',75000,'mois','Immédiat','Mises à jour, sauvegardes, support','maintenance hebergement'],
  ['e2','Développement web','Développeur full-stack (tarif journalier)',80000,'jour','Disponible','Développement sur mesure','developpeur freelance tjm'],
  ['e2','Intégration Mobile Money et API','Intégration d\'API Mobile Money',350000,'forfait','2 semaines','Paiement Wave, Orange, MTN et Moov intégré à votre site','api mobile money paiement'],
  ['e2','Développement web','Reprise de code et correction de bugs',60000,'jour','48 h','Diagnostic et corrections','bug correction reprise'],
  ['e3','Cybersécurité','Test d\'intrusion (pentest)',1800000,'forfait','3 semaines','Rapport détaillé et plan de correction','pentest intrusion securite'],
  ['e3','Cybersécurité','Audit de sécurité du système d\'information',0,'devis','4 à 6 semaines','Cartographie des risques, recommandations','audit securite si'],
  ['e3','Cybersécurité','Sensibilisation des équipes à la cybersécurité',400000,'forfait','1 jour','Atelier et supports','sensibilisation phishing'],
  ['e4','Data et intelligence artificielle','Tableau de bord Power BI',650000,'forfait','3 semaines','Tableau de bord connecté à vos données','power bi tableau de bord reporting'],
  ['e4','Data et intelligence artificielle','Data scientist (tarif journalier)',150000,'jour','Disponible','Analyse, modèles prédictifs','data scientist'],
  ['e4','Data et intelligence artificielle','Assistant WhatsApp intelligent',900000,'forfait','5 semaines','Assistant qui répond à vos clients 24 h/24','chatbot whatsapp ia'],
  ['e5','Design UX/UI','Maquettes UX/UI d\'application',500000,'forfait','3 semaines','Parcours, maquettes interactives, guide de style','maquette design ux ui figma'],
  ['e5','Design UX/UI','Audit UX de votre application',250000,'forfait','1 semaine','Rapport et recommandations','audit ux'],
  ['e6','Infogérance et support','Infogérance de parc informatique PME',150000,'mois','Immédiat','Maintenance, support, sauvegardes','infogerance maintenance parc'],
  ['e6','Réseaux et télécoms','Installation réseau et Wi-Fi de bureau',300000,'forfait','1 semaine','Câblage, Wi-Fi, sécurisation','reseau wifi installation'],
  ['e7','Tenue de comptabilité','Tenue de comptabilité PME',120000,'mois','Immédiat','Saisie, rapprochements, déclarations','tenue comptabilite pme'],
  ['e7','Expertise comptable','États financiers annuels SYSCOHADA',600000,'forfait','1 mois','Bilan, compte de résultat, liasse fiscale','bilan etats financiers syscohada'],
  ['e7','Audit et commissariat aux comptes','Audit légal des comptes',0,'devis','Selon mission','Rapport d\'audit','audit commissaire aux comptes'],
  ['e8','Recouvrement de créances','Recouvrement amiable de créances',12,'pourcent','Selon dossier','Relances, négociation, encaissement','recouvrement creances impayes amiable'],
  ['e8','Recouvrement de créances','Recouvrement judiciaire',0,'devis','Selon procédure','Injonction de payer, exécution','recouvrement judiciaire injonction'],
  ['e8','Recouvrement de créances','Relance de 20 factures impayées',150000,'forfait','1 mois','Relances écrites et téléphoniques, rapport','relance factures impayees'],
  ['e9','Contrôle de gestion','Contrôleuse de gestion à temps partagé',450000,'mois','Immédiat','Budget, tableaux de bord, suivi de trésorerie','controle de gestion temps partage daf'],
  ['e9','Business plan et analyse financière','Business plan bancable',350000,'forfait','2 semaines','Business plan et prévisions sur 3 ans','business plan banque'],
  ['e10','Fiscalité','Déclarations fiscales mensuelles',75000,'mois','Immédiat','TVA, impôts, retenues','declarations fiscales tva dgi'],
  ['e10','Fiscalité','Assistance lors d\'un contrôle fiscal',0,'devis','Selon contrôle','Réponses, négociation','controle fiscal'],
  ['e11','Levée de fonds','Accompagnement de levée de fonds',0,'devis','3 à 6 mois','Dossier, présentation, mise en relation','levee de fonds investisseurs'],
  ['e11','Business plan et analyse financière','Modèle financier pour investisseurs',500000,'forfait','3 semaines','Modèle sur 5 ans, scénarios','modele financier'],
  ['e12','Contrats','Rédaction de contrat commercial',200000,'forfait','5 jours','Contrat sur mesure et conseils','contrat commercial redaction'],
  ['e12','Droit des affaires','Consultation juridique',50000,'heure','48 h','Avis juridique','consultation avocat'],
  ['e12','Contentieux','Contentieux commercial',0,'devis','Selon procédure','Représentation en justice','contentieux tribunal commerce'],
  ['e13','Création d\'entreprise','Création de SARL clé en main',250000,'forfait','72 h','Statuts, RCCM, immatriculation CEPICI','creation entreprise sarl cepici rccm'],
  ['e13','Propriété intellectuelle','Dépôt de marque à l\'OAPI',300000,'forfait','2 semaines','Recherche d\'antériorité et dépôt','marque oapi depot'],
  ['e14','Recrutement','Recrutement d\'un cadre',0,'devis','4 à 6 semaines','Chasse, sélection, garantie de remplacement','recrutement cadre chasse de tete'],
  ['e14','Recrutement','Recrutement de profils terrain',350000,'forfait','3 semaines','Présélection et entretiens','recrutement commerciaux terrain'],
  ['e14','Gestion de la paie','Paie externalisée',100000,'mois','Immédiat','Bulletins, déclarations CNPS','paie cnps externalisee'],
  ['e15','Formation','Formation Excel avancé (groupe)',250000,'jour','Sur planning','Formation sur site, supports','formation excel'],
  ['e15','Formation','Formation au management',400000,'jour','Sur planning','Formation et évaluation','formation management'],
  ['e15','Coaching','Coaching de dirigeant',75000,'heure','Sur rendez-vous','Séances individuelles','coaching dirigeant'],
  ['e16','Identité visuelle et graphisme','Stratégie de marque et identité visuelle',800000,'forfait','4 semaines','Logo, charte graphique, déclinaisons','logo identite visuelle marque'],
  ['e16','Vidéo et photo','Spot vidéo publicitaire',1200000,'forfait','3 semaines','Spot de 30 secondes, tournage et montage','video spot publicitaire'],
  ['e16','Publicité digitale','Campagne publicitaire Facebook et TikTok',200000,'mois','Immédiat','Création, diffusion, rapport','publicite ads facebook tiktok campagne lancement'],
  ['e17','Community management','Community management (3 réseaux)',150000,'mois','Immédiat','12 publications par mois et animation','community management reseaux sociaux'],
  ['e18','Étude de marché','Étude de marché',1500000,'forfait','6 semaines','Enquête terrain, analyse, recommandations','etude de marche'],
  ['e18','Conseil en stratégie','Plan stratégique à 3 ans',0,'devis','2 mois','Diagnostic, plan, feuille de route','plan strategique'],
  ['e18','Accompagnement de startups','Accompagnement de startup',250000,'mois','Immédiat','Coaching, mise en relation','startup incubation accompagnement'],
  ['e19','Architecture','Plans d\'architecture de villa',800000,'forfait','1 mois','Plans, vues 3D, dossier de permis','plans villa architecte'],
  ['e19','Bureau d\'études','Étude de structure béton',0,'devis','Selon projet','Notes de calcul, plans d\'exécution','etude structure beton'],
  ['e20','Topographie et géomètre','Levé topographique',250000,'forfait','1 semaine','Plan topographique','leve topographique'],
  ['e20','Topographie et géomètre','Bornage de terrain',200000,'forfait','1 semaine','Pose des bornes, procès-verbal','bornage terrain'],
  ['e21','Transit et dédouanement','Dédouanement d\'un conteneur de 20 pieds',350000,'forfait','5 jours','Formalités douanières, enlèvement','dedouanement conteneur transit'],
  ['e22','Domiciliation','Domiciliation d\'entreprise au Plateau',40000,'mois','24 h','Adresse, courrier, attestation','domiciliation siege plateau'],
  ['e22','Secrétariat externalisé','Secrétariat externalisé',120000,'mois','Immédiat','Accueil téléphonique, agenda','secretariat'],
  ['e23','Traduction','Traduction français-anglais',8000,'page','48 h','Traduction relue','traduction anglais'],
  ['e23','Interprétariat','Interprétariat de conférence',250000,'jour','Sur planning','Interprète professionnel','interprete conference'],
  ['e24','Audit énergétique','Audit énergétique de bâtiment',700000,'forfait','3 semaines','Rapport et plan d\'économies','audit energetique'],
  ['e24','Études environnementales','Étude d\'impact environnemental',0,'devis','Selon projet','Rapport conforme à l\'ANDE','etude impact environnemental'],
  ['e25','Conseil agronomique','Plan de culture et conseil agronomique',300000,'forfait','2 semaines','Diagnostic et plan de culture','agronome conseil plantation'],
  ['e25','Certification durable','Accompagnement certification cacao durable',0,'devis','Selon coopérative','Préparation à l\'audit','certification cacao'],
  ['e26','Vérification foncière','Vérification foncière avant achat',150000,'forfait','1 semaine','Rapport de vérification','verification fonciere terrain achat'],
  ['e26','Titres fonciers et ACD','Obtention d\'ACD',0,'devis','Selon dossier','Montage et suivi du dossier','acd titre foncier'],
];

const NAMES = ['DG d\'une PME de distribution','Directrice d\'une clinique','Fondateur d\'une startup','Responsable RH d\'un groupe','Gérant d\'un hôtel','Directeur financier d\'une industrie','Présidente d\'une ONG','Gérant d\'un cabinet médical'];
const TEXTS = [[5,'Travail sérieux et livré dans les délais. Je recommande sans hésiter.'],[5,'Très professionnel, bonne compréhension de notre besoin.'],[4,'Bon résultat, quelques ajustements nécessaires mais bonne réactivité.'],[5,'Rapport qualité-prix excellent, communication claire.'],[4,'Compétent et disponible.'],[5,'Résultats concrets dès le premier mois.']];

// [id, client, titre, domaine, spécialité, budget min, budget max, délai (jours), commune, à distance, description, jours depuis publication]
const PROJECTS = [
  ['pr1','Restaurant à Cocody','Application de commande et livraison pour notre restaurant','it','Applications mobiles',2000000,4000000,90,'cocody',1,'Nous voulons une application où nos clients commandent et paient par Wave ou Orange Money, avec suivi du livreur.',2],
  ['pr2','Distributeur de matériel','Recouvrement de 35 factures impayées (18 millions FCFA)','finance','Recouvrement de créances',0,0,60,'plateau',1,'Factures de 6 à 18 mois auprès de clients professionnels. Rémunération au résultat souhaitée.',1],
  ['pr3','PME de 15 salariés','Tenue de la comptabilité et déclarations fiscales','finance','Tenue de comptabilité',100000,200000,365,'marcory',1,'Recherche d\'un cabinet pour la tenue mensuelle, la paie et les déclarations.',4],
  ['pr4','Clinique privée','Refonte du site web et prise de rendez-vous en ligne','it','Développement web',800000,1500000,45,'cocody',1,'Site moderne avec prise de rendez-vous et rappels par SMS.',3],
  ['pr5','Société de distribution','Recrutement de 3 commerciaux terrain','rh','Recrutement',300000,600000,30,'yopougon',0,'Commerciaux expérimentés en FMCG, basés à Abidjan.',5],
  ['pr6','Startup agroalimentaire','Business plan pour un prêt bancaire de 50 millions','finance','Business plan et analyse financière',300000,700000,21,'cocody',1,'Business plan et prévisionnel pour une unité de transformation de manioc.',6],
  ['pr7','Marque de cosmétiques','Campagne de lancement d\'une nouvelle gamme','marketing','Publicité digitale',1000000,2500000,30,'marcory',1,'Lancement sur TikTok, Instagram et en affichage, avec influenceurs.',2],
  ['pr8','Compagnie d\'assurance','Audit de sécurité de notre réseau et de nos applications','it','Cybersécurité',0,0,60,'plateau',0,'Audit complet avant notre migration vers le cloud.',7],
];
// [projet, expert, montant total, délai, message, jours]
const PROPOSALS = [
  ['pr1','e1',3200000,'12 semaines','Application Android et iOS avec paiement Mobile Money et suivi du livreur en temps réel. Nous avons livré un projet similaire l\'an dernier.',1],
  ['pr1','e2',2400000,'14 semaines','Je développe en Flutter (une seule base pour Android et iOS) et j\'intègre les paiements Wave et Orange Money.',1],
  ['pr2','e8',0,'2 mois','Recouvrement au résultat : 12 % des sommes recouvrées, sans frais si nous ne récupérons rien. Premier rapport sous 15 jours.',0],
  ['pr3','e7',140000,'Dès le mois prochain','Tenue, paie et déclarations pour 140 000 FCFA par mois, avec un rendez-vous trimestriel.',2],
  ['pr4','e1',1200000,'6 semaines','Site avec prise de rendez-vous, rappels SMS et tableau de bord pour le secrétariat.',2],
  ['pr4','e5',650000,'4 semaines','Je propose la conception des parcours et des maquettes, en partenariat avec un développeur.',1],
  ['pr6','e9',450000,'2 semaines','Business plan bancable et prévisionnel sur 5 ans, avec accompagnement au rendez-vous bancaire.',3],
  ['pr6','e11',600000,'3 semaines','Dossier complet et mise en relation avec deux banques partenaires.',2],
];

const cOf = id => COMMUNES.find(c => c.id === id);
const days = n => new Date(Date.now() - n * 864e5).toISOString();
export const DEMO_SHOPS = SHOPS.map((r, i) => {
  const c = cOf(r[4]);
  return { id: r[0], name: r[1], kind: r[2], cat: r[3], commune: r[4], verified: !!r[5], available: !!r[6], remote: !!r[7], years: r[8], team: r[9],
    baseRating: r[10], baseReviews: r[11], headline: r[12], desc: r[13], languages: r[14], certifications: r[15] ? r[15].split('; ') : [], clients: r[16] ? r[16].split('; ') : [],
    whatsapp: '', phone: '', demo: true, owner: null, plan: r[5] ? 'pro' : 'free', open: 8, close: 18,
    lat: c.lat + ((((i * 53) % 13) - 6) * 0.0022), lng: c.lng + ((((i * 37) % 11) - 5) * 0.0024), createdAt: '2026-06-01' };
});
export const DEMO_PRODUCTS = PRODUCTS.map((r, i) => {
  const shop = DEMO_SHOPS.find(s => s.id === r[0]);
  return { id: 'sv' + (i + 1), shopId: r[0], cat: shop.cat, sub: r[1], title: r[2], price: r[3], unit: r[4], delay: r[5], deliverables: r[6], tags: r[7],
    condition: '', desc: '', photos: [], demo: true, createdAt: days(i % 30) };
});
export const DEMO_REVIEWS = DEMO_SHOPS.flatMap((s, i) => [0, 1, 2].map(k => {
  const t = TEXTS[(i + k * 2) % TEXTS.length];
  return { id: `r${i}-${k}`, shopId: s.id, author: NAMES[(i * 3 + k) % NAMES.length], rating: t[0], text: t[1], createdAt: days(5 + k * 9 + (i % 7)), demo: true };
}));
export const DEMO_PROJECTS = PROJECTS.map(r => ({ id: r[0], clientLabel: r[1], title: r[2], cat: r[3], sub: r[4], budgetMin: r[5], budgetMax: r[6], durationDays: r[7],
  commune: r[8], remote: !!r[9], desc: r[10], createdAt: days(r[11]), status: 'open', owner: null, demo: true }));
export const DEMO_PROPOSALS = PROPOSALS.map((r, i) => ({ id: 'pp' + (i + 1), projectId: r[0], shopId: r[1], amount: r[2], delay: r[3], message: r[4], createdAt: days(r[5]), status: 'sent', demo: true }));
