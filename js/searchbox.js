// Barre de recherche intelligente : placeholder vivant, voix, compréhension affichée.
import { $, esc } from './ui.js';

const EXAMPLES = ['Un développeur pour une application mobile', 'Recouvrement de factures impayées', 'Un expert-comptable au Plateau', 'Création de SARL',
  'Un avocat pour un contrat commercial', 'Community manager à distance', 'Recruter des commerciaux', 'Un géomètre pour un bornage'];

export function searchBox(value = '', { big = false, id = 'q' } = {}) {
  return `<form class="search ${big ? 'big' : ''}" data-search role="search" autocomplete="off">
    <label class="sr" for="${id}">Que cherchez-vous ?</label>
    <svg class="search-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
    <input id="${id}" name="q" type="search" value="${esc(value)}" placeholder="${EXAMPLES[0]}" enterkeyhint="search">
    <button type="button" class="mic" data-mic aria-label="Chercher à la voix" hidden>
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <button type="submit" class="btn btn-green search-go">Chercher</button>
  </form>`;
}

let phTimer;
export function mountSearch(root, onSubmit) {
  root.querySelectorAll('form[data-search]').forEach(form => {
    const input = form.querySelector('input');
    form.addEventListener('submit', e => { e.preventDefault(); input.blur(); onSubmit(input.value.trim()); });
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = form.querySelector('[data-mic]');
    if (SR && mic) {
      mic.hidden = false; let rec, on = false;
      mic.addEventListener('click', () => {
        if (on) { rec.stop(); return; }
        rec = new SR(); rec.lang = 'fr-FR'; rec.interimResults = true;
        rec.onstart = () => { on = true; mic.classList.add('listening'); input.placeholder = 'Je vous écoute…'; };
        rec.onresult = e => { const t = [...e.results].map(r => r[0].transcript).join(' '); input.value = t; if (e.results[e.results.length - 1].isFinal) onSubmit(t); };
        rec.onend = () => { on = false; mic.classList.remove('listening'); };
        rec.start();
      });
    }
  });
  clearInterval(phTimer); let i = 0;
  phTimer = setInterval(() => {
    document.querySelectorAll('form[data-search] input').forEach(inp => {
      if (document.activeElement !== inp && !inp.value) inp.placeholder = EXAMPLES[(i + 1) % EXAMPLES.length];
    }); i++;
  }, 3200);
}
