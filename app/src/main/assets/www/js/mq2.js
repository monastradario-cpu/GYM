/* GYM — omino v2: corpo con volumi (arti affusolati, busto sagomato) e muscoli che lavorano colorati.
   Usa le stesse pose di anim.js (solveSide / solveFront). Stili: vettoriale, anatomico, linee. */
'use strict';

const MQ_STYLES = {
  vettoriale: { n: 'Vettoriale', d: 'Forme piene a due toni, come la figura del corpo.' },
  anatomico: { n: 'Anatomico', d: 'Si vedono tutti i muscoli; quelli che lavorano sono colorati.' },
  linee: { n: 'Disegno a linee', d: 'Bianco con contorno, muscoli allenati colorati.' },
  classico: { n: 'Classico', d: 'L\'omino semplice di prima.' }
};
const mqStyle = () => (typeof S !== 'undefined' && S.settings && S.settings.mq) || 'vettoriale';

const V2 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  len: v => Math.hypot(v[0], v[1]) || 1,
  nrm: v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; },
  lerp: (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k],
  off: (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k]
};
const f1 = n => (Math.round(n * 10) / 10);
const pathOf = (pts, closed) => smoothPath(pts.map(p => [f1(p[0]), f1(p[1])]), closed !== false);

/* arto affusolato a da raggio ra a b raggio rb, con un leggero "ventre" muscolare */
function limbPts(a, b, ra, rb, belly, bellySide) {
  const v = V2.nrm(V2.sub(b, a)), n = [-v[1], v[0]], L = V2.len(V2.sub(b, a));
  const bl = belly || 0, side = bellySide || 0; // side: +1 gonfia verso n, -1 verso -n, 0 entrambi
  const pts = [], steps = [0, 0.25, 0.5, 0.75, 1];
  const r = (t, s) => { const base = ra + (rb - ra) * t; const bump = bl * Math.sin(Math.PI * Math.min(1, t * 1.15)); return base + (side === 0 || side === s ? bump : bump * 0.25); };
  steps.forEach(t => { const c = V2.lerp(a, b, t); pts.push(V2.off(c, n, r(t, 1))); });
  // punta arrotondata in b
  pts.push(V2.off(b, v, rb * 0.85));
  steps.slice().reverse().forEach(t => { const c = V2.lerp(a, b, t); pts.push(V2.off(c, n, -r(t, -1))); });
  pts.push(V2.off(a, v, -ra * 0.85));
  return pts;
}
/* muscolo dentro un arto: spostato verso un lato (side = vettore unitario) */
function musclePts(a, b, ra, rb, sideV, t0, t1, shift, w) {
  const v = V2.nrm(V2.sub(b, a)), pts = [], N = 6;
  const sidePts = [], inPts = [];
  for (let i = 0; i <= N; i++) {
    const t = t0 + (t1 - t0) * i / N, c = V2.lerp(a, b, t), r = ra + (rb - ra) * t;
    const s = Math.sin(Math.PI * i / N);
    sidePts.push(V2.off(c, sideV, r * (shift + w * s)));
    inPts.push(V2.off(c, sideV, r * (shift - w * 0.5 * s)));
  }
  return sidePts.concat(inPts.reverse());
}
const sideOf = (a, b, s) => { const v = V2.nrm(V2.sub(b, a)); return [v[1] * s, -v[0] * s]; }; // s=+1 anteriore per gambe/braccia rivolti a destra

function mqColors(st) {
  if (st === 'linee') return { body: 'var(--mq-l-fill)', far: 'var(--mq-l-far)', line: 'var(--mq-l-line)', lw: 1.6, mus: 'none', musLine: 'var(--mq-l-mline)', hl: false };
  if (st === 'anatomico') return { body: 'var(--mq-a-body)', far: 'var(--mq-a-far)', line: 'var(--mq-a-line)', lw: 0.9, mus: 'var(--mq-a-mus)', musLine: 'var(--mq-a-line)', hl: false };
  return { body: 'var(--mq)', far: 'var(--mq2)', line: 'none', lw: 0, mus: 'none', musLine: 'none', hl: true };
}

