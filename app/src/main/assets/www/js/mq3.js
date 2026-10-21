/* GYM — omino "realistico": figura muscolosa grigia con ombre, pantaloncini neri e muscoli allenati in rosso.
   Disegno originale (ispirato allo stile delle tavole di esercizi), stesse pose di anim.js. */
'use strict';

MQ_STYLES.realistico = { n: 'Realistico', d: 'Figura muscolosa con ombre e pantaloncini; il muscolo che lavora è rosso.' };

const MQ3_DEFS = '<defs>' +
  '<linearGradient id="mq3s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3f4f6"/><stop offset=".55" stop-color="#c9cdd3"/><stop offset="1" stop-color="#8e949d"/></linearGradient>' +
  '<linearGradient id="mq3f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9cdd3"/><stop offset="1" stop-color="#7c828b"/></linearGradient>' +
  '<linearGradient id="mq3r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffab8c"/><stop offset=".5" stop-color="#f0583a"/><stop offset="1" stop-color="#b8261a"/></linearGradient>' +
  '<linearGradient id="mq3k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4d53"/><stop offset="1" stop-color="#141518"/></linearGradient>' +
  '</defs>';
const MQ3 = { line: '#6a7079', out: '#4d535b' };

/* arto con profilo anteriore/posteriore separato: fr e bk = raggi lungo l'arto (5 valori) */
function limb3(a, b, fr, bk) {
  const v = V2.nrm(V2.sub(b, a)), ant = [v[1], -v[0]], ts = [0, 0.25, 0.5, 0.75, 1], P = [];
  ts.forEach((t, i) => P.push(V2.off(V2.lerp(a, b, t), ant, fr[i])));
  P.push(V2.off(b, v, Math.min(fr[4], bk[4]) * 0.8));
  ts.slice().reverse().forEach((t, j) => P.push(V2.off(V2.lerp(a, b, t), ant, -bk[4 - j])));
  P.push(V2.off(a, v, -Math.min(fr[0], bk[0]) * 0.75));
  return P;
}
/* metà (anteriore o posteriore) di un arto, da t0 a t1, per i muscoli */
function half3(a, b, R, t0, t1, side, inset) {
  const v = V2.nrm(V2.sub(b, a)), ant = [v[1] * side, -v[0] * side], N = 6, o = [], ins = [];
  const rAt = t => { const x = t * 4, i = Math.min(3, Math.floor(x)), k = x - i; return R[i] + (R[i + 1] - R[i]) * k; };
  for (let i = 0; i <= N; i++) { const t = t0 + (t1 - t0) * i / N, s = Math.sin(Math.PI * i / N); o.push(V2.off(V2.lerp(a, b, t), ant, rAt(t) * (0.96 - (1 - s) * 0.25))); ins.push(V2.off(V2.lerp(a, b, t), ant, (inset || -0.15) * rAt(t) * s)); }
  return o.concat(ins.reverse());
}
function line3(pts, w, col) { return '<path d="' + pathOf(pts, false) + '" fill="none" stroke="' + (col || MQ3.line) + '" stroke-width="' + (w || 0.7) + '" stroke-linecap="round"/>'; }
function sh3(pts, fill, w) { return '<path d="' + pathOf(pts) + '" fill="' + fill + '" stroke="' + (fill === 'url(#mq3k)' ? '#0d0e10' : MQ3.out) + '" stroke-width="' + (w == null ? 0.9 : w) + '" stroke-linejoin="round"/>'; }

