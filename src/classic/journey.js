/* ══════════════════════════════════════════════════════
   JOURNEY.JS — Récit du profil + frise du parcours (mode classique)

   Profil   : le sommaire des chapitres suit la lecture.
   Parcours : la ligne se remplit, l'étape lue passe au premier plan,
              la grande année (colonne collante) change avec elle ;
              « Aujourd'hui » est placé sur la vue d'ensemble.
   ══════════════════════════════════════════════════════ */
import { watch, currentIndex } from './scroll.js';

const doc = document;

export function initStory() {
  const sec = doc.getElementById('profil');
  const rail = sec && sec.querySelector('.story__rail ol');
  if (!rail) return;
  const links = [...rail.querySelectorAll('a')];
  const chapters = links.map((a) => doc.getElementById(a.getAttribute('href').slice(1)));
  watch(sec, () => {
    const line = innerHeight * 0.45;
    const i = currentIndex(chapters, line);
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')));
    const first = chapters[0].getBoundingClientRect();
    const last = chapters[chapters.length - 1].getBoundingClientRect();
    const p = (line - first.top) / Math.max(1, last.bottom - first.top);
    rail.style.setProperty('--sp', Math.min(1, Math.max(0, p)).toFixed(3));
  });
}

export function initTimeline() {
  const sec = doc.getElementById('parcours');
  const tlx = sec && sec.querySelector('.tlx');
  if (!tlx) return;
  const list = tlx.querySelector('.tlx__list');
  const events = [...list.querySelectorAll(':scope > .ev')];
  const year = tlx.querySelector('.tlx__year-v');
  const spans = [...sec.querySelectorAll('.span')];
  tlx.classList.add('is-live');

  let cur = -1;
  watch(sec, () => {
    const line = innerHeight * 0.45;
    const r = list.getBoundingClientRect();
    list.style.setProperty('--p', Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height - 40))).toFixed(3));
    const i = currentIndex(events, line);
    if (i === cur) return;
    cur = i;
    events.forEach((ev, k) => {
      ev.classList.toggle('is-current', k === i);
      ev.classList.toggle('is-past', k < i);
    });
    const y = events[i].dataset.year;
    if (year && y && year.textContent !== y) {
      year.textContent = y;
      year.classList.remove('is-swap'); void year.offsetWidth; year.classList.add('is-swap');
    }
    const id = events[i].id;
    spans.forEach((s) => s.classList.toggle('is-current', !!id && s.getAttribute('href') === `#${id}`));
  });

  // « Aujourd'hui » sur la vue d'ensemble : date réelle du visiteur.
  const chart = sec.querySelector('.spans');
  const now = chart && chart.querySelector('.spans__now');
  const from = chart && +chart.dataset.from, to = chart && +chart.dataset.to;
  if (!now || !from || !to) return;
  function placeNow() {
    const d = new Date();
    const t = d.getFullYear() + d.getMonth() / 12 + (d.getDate() - 1) / 365;
    const lanes = chart.querySelectorAll('.spans__lane .spans__track');
    if (t < from || t > to || !lanes.length) { now.classList.remove('is-on'); return; }
    const c = chart.getBoundingClientRect();
    const a = lanes[0].getBoundingClientRect(), b = lanes[lanes.length - 1].getBoundingClientRect();
    now.style.left = `${a.left - c.left + ((t - from) / (to - from)) * a.width}px`;
    now.style.top = `${a.top - c.top - 4}px`;
    now.style.height = `${b.bottom - a.top + 8}px`;
    now.classList.add('is-on');
  }
  placeNow();
  new ResizeObserver(placeNow).observe(chart);
}