function drawSide2(p, root, e, def) {
  const J0 = solveSide(p), J = {}; for (const k in J0) J[k] = TR(J0[k], root);
  const st = mqStyle(), C = mqColors(st), hi = hiOf(e), out = [];
  const shape = (pts, fill, extra) => '<path d="' + pathOf(pts) + '" fill="' + fill + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + C.lw + '" stroke-linejoin="round"' : '') + (extra || '') + '/>';
  const mus = (pts, m) => {
    const o = hi[m];
    if (o) return '<path d="' + pathOf(pts) + '" fill="' + ACC + '" fill-opacity="' + (0.45 + 0.55 * o) + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + (C.lw * 0.8) + '"' : '') + '/>';
    if (C.mus !== 'none') return '<path d="' + pathOf(pts) + '" fill="' + C.mus + '" stroke="' + C.musLine + '" stroke-width="0.6"/>';
    return '';
  };
  const tdir = V2.nrm(V2.sub(J.shoulder, J.hip)), fwd = [Math.sin(rad(p.t)), Math.cos(rad(p.t))];
  const along = (k, off) => [J.hip[0] + (J.shoulder[0] - J.hip[0]) * k + fwd[0] * off, J.hip[1] + (J.shoulder[1] - J.hip[1]) * k + fwd[1] * off];
  // gamba e braccio (lato lontano o vicino)
  const leg = (hip, knee, ankle, toe, fill, near) => {
    const o = [];
    o.push(shape(limbPts(hip, knee, 9.5, 6.2, 1.8), fill));
    o.push(shape(limbPts(knee, ankle, 6, 3.8, 1.4, 0), fill));
    const fv = V2.nrm(V2.sub(toe, ankle)), fn = [-fv[1], fv[0]];
    o.push(shape([V2.off(ankle, fv, -4.5), V2.off(V2.off(ankle, fn, -3.5), fv, 1), V2.off(toe, fn, -2.2), V2.off(toe, fv, 1.5), V2.off(toe, fn, 1.6), V2.off(ankle, fn, 4)], fill));
    if (near) {
      const ant = sideOf(hip, knee, 1), sh = sideOf(knee, ankle, 1);
      o.push(mus(musclePts(hip, knee, 9.5, 6.2, ant, 0.12, 0.9, 0.1, 0.75), 'quadricipiti'));
      o.push(mus(musclePts(hip, knee, 9.5, 6.2, [-ant[0], -ant[1]], 0.15, 0.85, 0.15, 0.65), 'femorali'));
      o.push(mus(musclePts(knee, ankle, 6, 3.8, [-sh[0], -sh[1]], 0.08, 0.62, 0.1, 0.85), 'polpacci'));
    }
    return o.join('');
  };
  const arm = (sh, el, hd, fill, near) => {
    const o = [];
    o.push(shape(limbPts(sh, el, 6.4, 4.6, 1.2), fill));
    o.push(shape(limbPts(el, hd, 4.6, 3.2, 0.9), fill));
    o.push('<circle cx="' + f1(hd[0]) + '" cy="' + f1(hd[1]) + '" r="4.2" fill="' + fill + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + C.lw + '"' : '') + '/>');
    if (near) {
      const ant = sideOf(sh, el, 1);
      o.push(mus(musclePts(sh, el, 6.4, 4.6, ant, 0.2, 0.9, 0.05, 0.75), 'bicipiti'));
      o.push(mus(musclePts(sh, el, 6.4, 4.6, [-ant[0], -ant[1]], 0.15, 0.85, 0.05, 0.75), 'tricipiti'));
      o.push(mus(musclePts(el, hd, 4.6, 3.2, sideOf(el, hd, 1), 0.05, 0.7, -0.2, 0.9), 'avambracci'));
    }
    return o.join('');
  };
  // lontani
  out.push(leg(J.hip, J.knee2, J.ankle2, J.toe2, C.far, false));
  out.push(arm(J.shoulder, J.elbow2, J.hand2, C.far, false));
  // busto: profilo con petto, pancia, schiena e glutei
  const prof = [[0, 9], [0.18, 10.5], [0.42, 9.5], [0.62, 12], [0.8, 13], [0.95, 9], [1.06, 5.5]];
  const back = [[1.06, -6], [0.95, -10], [0.78, -12.5], [0.55, -10], [0.32, -9], [0.1, -12.5], [-0.08, -11]];
  const torso = prof.map(([k, o]) => along(k, o)).concat(back.map(([k, o]) => along(k, o)));
  out.push(shape(torso, C.body));
  // muscoli del busto
  out.push(mus([along(0.6, 3), along(0.66, 12), along(0.82, 13), along(0.94, 8.5), along(0.88, 3)], 'petto'));
  out.push(mus([along(0.14, 3), along(0.2, 9.8), along(0.42, 9), along(0.56, 10.5), along(0.58, 3), along(0.36, 2.5)], 'addome'));
  out.push(mus([along(0.42, -3), along(0.5, -9.5), along(0.76, -12), along(0.92, -9), along(0.86, -3)], 'dorso'));
  out.push(mus([along(0.22, -3), along(0.12, -12), along(-0.05, -10.5), along(-0.02, -3)], 'glutei'));
  // collo e testa
  const nk = V2.off(J.shoulder, tdir, 2), hd = J.head;
  out.push(shape(limbPts(nk, V2.lerp(nk, hd, 0.7), 4.6, 4.4), C.body));
  const hv = V2.nrm(V2.sub(hd, nk)), hn = [hv[1], -hv[0]]; // hn = davanti al viso (verso destra se in piedi)
  const face = (p.n - 90);
  const fv = vec(face, 1), fvs = [fv[0], fv[1]];
  const ang = Math.atan2(hv[1], hv[0]) * 180 / Math.PI + 90;
  out.push('<ellipse cx="' + f1(hd[0]) + '" cy="' + f1(hd[1]) + '" rx="9.3" ry="11" transform="rotate(' + f1(ang) + ' ' + f1(hd[0]) + ' ' + f1(hd[1]) + ')" fill="' + C.body + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + C.lw + '"' : '') + '/>');
  out.push(shape([V2.off(V2.off(hd, hv, 1), fvs, 8.6), V2.off(V2.off(hd, hv, -1.5), fvs, 11.3), V2.off(V2.off(hd, hv, -3.5), fvs, 8.4)], C.body));
  out.push(dot(V2.off(V2.off(hd, hv, 1.5), fvs, 6.5), 1.6, 'var(--bg)'));
  // vicini
  out.push(leg(J.hip, J.knee, J.ankle, J.toe, C.body, true));
  out.push(arm(J.shoulder, J.elbow, J.hand, C.body, true));
  out.push(mus([V2.off(J.shoulder, fwd, 7), V2.off(J.shoulder, tdir, 6), V2.off(J.shoulder, fwd, -7), V2.off(V2.lerp(J.shoulder, J.elbow, 0.42), fwd, 0)], 'spalle'));
  if (C.hl) out.push('<path d="' + pathOf([along(0.62, 9.5), along(0.82, 10.5)], false) + '" stroke="#fff" stroke-opacity=".25" stroke-width="1.5" fill="none" stroke-linecap="round"/>');
  return { svg: out.join(''), J };
}

