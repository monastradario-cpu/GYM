/* GYM — generato da tools/esporta_desc.py: figure anatomiche disponibili e testi di esecuzione
   ricavati dalle istruzioni di free-exercise-db (pubblico dominio). Non modificare a mano. */
'use strict';
const FIGS = new Set(["alzate_laterali", "chest_press", "croci_cavi", "stacco_bil"]);
const FIGDESC = {};
(function () {
  Object.keys(FIGDESC).forEach(id => {
    const e = EX[id], d = FIGDESC[id]; if (!e || e.core) return;
    e.steps = d.s; if (d.e.length) e.err = d.e;
  });
})();
