// ⚙️ Réglages de Djéli Pro. Modifiez ces valeurs avant la mise en ligne.
export const CONFIG = {
  appName: 'Djéli Pro',
  contactEmail: 'contact@djelipro.ci',
  contactWhatsApp: '', // ex. '2250700000000'

  // Base de données Supabase (un projet SÉPARÉ de celui de Djéli). Laissez vide pour le mode démonstration.
  supabaseUrl: '',   // ex. 'https://abcdefgh.supabase.co'
  supabaseKey: '',   // la clé « Publishable » : commence par 'sb_publishable_'

  // ---- Paiement sécurisé des missions sur les comptes de Djéli Pro ----
  payAccounts: {
    waveLink: '',  // lien Wave Business ; mettez {montant} à l'endroit du montant
    wave: '', orange: '', mtn: '', moov: '',  // numéros (10 chiffres)
    holder: 'Djéli Pro',
  },
  // Virement bancaire, conseillé pour les gros montants (au-delà des plafonds Mobile Money).
  bank: { name: '', holder: '', rib: '' }, // ex. name: 'Banque X', rib: 'CI000 01000 0000000000 00'
  paymentCheckDelay: '4 heures ouvrables',
  adminEmails: [],
  commissionPercent: 8, // doit correspondre à commission_percent dans la table settings

  showDemoData: true,
};
