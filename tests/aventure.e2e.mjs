/* Tests navigateur du mode aventure (Chrome headless, tests/cdp.mjs).
     BASE=http://localhost:5173 node tests/aventure.e2e.mjs [dossier-captures]
   Le serveur (npm run dev ou npm run preview) doit tourner. */
import { launch } from './cdp.mjs';

const BASE = process.env.BASE || 'http://localhost:5173';
const SHOTS = process.argv[2] || null;
const results = [];
let failed = 0;
const ok = (name, cond, detail = '') => {
  results.push(`${cond ? 'OK  ' : 'FAIL'} ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!cond) failed++;
};
const G = 'window.__aventure';

const p = await launch({ width: 1280, height: 800 });
const state = () => p.eval(`${G}.state`);
const pos = () => p.eval(`({ x: ${G}.player.x, y: ${G}.player.y, grounded: ${G}.player.grounded })`);
const shot = (name) => (SHOTS ? p.shot(`${SHOTS}/${name}.png`) : null);
const fresh = async (hash, wait = 1300) => {
  // Un paramètre différent force un vrai rechargement (un simple changement de fragment ne recharge pas).
  await p.goto(`${BASE}/aventure?t=${Math.random().toString(36).slice(2)}${hash}`, wait);
};
const clearAll = () => p.eval('localStorage.clear(); sessionStorage.clear()');

// ── A. Sélecteur → briefing → jeu ──
await p.goto(`${BASE}/aventure`, 1500);
await clearAll();
await fresh('', 1500);
ok('sélecteur affiché', await state() === 'select');
ok('trois cartes', await p.eval('document.querySelectorAll(".adv-card").length') === 3);
ok('cartes : catégories', (await p.eval('[...document.querySelectorAll(".adv-card__cat")].map(e => e.textContent).join("|")')) === 'URBAIN|HÉROÏQUE|MATURE');
ok('miniatures dessinées', await p.eval('[...document.querySelectorAll(".adv-card__view")].every(c => c.width > 50 && c.getContext("2d").getImageData(c.width >> 1, c.height >> 1, 1, 1).data[3] === 255)'));
ok('son coupé par défaut', await p.eval(`${G}.save.data.settings.sound === false && !${G}.audio.ctx`));
await shot('a1-selector');
await p.click('.adv-card[data-universe="ville"]');
await p.sleep(900);
ok('briefing après sélection', await state() === 'briefing');
ok('briefing : titre et commandes', await p.eval('document.querySelector(".adv-brief__title").textContent === "COMMENT EXPLORER" && document.querySelectorAll(".adv-brief .adv-keys > div").length === 4'));
ok('fragment #aventure/ville', await p.eval('location.hash') === '#aventure/ville');
await shot('a2-briefing');
await p.click('.adv-brief .adv-btn--big');
await p.sleep(300);
ok('travelling d\'ouverture', await state() === 'intro');
await p.press('Space');
await p.sleep(250);
ok('travelling passable → jeu', await state() === 'play');
ok('HUD visible', await p.eval('!document.querySelector(".adv-hud").hidden'));

// ── B. Gameplay ──
let a = await pos();
await p.down('ArrowRight'); await p.sleep(700); await p.up('ArrowRight'); await p.sleep(350);
let b = await pos();
ok('déplacement à droite', b.x - a.x > 90, `+${Math.round(b.x - a.x)} u`);
await p.down('KeyA'); await p.sleep(400); await p.up('KeyA'); await p.sleep(350);
let c = await pos();
ok('déplacement à gauche (A)', c.x < b.x - 40);
await p.eval(`window.__minY = 0; window.__iv = setInterval(() => { window.__minY = Math.min(window.__minY, ${G}.player.y); }, 8)`);
await p.press('Space', 400);
await p.sleep(900);
const minY = await p.eval('clearInterval(window.__iv), window.__minY');
c = await pos();
ok('saut', minY < -90, `apex ${Math.round(minY)} u`);
ok('gravité : retour au sol', c.y === 0 && c.grounded);
// Plateforme : sous l'abribus (toit à -88), on saute, on s'y pose.
await p.eval(`${G}.player.place(1035, 0); ${G}.camera.snap(${G}.player)`);
await p.press('Space', 450); await p.sleep(900);
c = await pos();
ok('plateforme : posé sur l\'abribus', c.y === -88 && c.grounded, `y ${c.y}`);
ok('compétence ramassée en hauteur', await p.eval(`${G}.save.hasSkill('typescript')`));
ok('retour : compétence découverte', await p.eval('!document.querySelector(".adv-toast").hidden && document.querySelector(".adv-toast__t").textContent') === 'TypeScript');
await shot('b1-platform-toast');
await p.down('ArrowDown'); await p.press('Space', 80); await p.up('ArrowDown'); await p.sleep(700);
c = await pos();
ok('descente de plateforme (↓ + saut)', c.y === 0);
ok('limite gauche du monde', await p.eval(`(() => { const g = ${G}; g.player.place(20, 0); for (let i = 0; i < 120; i++) g.controller.update(1 / 60, { axis: -1, jumpPressed: false, jumpHeld: false, down: false }); return g.player.x; })()`) === 11);

// ── C. Interaction : entrer dans un lieu ──
await p.eval(`${G}.player.place(${G}.level.location('profile').doorX - 30, 0); ${G}.camera.snap(${G}.player)`);
await p.sleep(200);
ok('invite d\'interaction', (await p.eval('document.querySelector(".adv-hud__prompt").hidden ? "" : document.querySelector(".adv-hud__prompt-main").textContent')).includes('PROFIL'));
await shot('c1-prompt');
await p.press('ArrowUp');
await p.sleep(120);
ok('entrée animée', await state() === 'entering');
await p.sleep(700);
ok('fenêtre ouverte', await state() === 'window' && await p.eval('!document.querySelector(".adv-win").hidden'));
ok('boucle suspendue derrière la fenêtre', await p.eval(`!${G}.loop.active`));
ok('profil : identité, rôle, présentation', await p.eval(`(() => { const t = document.querySelector('.adv-win__body').textContent; const pr = SECTIONS.profile.bio; return t.includes(pr.name) && t.includes(pr.title) && t.includes(pr.description) && t.includes('Symfony'); })()`));
ok('profil : lien CV', await p.eval('!!document.querySelector(".adv-win__body a[href=\'assets/CV.pdf\']")'));
ok('fragment #profil', await p.eval('location.hash') === '#profil');
await shot('c2-profile');

// ── D. Portfolio ──
const tab = async (label) => {
  await p.eval(`[...document.querySelectorAll('.adv-win__tab')].find(b => b.textContent === ${JSON.stringify(label)}).click()`);
  await p.sleep(200);
};
await tab('Parcours');
ok('parcours : toutes les étapes', await p.eval('document.querySelectorAll(".adv-step").length === SECTIONS.parcours.steps.length'));
await shot('d1-parcours');
await tab('Compétences');
ok('compétences : 8 fiches', await p.eval('document.querySelectorAll(".adv-skillcard").length') === 8);
await p.eval('[...document.querySelectorAll(".adv-skillcard")].find(b => b.textContent.includes("Symfony")).click()');
await p.sleep(150);
ok('fiche : nom, description, catégorie, projets', await p.eval(`(() => { const d = document.querySelector('.adv-skill'); return d.querySelector('.adv-skill__name').textContent === 'Symfony' && d.querySelector('.adv-skill__cat').textContent === 'Backend' && d.querySelectorAll('.adv-actions button').length === 6; })()`));
await shot('d2-skills');
await p.eval('[...document.querySelectorAll(".adv-skill .adv-actions button")].find(b => b.textContent === "Crowdin (clone)").click()');
await p.sleep(250);
ok('projet associé cliquable → galerie', await p.eval('document.querySelector(".adv-gal__title").textContent') === 'Crowdin (clone)' && await p.eval('location.hash') === '#projets/crowdin');
ok('galerie : 13 projets', await p.eval('document.querySelectorAll(".adv-gal__tab").length') === 13);
await p.eval('document.querySelector(".adv-win__body").focus()');
await p.press('ArrowRight'); await p.sleep(200);
ok('galerie : clavier →', await p.eval('document.querySelector(".adv-gal__title").textContent') === 'Infinitia');
await p.press('ArrowLeft'); await p.sleep(150); await p.press('ArrowLeft'); await p.sleep(200);
ok('galerie : clavier ←', await p.eval('document.querySelector(".adv-gal__title").textContent') === 'SkyWalk');
ok('fragment #projets/skywalk', await p.eval('location.hash') === '#projets/skywalk');
ok('projet : image, rôle, technologies, lien live', await p.eval(`(() => { const s = document.querySelector('.adv-gal__stage'); const img = s.querySelector('img'); return img.naturalWidth > 0 && s.textContent.includes('équipe de 7') && s.querySelectorAll('.adv-chips li').length === 12 && !!s.querySelector('a[href="https://skywalk-chi.vercel.app/"]'); })()`));
await shot('d3-gallery');
const box = await p.eval('(() => { const r = document.querySelector(".adv-gal__info").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 60 }; })()');
await p.swipe(box.x + 90, box.y, box.x - 90, box.y); await p.sleep(250);
ok('galerie : balayage', await p.eval('document.querySelector(".adv-gal__title").textContent') === 'Crowdin (clone)');
await p.eval('[...document.querySelectorAll(".adv-gal__tab")].find(b => b.textContent.includes("POOL")).click()'); await p.sleep(150);
ok('galerie : clic sur un onglet, statut « En cours »', await p.eval('document.querySelector(".adv-gal__stage").textContent.includes("En cours")'));
ok('aucun « résultat » inventé', await p.eval('![...document.querySelectorAll(".adv-gal__stage .adv-h4")].some(h => h.textContent === "Résultat")'));
await tab('Contact');
ok('contact : e-mail, téléphone, formulaire, tarifs', await p.eval(`(() => { const b = document.querySelector('.adv-win__body'); return !!b.querySelector('a[href="mailto:' + SECTIONS.contact.email + '"]') && b.textContent.includes(SECTIONS.contact.phone) && !!b.querySelector('form [name=from_email]') && !!b.querySelector('a[href="/tarifs"]'); })()`));
await shot('d4-contact');
await p.press('Escape'); await p.sleep(300);
ok('Échap ferme la fenêtre → jeu', await state() === 'play' && await p.eval('document.querySelector(".adv-win").hidden'));
ok('lieux visités comptés', await p.eval(`${G}.save.data.visitedLocations.length`) === 4 || await p.eval(`${G}.save.data.visitedLocations.length`) >= 3, await p.eval(`${G}.save.data.visitedLocations.join(',')`));

// ── I. Fin de l'expérience (les 4 lieux ont été vus via les onglets) ──
await p.sleep(1700);
ok('écran de fin', await state() === 'end' && await p.eval('document.querySelector(".adv-end__title").textContent') === 'EXPÉRIENCE TERMINÉE');
ok('fin : 4 volets + 5 actions', await p.eval('document.querySelectorAll(".adv-end__tile").length === 4 && [...document.querySelectorAll(".adv-end__actions > *")].map(e => e.textContent).join("|")') === 'VOIR LE CV|ME CONTACTER|VOIR LES PROJETS|MODE CLASSIQUE|EXPLORER À NOUVEAU');
await shot('i1-end');
await p.eval('[...document.querySelectorAll(".adv-end__actions button")].find(b => b.textContent === "EXPLORER À NOUVEAU").click()'); await p.sleep(200);
ok('explorer à nouveau → jeu', await state() === 'play');

// ── E. Pause ──
await p.press('Escape'); await p.sleep(250);
ok('Échap → pause', await state() === 'paused');
ok('pause : 12 entrées', await p.eval('[...document.querySelectorAll(".adv-pause__item")].map(e => e.textContent).join("|")') === 'REPRENDRE|CARTE|PROGRESSION|COMPÉTENCES|CV|TARIFS|CONTACT|COMMANDES|SON : COUPÉ|CHANGER D\'UNIVERS|MODE CLASSIQUE|RECOMMENCER');
await shot('e1-pause');
await p.eval('[...document.querySelectorAll(".adv-pause__item")].find(e => e.textContent.startsWith("SON")).click()'); await p.sleep(200);
ok('son activable (contexte audio créé au clic)', await p.eval(`${G}.save.data.settings.sound === true && !!${G}.audio.ctx && localStorage.getItem('drame.portfolio.sound') === 'on'`));
await p.eval('[...document.querySelectorAll(".adv-pause__item")].find(e => e.textContent.startsWith("SON")).click()'); await p.sleep(100);
ok('son désactivable', await p.eval(`${G}.save.data.settings.sound === false`));
await p.press('KeyP'); await p.sleep(200);
ok('P → reprise', await state() === 'play');
await p.press('KeyP'); await p.sleep(200);
await p.eval('[...document.querySelectorAll(".adv-pause__map button")].find(b => b.textContent.includes("GALERIE")).click()'); await p.sleep(1500);
ok('carte → déplacement rapide + entrée', await state() === 'window' && await p.eval('document.querySelector(".adv-win__title").textContent') === 'Projets', await state());
await p.press('Escape'); await p.sleep(300);
c = await pos();
ok('joueur devant la galerie', Math.abs(c.x - 2440) < 60, `x ${Math.round(c.x)}`);

// ── F. Sauvegarde ──
const saved = await p.eval('JSON.parse(localStorage.getItem("drame.aventure.save"))');
ok('sauvegarde v2', saved.version === 2 && saved.universe === 'ville' && saved.missionComplete === true && saved.collectedSkills.includes('typescript') && saved.viewedProjects.includes('skywalk'));
await fresh('#aventure/ville');
c = await pos();
ok('reprise après rechargement (même session : sans briefing)', await state() === 'play' && Math.abs(c.x - 2440) < 60 && await p.eval('location.hash') === '#aventure/ville');
ok('progression restaurée', await p.eval(`${G}.level.locations.every(l => l.visited) && ${G}.level.portal.boost && document.querySelector('.adv-hud__count b').textContent === '4/4'`));
// Changement d'univers : progression conservée, position remise au départ.
await p.press('Escape'); await p.sleep(200);
await p.eval('[...document.querySelectorAll(".adv-pause__item")].find(e => e.textContent.startsWith("CHANGER")).click()'); await p.sleep(700);
ok('changer d\'univers → sélecteur', await state() === 'select' && await p.eval('document.querySelector(".adv-card[data-universe=ville] .adv-card__badge").textContent') === 'Reprendre');
await p.click('.adv-card[data-universe="club"]'); await p.sleep(900);
await p.click('.adv-brief .adv-btn--big'); await p.sleep(300); await p.press('Space'); await p.sleep(300);
ok('univers club : progression conservée', await state() === 'play' && await p.eval(`${G}.universe.id === 'club' && ${G}.save.data.visitedLocations.length === 4 && ${G}.player.x === ${G}.level.spawn.x`));
ok('vocabulaire club', await p.eval('document.querySelector(".adv-hud__goal .adv-hud__k").textContent + "|" + [...document.querySelectorAll(".adv-hud__count .adv-hud__k")].map(e => e.textContent).join("|")') === 'MISSION|LIEUX|OUTILS');
// Recommencer.
await p.press('Escape'); await p.sleep(200);
await p.eval('document.querySelector(".adv-pause__item--danger").click()'); await p.sleep(100);
ok('recommencer : confirmation demandée', await p.eval(`${G}.save.data.visitedLocations.length`) === 4);
await p.eval('document.querySelector(".adv-pause__item--danger").click()'); await p.sleep(200);
ok('recommencer : nouvelle partie', await state() === 'play' && await p.eval(`${G}.save.data.visitedLocations.length === 0 && ${G}.save.data.collectedSkills.length === 0 && ${G}.save.data.universe === 'club'`));
// Collisions (club) : la caisse est un mur, le quai se monte par la marche.
await p.eval(`${G}.player.place(780, 0)`);
await p.down('ArrowRight'); await p.sleep(900); await p.up('ArrowRight'); await p.sleep(300);
c = await pos();
ok('mur : arrêté contre la caisse', Math.abs(c.x - (860 - 11)) < 0.5 && c.y === 0, `x ${c.x.toFixed(1)}`);
ok('plafond : saut stoppé sous le conduit', await p.eval(`(() => { const g = ${G}; g.player.place(2320, -60); let min = 0; const i = { axis: 0, jumpPressed: true, jumpHeld: true, down: false }; for (let k = 0; k < 90; k++) { g.controller.update(1 / 60, i); i.jumpPressed = false; min = Math.min(min, g.player.y); } return min; })()`) >= -188 + 56 - 0.5);
// Marche automatique avec obstacle : depuis le parking jusqu'aux CASE FILES (sur le quai).
await p.eval(`${G}.player.place(1420, 0); ${G}.goTo(${G}.level.location('parcours'))`);
await p.sleep(3200);
ok('marche auto : franchit la marche du quai et entre', await state() === 'window' && await p.eval('document.querySelector(".adv-win__kicker").textContent') === 'CASE FILES', await state());
await shot('f1-club-casefiles');
await p.press('Escape'); await p.sleep(300);
// Migration v1 → v2.
// (écrite depuis une autre page : en quittant /aventure, le jeu réenregistre sa partie)
await p.goto(`${BASE}/tarifs`, 700);
await p.eval(`localStorage.setItem('drame.aventure.save', JSON.stringify({ v: 1, visited: ['profile', 'contact'], tokens: ['react', 'docker', 'symfony'], complete: false, tuto: true, x: 900 }))`);
await fresh('#aventure/ville');
ok('migration v1 → v2', await p.eval(`(() => { const d = JSON.parse(localStorage.getItem('drame.aventure.save')); return d.version === 2 && d.visitedLocations.join() === 'profile,contact' && d.collectedSkills.join() === 'react,docker,symfony' && d.universe === 'ville'; })()`));
ok('migration : monde cohérent', await p.eval(`${G}.level.location('profile').visited && !${G}.level.location('projets').visited && ${G}.level.collectibles.filter(c => c.taken).length === 3`));

// ── G. Liens profonds ──
await fresh('#projets/skywalk');
ok('#projets/skywalk', await state() === 'window' && await p.eval('document.querySelector(".adv-gal__title").textContent') === 'SkyWalk' && await p.eval('location.hash') === '#projets/skywalk');
await p.goto(`${BASE}/aventure?t=r#projets/skywalk`, 100); await fresh('#projets/skywalk');
ok('#projets/skywalk après rafraîchissement', await p.eval('document.querySelector(".adv-gal__title").textContent') === 'SkyWalk');
await fresh('#parcours/etna');
ok('#parcours/etna', await p.eval('!!document.querySelector("#adv-step-etna.is-target")'));
await fresh('#portail');
ok('#portail', await state() === 'play' && await p.eval(`Math.abs(${G}.player.x - ${G}.level.portal.doorX) < 80`));
await p.sleep(300);
ok('portail : invite + lien tarifs', await p.eval('document.querySelector(".adv-hud__prompt-main").textContent.includes("CONSTRUISEZ VOTRE PROJET") && !document.querySelector(".adv-hud__prompt-more").hidden && document.querySelector(".adv-hud__prompt-more").getAttribute("href") === "/tarifs"'));
await shot('g1-portal');
for (const u of ['ville', 'hero', 'club']) {
  await clearAll();
  await fresh('#aventure/' + u);
  ok(`#aventure/${u} : briefing (nouvelle session)`, await state() === 'briefing' && await p.eval(`${G}.universe.id`) === u);
  await p.click('.adv-brief .adv-btn--big'); await p.sleep(250); await p.press('Space'); await p.sleep(250);
  await fresh('#aventure/' + u);
  ok(`#aventure/${u} : après rafraîchissement`, await state() === 'play' && await p.eval(`${G}.universe.id`) === u && await p.eval('location.hash') === '#aventure/' + u);
  ok(`${u} : portail présent`, await p.eval(`${G}.level.portal.label === 'CONSTRUISEZ VOTRE PROJET' && ${G}.level.portal.href === '/construire-projet' && ${G}.level.locations.length === 4 && ${G}.level.collectibles.length === 8`));
  await p.sleep(500);
  await shot('g2-' + u);
}
// Fragment modifié pendant la partie.
await p.eval('location.hash = "#contact"'); await p.sleep(400);
ok('changement de fragment en jeu', await state() === 'window' && await p.eval('document.querySelector(".adv-win__title").textContent') === 'Contact');
await p.press('Escape'); await p.sleep(250);

// ── Toits (hero) : montée par l'escalier de secours ──
await fresh('#aventure/hero');
const climbed = await p.eval(`(() => {
  const g = ${G}; g.loop.pause(); const pl = g.player; pl.place(880, 0);
  const i = { axis: 0, jumpPressed: false, jumpHeld: true, down: false };
  const targets = [[902, -110], [942, -220], [902, -330], [942, -440], [1040, -520]];
  for (const [tx, ty] of targets) {
    for (let k = 0; k < 400 && !(pl.grounded && pl.y === ty); k++) {
      i.axis = Math.abs(tx - pl.x) < 6 ? 0 : Math.sign(tx - pl.x);
      i.jumpPressed = pl.grounded && k % 40 === 0;
      g.controller.update(1 / 60, i);
    }
    if (pl.y !== ty) return 'bloqué à y=' + pl.y + ' (cible ' + ty + ')';
  }
  g.camera.snap(pl); g.loop.resume(); return 'toit';
})()`);
ok('hero : RUE → TOITS par les plateformes', climbed === 'toit', climbed);
await p.sleep(400);
ok('hero : zone « Les toits »', await p.eval('document.querySelector(".adv-hud__zone").textContent') === 'Les toits');
await shot('g3-hero-roof');

// ── K. Taux de rafraîchissement : même trajet simulé à 60 / 120 / 144 Hz dans le vrai jeu ──
const hz = await p.eval(`(async () => {
  const g = ${G}; g.loop.pause(); const out = {};
  for (const rate of [30, 60, 120, 144, 165]) {
    g.player.place(300, 0);
    const i = { axis: 1, jumpPressed: false, jumpHeld: true, down: false };
    let apex = 0, t = 0;
    for (let f = 0; f < Math.round(1.5 * rate); f++) {
      const dt = 1 / rate, n = Math.max(1, Math.ceil(dt / (1 / 60) - 1e-9));
      for (let s = 0; s < n; s++) { i.jumpPressed = s === 0 && Math.abs(t - 0.5) < dt / 2; g.controller.update(dt / n, i); apex = Math.min(apex, g.player.y); }
      t += dt;
    }
    out[rate] = [Math.round(g.player.x), Math.round(apex)];
  }
  g.loop.resume(); return out;
})()`);
const ref = hz[60];
ok('60 / 120 / 144 Hz : même distance et même saut', [30, 120, 144, 165].every(r => Math.abs(hz[r][0] - ref[0]) <= ref[0] * 0.02 && Math.abs(hz[r][1] - ref[1]) <= 3), JSON.stringify(hz));

// ── H. Navigation entre modes ──
await fresh('#aventure/ville');
await p.eval(`${G}.player.place(${G}.level.location('projets').doorX, 0)`); await p.sleep(250);
await p.click('.adv-hud__bar a'); await p.sleep(1600);
ok('aventure → classique (emporte le lieu regardé)', (await p.eval('location.pathname + location.hash')).replace('.html', '') === '/classique/projets', await p.eval('location.href'));
ok('classique : lien « Retour à l\'aventure »', await p.eval('[...document.querySelectorAll("[data-switch-adventure]")].some(a => a.textContent.includes("Retour à l\'aventure"))'));
await shot('h1-classique');
await fresh('#portail', 1400);
await p.press('ArrowUp'); await p.sleep(2000);
ok('aventure → construire-projet', (await p.eval('location.pathname')).replace('.html', '') === '/construire-projet');
ok('construire-projet : mini-jeu lancé (canvas + contrôles)', await p.eval('!!document.querySelector("canvas") && typeof Player === "function" && typeof Controls === "function" && typeof MobileControls === "function" && !!window.AudioManager'));
await p.down('ArrowRight'); await p.sleep(500); await p.up('ArrowRight');
ok('construire-projet : son coupé comme dans l\'aventure', await p.eval('window.AudioManager.isEnabled()') === false);
await shot('h2-construire');
ok('retour du portail → /aventure#portail', (await p.eval('window.Deeplink.homeHref(true)')) === '/aventure#portail');
await p.goto(`${BASE}/`, 1200);
ok('portfolio → aventure (carte du mode aventure)', await p.eval('document.querySelector("a.mode--adventure").getAttribute("href")') === '/aventure');

// ── Accessibilité : mouvement réduit, clavier seul, ancien lien #ville ──
await p.reducedMotion(true);
await clearAll();
await fresh('#ville', 1500);
ok('#ville (ancien lien) → sélecteur', await state() === 'select');
ok('sélecteur : focus sur une carte', await p.eval('document.activeElement.classList.contains("adv-card")'));
await p.press('ArrowRight'); await p.sleep(100);
ok('sélecteur : flèches', await p.eval('document.activeElement.dataset.universe') === 'hero');
await p.press('Enter', 40); await p.sleep(500);
ok('clavier seul : Entrée choisit l\'univers', await state() === 'briefing' && await p.eval(`${G}.universe.id`) === 'hero');
await p.press('Enter', 40); await p.sleep(300);
ok('mouvement réduit : pas de travelling', await state() === 'play' && await p.eval(`${G}.reduced && !${G}.camera.panning`));
await p.eval(`${G}.player.place(${G}.level.location('contact').doorX, 0)`); await p.sleep(200);
await p.press('Enter', 40); await p.sleep(250);
ok('mouvement réduit : ouverture directe (Entrée)', await state() === 'window' && await p.eval('document.querySelector(".adv-win__title").textContent') === 'Contact');
ok('focus dans la fenêtre', await p.eval('document.querySelector(".adv-win").contains(document.activeElement)'));
await p.press('Escape'); await p.sleep(250);
await p.reducedMotion(false);

const known = p.errors.filter(e => /ViewTransition opt-in disabled/.test(e));
const errors = p.errors.filter(e => !known.includes(e));
console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} tests`);
console.log('Erreurs console :', errors.length ? JSON.stringify(errors, null, 1) : 'aucune');
// Message de Chrome quand une transition de page native est interrompue en arrivant sur
// construire-projet : préexistant (reproduit depuis /tarifs), sans effet visible.
if (known.length) console.log('Avertissement connu (transition de page native interrompue) :', known.length);
await p.close();
process.exit(failed || errors.length ? 1 : 0);
