/* Physique indépendante du taux de rafraîchissement + collisions + sauvegarde.
   node tests/physics.test.mjs */
import assert from 'node:assert/strict';
import { advance, MAX_STEP } from '../src/aventure/core/GameLoop.js';
import { CollisionWorld } from '../src/aventure/core/Collision.js';
import { Character } from '../src/aventure/player/Character.js';
import { CharacterController } from '../src/aventure/player/CharacterController.js';
import { migrate, SaveManager, SAVE_KEY } from '../src/aventure/core/SaveManager.js';

const RATES = [30, 60, 90, 120, 144, 165];
const world = () => new CollisionWorld({
  solids: [{ x: -100, y: 0, w: 5000, h: 400 }, { x: 600, y: -60, w: 80, h: 60 }, { x: 900, y: -200, w: 200, h: 30 }],
  platforms: [{ x: 300, y: -90, w: 120, oneWay: true }],
  minX: 0, maxX: 4000,
});

// Scénario : court vers la droite pendant `run` s, saute à t = 0.5 s (touche maintenue).
function simulate(hz, seconds, script) {
  const c = new Character(100, 0);
  const ctl = new CharacterController(c, world(), {});
  const intent = { axis: 0, jumpPressed: false, jumpHeld: false, down: false };
  let t = 0, apex = 0;
  const frame = 1 / hz;
  for (let f = 0; f < Math.round(seconds * hz); f++) {
    let first = true;
    script(t, intent, c);
    advance((dt) => {
      if (!first) intent.jumpPressed = false;      // un front montant ne vaut que pour un pas
      first = false;
      ctl.update(dt, intent);
      apex = Math.min(apex, c.y);
    }, frame, MAX_STEP);
    intent.jumpPressed = false;
    t += frame;
  }
  return { x: c.x, y: c.y, apex, c };
}

// 1. Hauteur de saut et distance identiques à tous les taux (±2 %).
{
  let jumped;
  const run = (hz) => {
    jumped = false;
    return simulate(hz, 1.6, (t, i) => {
      i.axis = 1; i.jumpHeld = true;
      if (t >= 0.5 && !jumped) { i.jumpPressed = true; jumped = true; }
    });
  };
  const ref = run(60);
  for (const hz of RATES) {
    const r = run(hz);
    const dApex = Math.abs(r.apex - ref.apex) / Math.abs(ref.apex);
    const dX = Math.abs(r.x - ref.x) / ref.x;
    console.log(`${String(hz).padStart(3)} Hz  apex ${r.apex.toFixed(1)}  x ${r.x.toFixed(1)}  (écarts ${(dApex * 100).toFixed(2)} % / ${(dX * 100).toFixed(2)} %)`);
    assert.ok(dApex < 0.02, `hauteur de saut à ${hz} Hz`);
    assert.ok(dX < 0.02, `distance à ${hz} Hz`);
  }
  assert.ok(ref.apex < -100 && ref.apex > -125, 'hauteur de saut attendue ~113 u');
}

// 2. Mur : le personnage bute contre la caisse (x = 600) sans la traverser.
{
  const r = simulate(60, 4, (t, i) => { i.axis = 1; });
  assert.equal(r.x, 600 - 11, 'arrêté contre le mur');
  assert.equal(r.y, 0);
}

// 3. Plateforme traversable : on passe dessous, on s'y pose en sautant, on en descend avec ↓.
{
  let step = 0;
  const r = simulate(120, 3, (t, i, c) => {
    i.axis = c.x < 350 ? 1 : 0; i.jumpHeld = true; i.down = false;
    if (step === 0 && c.x >= 350 && c.grounded && Math.abs(c.vx) < 1) { i.jumpPressed = true; step = 1; }
  });
  assert.equal(r.y, -90, 'posé sur la plateforme');
  assert.ok(r.c.surface && r.c.surface.oneWay);
  const ctl = new CharacterController(r.c, world(), {});
  const intent = { axis: 0, jumpPressed: true, jumpHeld: false, down: true };
  for (let f = 0; f < 120; f++) { ctl.update(1 / 120, intent); intent.jumpPressed = false; }
  assert.equal(r.c.y, 0, 'redescendu au sol');
}