function drawFront2(p, root, e) {
  const J0 = solveFront(p), J = {}; for (const k in J0) J[k] = TR(J0[k], root);
  const st = mqStyle(), C = mqColors(st), hi = hiOf(e), out = [];
  const shape = (pts, fill) => '<path d="' + pathOf(pts) + '" fill="' + fill + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + C.lw + '" stroke-linejoin="round"' : '') + '/>';
  const mus = (pts, m) => {
    const o = hi[m];
    if (o) return '<path d="' + pathOf(pts) + '" fill="' + ACC + '" fill-opacity="' + (0.45 + 0.55 * o) + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + (C.lw * 0.8) + '"' : '') + '/>';
    if (C.mus !== 'none') return '<path d="' + pathOf(pts) + '" fill="' + C.mus + '" stroke="' + C.musLine + '" stroke-width="0.6"/>';
    return '';
  };
  const h = J.hip, s = J.sh, tl = LEN.t * p.tS, up = V2.nrm(V2.sub(s, h)), rt = [-up[1], up[0]].map(x => -x); // rt: verso destra dello schermo
  const at = (k, dx) => [h[0] + (s[0] - h[0]) * k + rt[0] * dx, h[1] + (s[1] - h[1]) * k + rt[1] * dx];
  // gambe
  ['R', 'L'].forEach(sd => {
    const hp = J['hip' + sd], kn = J['knee' + sd], an = J['ankle' + sd], sg = sd === 'R' ? 1 : -1;
    out.push(shape(limbPts(hp, kn, 9.5, 6.4, 1.6), C.body));
    out.push(shape(limbPts(kn, an, 6, 4, 1.2), C.body));
    out.push(shape([V2.off(an, [0, 1], -2), [an[0] + sg * 9, an[1] + 3], [an[0] + sg * 8, an[1] + 6], [an[0] - sg * 3, an[1] + 5]], C.body));
    out.push(mus(limbPts(V2.lerp(hp, kn, 0.12), V2.lerp(hp, kn, 0.85), 6.5, 4.2, 1.2), hi.quadricipiti || !hi.femorali ? 'quadricipiti' : 'femorali'));
    out.push(mus(limbPts(V2.lerp(kn, an, 0.1), V2.lerp(kn, an, 0.55), 3.4, 2.4, 1), 'polpacci'));
  });
  // busto a V
  const sw = 21 * (p.tS < 1 ? 0.9 : 1);
  const torso = [at(1.04, 0), at(1, sw), at(0.86, sw + 1.5), at(0.6, 14), at(0.3, 12), at(0.05, 13.5), at(-0.08, 9), at(-0.1, 0), at(-0.08, -9), at(0.05, -13.5), at(0.3, -12), at(0.6, -14), at(0.86, -sw - 1.5), at(1, -sw)];
  out.push(shape(torso, C.body));
  [1, -1].forEach(sg => {
    out.push(mus([at(0.62, sg * 1.5), at(0.66, sg * 13), at(0.8, sg * 17), at(0.92, sg * 10), at(0.9, sg * 1.5)], 'petto'));
    out.push(mus([at(0.4, sg * 13), at(0.55, sg * 15.5), at(0.78, sg * 19), at(0.62, sg * 12)], 'dorso'));
    out.push(mus([at(0.02, sg * 2), at(0.04, sg * 11), at(-0.06, sg * 8), at(-0.08, sg * 2)], 'glutei'));
  });
  out.push(mus([at(0.15, -6), at(0.15, 6), at(0.57, 7), at(0.57, -7)], 'addome'));
  // testa
  const hx = J.head[0] - s[0];
  out.push(shape(limbPts(V2.off(s, up, -2), V2.off(s, up, 9), 4.8, 4.5), C.body));
  out.push('<ellipse cx="' + f1(J.head[0]) + '" cy="' + f1(J.head[1]) + '" rx="9.2" ry="11" fill="' + C.body + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + C.lw + '"' : '') + (hx ? ' transform="rotate(' + f1(hx * 2.2) + ' ' + f1(J.head[0]) + ' ' + f1(J.head[1]) + ')"' : '') + '/>');
  // braccia
  ['R', 'L'].forEach(sd => {
    const sh = J['shoulder' + sd], el = J['elbow' + sd], hd = J['hand' + sd];
    out.push(shape(limbPts(sh, el, 6.4, 4.6, 1.2), C.body));
    out.push(shape(limbPts(el, hd, 4.6, 3.2, 0.9), C.body));
    out.push('<circle cx="' + f1(hd[0]) + '" cy="' + f1(hd[1]) + '" r="4.2" fill="' + C.body + '"' + (C.line !== 'none' ? ' stroke="' + C.line + '" stroke-width="' + C.lw + '"' : '') + '/>');
    const arm = limbPts(V2.lerp(sh, el, 0.22), V2.lerp(sh, el, 0.88), 4, 3, 0.8);
    out.push(mus(arm, hi.bicipiti ? 'bicipiti' : 'tricipiti'));
    out.push(mus(limbPts(V2.lerp(el, hd, 0.08), V2.lerp(el, hd, 0.7), 3.2, 2.2, 0.6), 'avambracci'));
    out.push(mus(limbPts(V2.off(sh, up, 2), V2.lerp(sh, el, 0.35), 7, 5, 0.5), 'spalle'));
  });
  return { svg: out.join(''), J };
}