function drawSide3(p, root, e) {
  const J0 = solveSide(p), J = {}; for (const k in J0) J[k] = TR(J0[k], root);
  const hi = hiOf(e), o = [MQ3_DEFS];
  const red = m => hi[m] ? 'url(#mq3r)' : null;
  const op = m => hi[m] ? ' fill-opacity="' + (0.55 + 0.45 * hi[m]) + '"' : '';
  const mus = (pts, m) => hi[m] ? '<path d="' + pathOf(pts) + '" fill="url(#mq3r)"' + op(m) + ' stroke="#8e2a1c" stroke-width=".6"/>' : '';
  const T = [0.05, 0.25, 0.5, 0.75, 1];
  const THF = [10.5, 11.8, 11, 9, 6.8], THB = [11.5, 10.2, 9.2, 7.6, 6.4], SHF = [5.6, 4.8, 4.2, 3.7, 3.3], SHB = [6.2, 8.2, 6.8, 4.6, 3.4];
  const UAF = [6.6, 7.2, 6.6, 5.2, 4.6], UAB = [7, 7.4, 6.8, 5.4, 4.8], FAF = [5, 5.6, 4.6, 3.7, 3.2], FAB = [5, 5.2, 4.3, 3.5, 3];
  const leg = (hip, knee, ankle, toe, near) => {
    const g = near ? 'url(#mq3s)' : 'url(#mq3f)', r = [];
    r.push(sh3(limb3(knee, ankle, SHF, SHB), g));
    const fv = V2.nrm(V2.sub(toe, ankle)), fn = [-fv[1], fv[0]];
    r.push(sh3([V2.off(ankle, fv, -5), V2.off(V2.off(ankle, fn, -4), fv, 1), V2.off(toe, fn, -2.4), V2.off(toe, fv, 2), V2.off(toe, fn, 1.8), V2.off(ankle, fn, 4.5)], g));
    r.push(sh3(limb3(hip, knee, THF, THB), g));
    if (near) {
      r.push(mus(half3(hip, knee, THF, 0.1, 0.92, 1), 'quadricipiti'), mus(half3(hip, knee, THB, 0.14, 0.9, -1), 'femorali'), mus(half3(knee, ankle, SHB, 0.06, 0.62, -1, -0.1), 'polpacci'));
      const tv = V2.nrm(V2.sub(knee, hip)), ta = [tv[1], -tv[0]];
      r.push(line3([V2.off(V2.lerp(hip, knee, 0.2), ta, 3), V2.off(V2.lerp(hip, knee, 0.55), ta, 1.5), V2.off(V2.lerp(hip, knee, 0.9), ta, 2.5)]));
      r.push(line3([V2.off(V2.lerp(hip, knee, 0.3), ta, -5), V2.off(V2.lerp(hip, knee, 0.7), ta, -4.5)], 0.6));
      const sv = V2.nrm(V2.sub(ankle, knee)), sa = [sv[1], -sv[0]];
      r.push(line3([V2.off(V2.lerp(knee, ankle, 0.12), sa, -1), V2.off(V2.lerp(knee, ankle, 0.4), sa, -2.5), V2.off(V2.lerp(knee, ankle, 0.62), sa, -1.2)], 0.6));
      r.push(line3([V2.off(V2.lerp(knee, ankle, 0.1), sa, 2.5), V2.off(V2.lerp(knee, ankle, 0.75), sa, 1.5)], 0.5));
    }
    // pantaloncini sulla coscia
    r.push(sh3(limb3(V2.lerp(hip, knee, -0.02), V2.lerp(hip, knee, 0.3), [11, 12.2, 11.8, 11, 10.4], [12, 10.9, 10, 9.4, 9]), 'url(#mq3k)', 0.8));
    return r.join('');
  };
  const arm = (sh, el, hd, near) => {
    const g = near ? 'url(#mq3s)' : 'url(#mq3f)', r = [];
    r.push(sh3(limb3(sh, el, UAF, UAB), g));
    r.push(sh3(limb3(el, hd, FAF, FAB), g));
    r.push('<ellipse cx="' + f1(hd[0]) + '" cy="' + f1(hd[1]) + '" rx="4.6" ry="5" fill="' + g + '" stroke="' + MQ3.out + '" stroke-width=".8"/>');
    if (near) {
      r.push(mus(half3(sh, el, UAF, 0.22, 0.92, 1), 'bicipiti'), mus(half3(sh, el, UAB, 0.15, 0.88, -1), 'tricipiti'), mus(half3(el, hd, FAF, 0.04, 0.72, 1, -0.6), 'avambracci'));
      const uv = V2.nrm(V2.sub(el, sh)), ua = [uv[1], -uv[0]];
      r.push(line3([V2.off(V2.lerp(sh, el, 0.3), ua, 0.5), V2.off(V2.lerp(sh, el, 0.9), ua, 0)], 0.6));
      const fv = V2.nrm(V2.sub(hd, el)), fa = [fv[1], -fv[0]];
      r.push(line3([V2.off(V2.lerp(el, hd, 0.1), fa, 1), V2.off(V2.lerp(el, hd, 0.7), fa, 0.3)], 0.5));
      // deltoide
      const dl = [V2.off(sh, [Math.sin(rad(p.t)), Math.cos(rad(p.t))], 8), V2.off(sh, V2.nrm(V2.sub(sh, J.hip)), 6), V2.off(sh, [Math.sin(rad(p.t)), Math.cos(rad(p.t))], -8), V2.lerp(sh, el, 0.45)];
      r.push(hi.spalle ? mus(dl, 'spalle') : sh3(dl, g, 0.6));
    }
    return r.join('');
  };
  const fwd = [Math.sin(rad(p.t)), Math.cos(rad(p.t))];
  const along = (k, off) => [J.hip[0] + (J.shoulder[0] - J.hip[0]) * k + fwd[0] * off, J.hip[1] + (J.shoulder[1] - J.hip[1]) * k + fwd[1] * off];
  o.push(leg(J.hip, J.knee2, J.ankle2, J.toe2, false));
  o.push(arm(J.shoulder, J.elbow2, J.hand2, false));
  // busto
  const front = [[-0.08, 10.5], [0.12, 11.5], [0.34, 11], [0.55, 13], [0.7, 16.5], [0.84, 16.5], [0.96, 11.5], [1.06, 6.5]];
  const back = [[1.06, -7], [0.96, -13], [0.78, -15.5], [0.58, -13.5], [0.36, -10.5], [0.18, -12], [0.02, -14.5], [-0.12, -11]];
  o.push(sh3(front.map(([k, f]) => along(k, f)).concat(back.map(([k, f]) => along(k, f))), 'url(#mq3s)'));
  o.push(mus([along(0.6, 4), along(0.66, 14.5), along(0.84, 14.8), along(0.95, 9.5), along(0.88, 4)], 'petto'));
  o.push(mus([along(0.14, 3), along(0.18, 11), along(0.4, 10.4), along(0.56, 11.6), along(0.58, 3.5), along(0.36, 2.5)], 'addome'));
  o.push(mus([along(0.4, -4), along(0.5, -11.5), along(0.76, -14), along(0.92, -11), along(0.86, -4)], 'dorso'));
  o.push(line3([along(0.6, 13.5), along(0.66, 6), along(0.78, 3)], 0.7)); // sotto il pettorale
  o.push(line3([along(0.2, 9), along(0.38, 9.4), along(0.55, 10.5)], 0.6)); // addome laterale
  o.push(line3([along(0.3, 4), along(0.5, 2), along(0.62, 1)], 0.5)); // obliquo
  o.push(line3([along(0.45, -9), along(0.7, -12.5)], 0.6)); // dorsale
  // pantaloncini sul bacino
  o.push(sh3([along(0.2, 10.2), along(0.08, 10.4), along(-0.08, 9.6), along(-0.13, 0), along(-0.1, -10.8), along(0.04, -14), along(0.18, -11.8), along(0.2, 0)], 'url(#mq3k)', 0.8));
  o.push(mus([along(0.18, -4), along(0.06, -15), along(-0.08, -12), along(-0.06, -4)], 'glutei'));
  // collo e testa
  const tdir = V2.nrm(V2.sub(J.shoulder, J.hip)), nk = V2.off(J.shoulder, tdir, 1.5), hd = J.head;
  o.push(sh3(limb3(nk, V2.lerp(nk, hd, 0.75), [5.8, 5.4, 5, 4.8, 4.6], [6, 5.6, 5.2, 4.9, 4.7]), 'url(#mq3s)'));
  const hv = V2.nrm(V2.sub(hd, nk)), ang = Math.atan2(hv[1], hv[0]) * 180 / Math.PI + 90, fv = vec(p.n - 90, 1);
  o.push('<ellipse cx="' + f1(hd[0]) + '" cy="' + f1(hd[1]) + '" rx="9.6" ry="11.2" transform="rotate(' + f1(ang) + ' ' + f1(hd[0]) + ' ' + f1(hd[1]) + ')" fill="url(#mq3s)" stroke="' + MQ3.out + '" stroke-width=".9"/>');
  o.push(sh3([V2.off(V2.off(hd, hv, 1.5), fv, 8.8), V2.off(V2.off(hd, hv, -1.2), fv, 11.4), V2.off(V2.off(hd, hv, -3.4), fv, 8.6)], 'url(#mq3s)', 0.7));
  o.push('<ellipse cx="' + f1(hd[0] - fv[0] * 1.8 - hv[0]) + '" cy="' + f1(hd[1] - fv[1] * 1.8 - hv[1]) + '" rx="1.6" ry="2.5" fill="#a9aeb6" stroke="' + MQ3.out + '" stroke-width=".5"/>');
  o.push('<path d="M' + f1(hd[0] + fv[0] * 5 + hv[0] * 2) + ' ' + f1(hd[1] + fv[1] * 5 + hv[1] * 2) + ' l' + f1(fv[0] * 2.4) + ' ' + f1(fv[1] * 2.4) + '" stroke="#3a3f46" stroke-width="1.1" stroke-linecap="round"/>');
  o.push(leg(J.hip, J.knee, J.ankle, J.toe, true));
  o.push(arm(J.shoulder, J.elbow, J.hand, true));
  return { svg: o.join(''), J };
}

