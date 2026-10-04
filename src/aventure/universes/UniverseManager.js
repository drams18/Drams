/* UNIVERSEMANAGER.JS : registre des univers et univers courant. */

import ville from './ville/index.js';
import hero from './hero/index.js';
import club from './club/index.js';
import { applyTheme } from './theme.js';

const ALL = [ville, hero, club];
export const DEFAULT_UNIVERSE = 'ville';

export class UniverseManager {
  constructor(root) {
    this.root = root;
    this.current = null;
  }

  list() { return ALL; }
  get(id) { return ALL.find(u => u.id === id) || null; }
  has(id) { return !!this.get(id); }

  activate(id) {
    const u = this.get(id) || this.get(DEFAULT_UNIVERSE);
    this.current = u;
    applyTheme(this.root, u);
    return u;
  }
}
