/* PROJECT.JS : un projet de la galerie, normalisé depuis js/museum.js.
   Rien n'est inventé : un champ absent de la source reste absent. */

const IMG = 'assets/img/projets/';

export class Project {
  constructor(raw) {
    this.slug = raw.slug;
    this.title = raw.title;
    this.short = raw.short || raw.title;
    this.type = raw.type || '';
    this.category = raw.category || '';
    this.date = raw.date || '';
    this.desc = raw.desc || '';
    this.role = raw.role || '';
    this.result = raw.result || '';            // affiché seulement s'il est renseigné
    this.tech = raw.tech || [];
    this.pick = !!raw.pick;
    this.device = raw.device || 'desktop';
    const links = raw.links || [];
    this.github = links.find(l => /github\.com/i.test(l.url)) || null;
    this.links = links.filter(l => l !== this.github);
    // Même règle que le mode classique : statut explicite, sinon dérivé des liens.
    this.status = raw.status || (links.length ? 'En ligne' : 'Indisponible');
    this.shots = (raw.shots || []).map(s => ({ src: IMG + s.file + '.webp', alt: s.alt || '' }));
    this.image = this.shots.length ? IMG + raw.slug + '.webp' : null;
  }
}
