/* EXPERIENCE.JS : une étape du parcours (formation ou expérience). */

const IMG = 'assets/img/parcours/';

export class Experience {
  constructor(raw) {
    this.slug = raw.slug;
    this.short = raw.short || raw.title;
    this.kind = raw.kind || '';
    this.date = raw.date || '';
    this.title = raw.title;
    this.place = raw.place || '';
    this.context = raw.context || '';
    this.desc = raw.desc || '';
    this.role = raw.role || '';
    this.details = raw.details || [];
    this.logo = raw.logo ? IMG + raw.logo + '.webp' : null;
    this.photos = (raw.photos || []).map(p => ({ src: IMG + p.file + '.webp', alt: p.alt || '' }));
  }
}
