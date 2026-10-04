/* ══════════════════════════════════════════════════════
   SAVEMANAGER.JS : sauvegarde v2 du mode aventure

   {
     version: 2,
     universe: 'ville' | 'hero' | 'club' | null,
     visitedLocations: [], collectedSkills: [], viewedProjects: [],
     missionComplete: false,
     playerPosition: { x, y } | null,
     settings: { sound: false, reducedMotion: false }
   }

   Même clé localStorage que la v1 (`drame.aventure.save`) : une ancienne
   partie { v: 1, visited, tokens, complete, tuto, x } est migrée à la
   lecture, sans perte de progression. La position v1 n'est pas reprise
   (les niveaux ont changé) : on repart du point de départ de l'univers.
   ══════════════════════════════════════════════════════ */

export const SAVE_KEY = 'drame.aventure.save';
export const SESSION_KEY = 'drame.aventure.session';
export const SOUND_KEY = 'drame.portfolio.sound';   // préférence lue par js/audio.js (construire-projet)

export const LOCATION_IDS = ['profile', 'parcours', 'contact', 'projets'];
const UNIVERSES = ['ville', 'hero', 'club'];

const strings = (v) => (Array.isArray(v) ? [...new Set(v.filter(x => typeof x === 'string'))] : []);

export function blank() {
  return {
    version: 2,
    universe: null,
    visitedLocations: [],
    collectedSkills: [],
    viewedProjects: [],
    missionComplete: false,
    playerPosition: null,
    settings: { sound: false, reducedMotion: false },
  };
}

// Donnée brute (v1, v2, illisible) → sauvegarde v2 valide.
export function migrate(raw) {
  const s = blank();
  if (!raw || typeof raw !== 'object') return s;

  if (raw.v === 1) {
    s.visitedLocations = strings(raw.visited).filter(id => LOCATION_IDS.includes(id));
    s.collectedSkills = strings(raw.tokens);
    s.missionComplete = !!raw.complete;
    s.universe = 'ville';        // la v1 ne connaissait que la ville
    return s;
  }
  if (raw.version !== 2) return s;

  s.universe = UNIVERSES.includes(raw.universe) ? raw.universe : null;
  s.visitedLocations = strings(raw.visitedLocations).filter(id => LOCATION_IDS.includes(id));
  s.collectedSkills = strings(raw.collectedSkills);
  s.viewedProjects = strings(raw.viewedProjects);
  s.missionComplete = !!raw.missionComplete;
  const p = raw.playerPosition;
  if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) s.playerPosition = { x: p.x, y: p.y };
  if (raw.settings && typeof raw.settings === 'object') {
    s.settings.sound = !!raw.settings.sound;
    s.settings.reducedMotion = !!raw.settings.reducedMotion;
  }
  return s;
}

export class SaveManager {
  // storage / session : injectables (tests), localStorage / sessionStorage par défaut.
  constructor(storage, session) {
    this._storage = storage || safe(() => window.localStorage);
    this._session = session || safe(() => window.sessionStorage);
    this.data = this._read();
  }

  _read() {
    let raw = null;
    try { raw = JSON.parse(this._storage.getItem(SAVE_KEY)); } catch (e) { /* stockage indisponible ou donnée illisible */ }
    const migrated = !!raw && raw.v === 1;
    const data = migrate(raw);
    if (migrated) { this.data = data; this.write(); }
    return data;
  }

  write() {
    try { this._storage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* noop */ }
  }

  get hasProgress() {
    const d = this.data;
    return d.visitedLocations.length > 0 || d.collectedSkills.length > 0 || d.viewedProjects.length > 0;
  }

  _add(list, id) {
    if (list.includes(id)) return false;
    list.push(id);
    this.write();
    return true;
  }
  visit(id) { return this._add(this.data.visitedLocations, id); }
  collect(id) { return this._add(this.data.collectedSkills, id); }
  viewProject(slug) { return this._add(this.data.viewedProjects, slug); }
  hasVisited(id) { return this.data.visitedLocations.includes(id); }
  hasSkill(id) { return this.data.collectedSkills.includes(id); }

  setUniverse(id) {
    if (this.data.universe === id) return;
    this.data.universe = id;
    this.data.playerPosition = null;     // chaque univers a son propre niveau
    this.write();
  }

  setPosition(x, y) {
    this.data.playerPosition = { x: Math.round(x), y: Math.round(y) };
    this.write();
  }

  setSetting(name, value) {
    this.data.settings[name] = !!value;
    this.write();
    if (name === 'sound') this.syncSound();
  }

  // Reporte le choix de son sur la préférence du site (lue par construire-projet).
  syncSound() {
    try { this._storage.setItem(SOUND_KEY, this.data.settings.sound ? 'on' : 'off'); } catch (e) { /* noop */ }
  }

  completeMission() {
    if (this.data.missionComplete) return false;
    this.data.missionComplete = true;
    this.write();
    return true;
  }

  // Nouvelle partie : la progression repart de zéro, l'univers et les réglages restent.
  reset() {
    const { universe, settings } = this.data;
    this.data = blank();
    this.data.universe = universe;
    this.data.settings = settings;
    this.write();
  }

  // Briefing : une fois par session de navigation.
  get sessionStarted() {
    try { return this._session.getItem(SESSION_KEY) === '1'; } catch (e) { return false; }
  }
  markSession() {
    try { this._session.setItem(SESSION_KEY, '1'); } catch (e) { /* noop */ }
  }
}

function safe(fn) {
  try { return fn(); } catch (e) { return null; }
}