function drawFront3(p, root, e) {
  const J0 = solveFront(p), J = {}; for (const k in J0) J[k] = TR(J0[k], root);
  const hi = hiOf(e), o = [MQ3_DEFS];
  const mus = (pts, m) => hi[m] ? '<path d="' + pathOf(pts) + '" fill="url(#mq3r)" fill-opacity="' + (0.55 + 0.45 * hi[m]) + '" stroke="#8e2a1c" stroke-width=".6"/>' : '';
  const h = J.hip, s = J.sh, up = V2.nrm(V2.sub(s, h)), rt = [up[1] * -1 * -1, -up[0]].map((x, i) => i === 0 ? -up[1] : up[0]);
  const at = (k, dx) => [h[0] + (s[0] - h[0]) * k + rt[0] * dx, h[1] + (s[1] - h[1]) * k + rt[1] * dx];
  const THF = [10, 11, 10, 8.4, 6.6], SHF = [6, 7, 5.6, 4.2, 3.5], UAF = [6.8, 7.2, 6.4, 5.2, 4.6], FAF = [5.2, 5.6, 4.6, 3.7, 3.2];
  // gambe
  ['R', 'L'].forEach(sd => {
    const hp = J['hip' + sd], kn = J['knee' + sd], an = J['ankle' + sd], sg = sd === 'R' ? 1 : -1;
    o.push(sh3(limb3(kn, an, SHF, SHF), 'url(#mq3s)'));
    o.push(sh3([V2.off(an, [0, 1], -2), [an[0] + sg * 9, an[1] + 3.5], [an[0] + sg * 8, an[1] + 6.5], [an[0] - sg * 3.5, an[1] + 5.5]], 'url(#mq3s)', 0.7));
    o.push(sh3(limb3(hp, kn, THF, THF), 'url(#mq3s)'));
    o.push(mus(limb3(V2.lerp(hp, kn, 0.32), V2.lerp(hp, kn, 0.95), [6.5, 7.5, 7, 6, 4.5], [6.5, 7.5, 7, 6, 4.5]), hi.quadricipiti || !hi.femorali ? 'quadricipiti' : 'femorali'));
    o.push(mus(limb3(V2.lerp(kn, an, 0.08), V2.lerp(kn, an, 0.58), [4.2, 5, 4.4, 3.4, 2.4], [4.2, 5, 4.4, 3.4, 2.4]), 'polpacci'));
    o.push(line3([V2.lerp(hp, kn, 0.45), V2.lerp(hp, kn, 0.95)], 0.6), line3([V2.off(V2.lerp(hp, kn, 0.55), [sg, 0], 5), V2.off(V2.lerp(hp, kn, 0.92), [sg, 0], 3.5)], 0.5));
    o.push(sh3(limb3(V2.lerp(hp, kn, -0.05), V2.lerp(hp, kn, 0.42), [11.5, 12.2, 12, 11.6, 11.2], [11.5, 12.2, 12, 11.6, 11.2]), 'url(#mq3k)', 0.8));
  });
  // busto a V muscoloso
  const sw = 22 * (p.tS < 1 ? 0.9 : 1);
  o.push(sh3([at(1.05, 0), at(1, sw - 2), at(0.88, sw + 2), at(0.7, 17), at(0.45, 13.5), at(0.2, 13), at(0.02, 14), at(-0.1, 0), at(0.02, -14), at(0.2, -13), at(0.45, -13.5), at(0.7, -17), at(0.88, -sw - 2), at(1, -sw + 2)], 'url(#mq3s)'));
  [1, -1].forEach(sg => {
    const pec = [at(0.64, sg * 1), at(0.66, sg * 13), at(0.8, sg * 18.5), at(0.93, sg * 11), at(0.9, sg * 1)];
    o.push(hi.petto ? mus(pec, 'petto') : sh3(pec, 'url(#mq3s)', 0.6));
    o.push(mus([at(0.4, sg * 13.5), at(0.56, sg * 16), at(0.8, sg * 20), at(0.62, sg * 13)], 'dorso'));
    o.push(line3([at(0.18, sg * 10), at(0.4, sg * 12.5), at(0.6, sg * 13)], 0.6));
  });
  o.push(mus([at(0.14, -7), at(0.14, 7), at(0.6, 8), at(0.6, -8)], 'addome'));
  o.push(line3([at(0.14, 0), at(0.62, 0)], 0.7));
  [0.27, 0.4, 0.52].forEach(k => o.push(line3([at(k, -7.5), at(k + 0.01, 0), at(k, 7.5)], 0.6)));
  o.push(sh3([at(0.16, -13.4), at(0.16, 13.4), at(0.02, 14.6), at(-0.12, 10), at(-0.12, -10), at(0.02, -14.6)], 'url(#mq3k)', 0.8));
  // testa
  const hx = J.head[0] - s[0];
  o.push(sh3(limb3(V2.off(s, up, -2), V2.off(s, up, 10), [5.4, 5.2, 5, 4.9, 4.8], [5.4, 5.2, 5, 4.9, 4.8]), 'url(#mq3s)'));
  o.push(sh3([at(1.02, -16), at(1.12, -5), at(1.12, 5), at(1.02, 16), at(0.98, 0)], 'url(#mq3s)', 0.6)); // trapezi
  o.push('<ellipse cx="' + f1(J.head[0]) + '" cy="' + f1(J.head[1]) + '" rx="9.4" ry="11.4" fill="url(#mq3s)" stroke="' + MQ3.out + '" stroke-width=".9"' + (hx ? ' transform="rotate(' + f1(hx * 2.2) + ' ' + f1(J.head[0]) + ' ' + f1(J.head[1]) + ')"' : '') + '/>');
  // braccia
  ['R', 'L'].forEach(sd => {
    const sh = J['shoulder' + sd], el = J['elbow' + sd], hd = J['hand' + sd];
    o.push(sh3(limb3(sh, el, UAF, UAF), 'url(#mq3s)'));
    o.push(sh3(limb3(el, hd, FAF, FAF), 'url(#mq3s)'));
    o.push('<ellipse cx="' + f1(hd[0]) + '" cy="' + f1(hd[1]) + '" rx="4.6" ry="5" fill="url(#mq3s)" stroke="' + MQ3.out + '" stroke-width=".8"/>');
    o.push(mus(limb3(V2.lerp(sh, el, 0.25), V2.lerp(sh, el, 0.9), [4.4, 5, 4.6, 3.8, 3], [4.4, 5, 4.6, 3.8, 3]), hi.bicipiti ? 'bicipiti' : 'tricipiti'));
    o.push(mus(limb3(V2.lerp(el, hd, 0.06), V2.lerp(el, hd, 0.7), [3.6, 4, 3.4, 2.8, 2.2], [3.6, 4, 3.4, 2.8, 2.2]), 'avambracci'));
    const dl = limb3(V2.off(sh, up, 2), V2.lerp(sh, el, 0.38), [7.6, 8, 7, 5.6, 4], [7.6, 8, 7, 5.6, 4]);
    o.push(hi.spalle ? mus(dl, 'spalle') : sh3(dl, 'url(#mq3s)', 0.6));
  });
  return { svg: o.join(''), J };
}
