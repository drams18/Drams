/* PLATFORM.JS : géométrie de collision d'un niveau.
   solid    : bloc plein (sol, caisse, quai, marche, plafond)
   platform : surface traversable par dessous (auvent, escalier de secours, toit) */

export function solid(x, y, w, h, kind = 'block') {
  return { x, y, w, h, kind, oneWay: false };
}

export function platform(x, y, w, kind = 'ledge') {
  return { x, y, w, h: 8, kind, oneWay: true };
}