// 4. Plafond : un saut sous la dalle (y = -200..-170) est stoppé, pas de traversée.
{
  let jumped = false;
  const r = simulate(60, 3.2, (t, i, c) => {
    i.jumpHeld = true;
    // part de x=100, contourne la caisse impossible : on téléporte sous la dalle.
    if (t === 0) c.place(1000, 0);
    if (t > 0.2 && !jumped) { i.jumpPressed = true; jumped = true; }
  });
  assert.ok(r.apex >= -170 + 56 - 0.5, `plafond respecté (apex ${r.apex})`);
  assert.equal(r.y, 0);
}

// 5. Limites du monde.
{
  const r = simulate(60, 2, (t, i) => { i.axis = -1; });
  assert.equal(r.x, 11);
}

// 6. Gros delta (onglet suspendu) : découpé en pas ≤ 1/60 s.
{
  let n = 0, max = 0;
  advance((dt) => { n++; max = Math.max(max, dt); }, 0.1);
  assert.equal(n, 6);
  assert.ok(max <= MAX_STEP + 1e-9);
}

// 7. Sauvegarde : migration v1 → v2, données invalides, persistance.
{
  const v2 = migrate({ v: 1, visited: ['profile', 'projets', 'inconnu'], tokens: ['react', 'docker'], complete: true, tuto: true, x: 840 });
  assert.deepEqual(v2, {
    version: 2, universe: 'ville', visitedLocations: ['profile', 'projets'], collectedSkills: ['react', 'docker'],
    viewedProjects: [], missionComplete: true, playerPosition: null, settings: { sound: true, volume: 0.8, reducedMotion: false },
  });
  assert.equal(migrate(null).version, 2);
  assert.equal(migrate('nimporte').universe, null);
  assert.equal(migrate({ version: 2, universe: 'pirate' }).universe, null);

  const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
  const store = mem();
  store.setItem(SAVE_KEY, JSON.stringify({ v: 1, visited: ['contact'], tokens: [], complete: false, tuto: false, x: null }));
  const save = new SaveManager(store, mem());
  assert.deepEqual(save.data.visitedLocations, ['contact']);
  assert.equal(JSON.parse(store.getItem(SAVE_KEY)).version, 2, 'v1 réécrite en v2');
  save.setUniverse('hero'); save.collect('react'); save.collect('react'); save.setPosition(512.4, -430);
  save.setSetting('sound', true);
  save.setVolume(0.35);
  const again = new SaveManager(store, mem());
  assert.equal(again.data.universe, 'hero');
  assert.deepEqual(again.data.collectedSkills, ['react']);
  assert.deepEqual(again.data.playerPosition, { x: 512, y: -430 });
  assert.equal(store.getItem('drame.portfolio.sound'), 'on');
  assert.equal(again.data.settings.volume, 0.35);
  assert.equal(store.getItem('drame.portfolio.volume'), '0.35');
  // Sauvegarde d'avant la jauge : le son coupé n'était qu'un défaut, il repasse à activé.
  assert.deepEqual(migrate({ version: 2, settings: { sound: false } }).settings, { sound: true, volume: 0.8, reducedMotion: false });
  assert.equal(migrate({ version: 2, settings: { sound: false, volume: 0.5 } }).settings.sound, false, 'coupé par choix : respecté');
  assert.equal(migrate({ version: 2, settings: { volume: 7 } }).settings.volume, 1);
  again.setUniverse('club');
  assert.equal(again.data.playerPosition, null, 'position remise à zéro au changement d\'univers');
  assert.deepEqual(again.data.visitedLocations, ['contact'], 'progression conservée');
  again.reset();
  assert.equal(again.data.universe, 'club');
  assert.equal(again.data.settings.sound, true);
  assert.deepEqual(again.data.visitedLocations, []);
}

console.log('OK : physique, collisions, sauvegarde');
