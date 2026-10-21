/* GYM — figura del corpo con muscoli e grafici SVG */
'use strict';

/* Figura anatomica fronte/retro. Ogni muscolo ha data-m. Metà sinistra disegnata e specchiata. */
function smoothPath(pts, closed) {
  const n = pts.length, P = i => pts[(i + n) % n];
  let d = 'M' + pts[0][0] + ' ' + pts[0][1];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - (closed || i ? p0[0] : p1[0])) / 6, p1[1] + (p2[1] - (closed || i ? p0[1] : p1[1])) / 6];
    const c2 = [p2[0] - ((closed || i < n - 2 ? p3[0] : p2[0]) - p1[0]) / 6, p2[1] - ((closed || i < n - 2 ? p3[1] : p2[1]) - p1[1]) / 6];
    d += ' C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + p2[0] + ' ' + p2[1];
  }
  return d + (closed ? 'Z' : '');
}
const mirrorPts = pts => pts.map(p => [120 - p[0], p[1]]);

/* contorno (metà destra della figura vista di fronte, x da 0 a 60) */
const SIL_HALF = [[60, 41], [53, 42], [52, 50], [44, 54], [34, 57], [26, 61], [21, 70], [19.5, 82], [18.5, 96], [17, 110], [15.5, 122], [14.5, 128], [12.5, 140], [11, 154], [11, 166], [11.5, 174], [9.5, 182], [9.5, 192], [12.5, 199], [17, 200.5], [20, 194], [21, 184], [22, 175], [23, 162], [25, 148], [27, 134], [28.5, 126], [30, 114], [31, 100], [34, 89], [35, 101], [36.5, 115], [38, 128], [37, 140], [35, 152], [33, 166], [32, 184], [33.5, 206], [36.5, 226], [37.5, 238], [36, 252], [37, 268], [40, 284], [43, 296], [41, 304], [43, 311], [52, 312], [55, 308], [54, 298], [54, 290], [55, 272], [56, 256], [55, 240], [56, 228], [57.5, 206], [59, 186], [60, 175]];
const SILHOUETTE = smoothPath(SIL_HALF.concat(mirrorPts(SIL_HALF.slice(1, -1)).reverse()), true);
const HEAD = 'M60 3 C69 3 74 10 74 19 C74 26 72 31 69 35 C66 39 63 41 60 41 C57 41 54 39 51 35 C48 31 46 26 46 19 C46 10 51 3 60 3 Z';

/* [muscolo, contorno, fibre] — 'x' = muscolo non selezionabile */
const MUSCLES_FRONT = [
  ['dorso', [[53, 43], [52, 50], [44, 54], [50, 54.5], [56, 50]]],
  ['spalle', [[43, 55.5], [34, 58], [26.5, 62], [22.5, 71], [21.5, 84], [25, 93], [29, 87], [32, 75], [37, 64]], [[[39, 58], [27, 80]], [[34, 60], [24, 86]]]],
  ['petto', [[59, 60], [48, 58.5], [40, 60.5], [35, 66], [33.5, 76], [35.5, 86], [42, 92], [52, 94], [59, 90]], [[[58, 63], [37, 70]], [[58, 70], [35.5, 78]], [[58, 78], [37, 85]], [[58, 85], [43, 90]]]],
  ['x', [[37, 94], [42, 92.5], [42, 98], [37.5, 99]]], ['x', [[37.5, 101], [42, 100], [42, 105], [38, 106]]],
  ['bicipiti', [[30.5, 90], [25.5, 94], [22.5, 104], [22.5, 116], [26, 121], [30, 112], [32, 100]], [[[28, 94], [24.5, 116]]]],
  ['bicipiti', [[22, 117], [20, 123], [25, 127], [27, 121]]],
  ['avambracci', [[24.5, 128], [17.5, 131.5], [14.5, 143], [13.5, 157], [15.5, 170], [20, 170], [23, 156], [26, 140]], [[[21, 132], [16, 166]], [[24, 134], [19, 168]]]],
  ['addome', [[52.5, 97], [59, 97], [59, 108], [52.5, 108]]],
  ['addome', [[52.5, 111], [59, 111], [59, 122], [52.5, 122]]],
  ['addome', [[52.5, 125], [59, 125], [59, 136], [52.5, 136.5]]],
  ['addome', [[52.5, 139.5], [59, 139.5], [59, 162], [55, 156]]],
  ['addome', [[50, 98], [41.5, 100.5], [39, 112], [39.5, 128], [42, 142], [50, 151], [51, 128]], [[[48, 104], [41, 122]], [[49, 118], [42, 136]]]],
  ['x', [[42, 160], [44.5, 161], [56, 210], [54, 213]]],
  ['quadricipiti', [[45.5, 166], [38.5, 170], [35, 186], [35.5, 206], [38.5, 222], [43.5, 230], [46, 212], [46.5, 190]], [[[42, 172], [39, 220]]]],
  ['quadricipiti', [[52, 164], [47.5, 168], [46.5, 190], [47.5, 214], [51, 221], [54, 200], [55.5, 180]], [[[51, 168], [50, 216]]]],
  ['quadricipiti', [[56, 206], [51.5, 213], [51.5, 225], [55.5, 230], [58, 219]]],
  ['x', [[59, 176], [55.5, 179], [55, 198], [58.5, 193]]],
  ['polpacci', [[46, 244], [43.5, 250], [43.5, 271], [46, 286], [48, 285], [48.5, 262]], [[[46, 250], [46.5, 282]]]],
  ['polpacci', [[54, 244], [51, 252], [51, 270], [54, 276], [55.5, 260]]],
  ['polpacci', [[40.5, 246], [37.5, 258], [39.5, 276], [42, 270], [42.5, 252]]]
];
const MUSCLES_BACK = [
  ['dorso', [[60, 42], [54, 43], [46, 52.5], [38, 58], [46, 64], [54, 82], [60, 112]], [[[58, 48], [44, 60]], [[59, 70], [48, 64]], [[59, 92], [52, 76]]]],
  ['spalle', [[42, 56], [33.5, 58], [25.5, 63], [21.5, 74], [22, 86], [27.5, 89], [32.5, 77], [38, 65]], [[[36, 60], [25, 82]]]],
  ['dorso', [[46.5, 66], [38.5, 66.5], [34.5, 74], [38, 84], [46, 86], [50, 76]], [[[47, 70], [37, 80]]]],
  ['dorso', [[52, 88], [45, 86.5], [36, 87], [35, 100], [39, 118], [46, 132], [55, 137], [58, 120], [56, 104]], [[[50, 92], [40, 116]], [[55, 100], [46, 128]]]],
  ['dorso', [[59, 113], [55, 117], [54, 141], [59, 147]]],
  ['tricipiti', [[31, 88], [25, 92], [21.5, 104], [21.5, 116], [25, 121], [29, 110], [32, 98]], [[[27, 94], [23.5, 116]]]],
  ['tricipiti', [[33, 94], [30.5, 104], [29.5, 118], [31.5, 121], [33.5, 108]]],
  ['avambracci', [[24.5, 128], [17.5, 131.5], [14.5, 143], [13.5, 157], [15.5, 170], [20, 170], [23, 156], [26, 140]], [[[21, 132], [16, 166]]]],
  ['glutei', [[52, 140], [41, 140], [35.5, 150], [38, 160], [48, 155]]],
  ['glutei', [[59, 150], [48, 152], [38.5, 160], [36, 174], [42, 185], [52, 187], [59, 183]], [[[57, 156], [40, 176]], [[58, 168], [44, 182]]]],
  ['femorali', [[46.5, 190], [38.5, 194], [36, 210], [39.5, 226], [44.5, 232], [47, 214]], [[[43, 196], [41.5, 226]]]],
  ['femorali', [[56, 190], [48.5, 192], [48, 214], [51, 230], [55, 226], [57, 206]], [[[52.5, 196], [52, 226]]]],
  ['x', [[59, 187], [57, 191], [57, 207], [59, 205]]],
  ['polpacci', [[46, 240], [39.5, 246], [37.5, 260], [41, 277], [46, 271], [47.5, 254]], [[[43.5, 246], [42, 272]]]],
  ['polpacci', [[49.5, 240], [48.5, 256], [50.5, 274], [54.5, 268], [55.5, 250]], [[[52, 246], [52, 270]]]],
  ['x', [[46.5, 280], [44.5, 292], [49, 292], [49.5, 280]]]
];

/* tratteggio delle fibre: linee parallele all'asse principale del muscolo, ritagliate sulla sua forma */
let _bodyN = 0;
function hatch(pts, d, gap) {
  const n = pts.length, cx = pts.reduce((a, p) => a + p[0], 0) / n, cy = pts.reduce((a, p) => a + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0; pts.forEach(p => { const x = p[0] - cx, y = p[1] - cy; sxx += x * x; syy += y * y; sxy += x * y; });
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), dx = Math.cos(th), dy = Math.sin(th), nx = -dy, ny = dx;
  let dmin = 1e9, dmax = -1e9, nmin = 1e9, nmax = -1e9;
  pts.forEach(p => { const x = p[0] - cx, y = p[1] - cy, a = x * dx + y * dy, b = x * nx + y * ny; dmin = Math.min(dmin, a); dmax = Math.max(dmax, a); nmin = Math.min(nmin, b); nmax = Math.max(nmax, b); });
  const id = 'mc' + (++_bodyN); let lines = '';
  const g = gap || 2.3;
  for (let t = nmin + g * 0.6; t < nmax - g * 0.3; t += g) {
    const bend = (t - (nmin + nmax) / 2) * 0.08;
    const x1 = cx + nx * t + dx * (dmin - 2), y1 = cy + ny * t + dy * (dmin - 2), x2 = cx + nx * t + dx * (dmax + 2), y2 = cy + ny * t + dy * (dmax + 2);
    const mx = (x1 + x2) / 2 + nx * bend * 4, my = (y1 + y2) / 2 + ny * bend * 4;
    lines += 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' ';
  }
  return '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><path d="' + lines + '" class="fib" clip-path="url(#' + id + ')"/>';
}

/* ingrandisce leggermente un muscolo attorno al suo centro: i muscoli si toccano come in un corpo vero */
function grow(pts, k) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
}
const BODY_STYLES = {
  davinci: { n: 'Leonardo', d: 'Tavola anatomica rinascimentale: pergamena, inchiostro seppia, muscolo allenato a sanguigna.' },
  ibrido: { n: 'Rilievo pulito', d: 'Muscoli in rilievo con ombre, forme pulite senza linee.' },
  atlante: { n: 'Atlante a china', d: 'Tavola anatomica disegnata: fondo chiaro, contorni e fibre a inchiostro.' },
  realistico: { n: 'Realistico', d: 'Muscoli in rilievo con ombre, effetto 3D su fondo scuro.' },
  minimal: { n: 'Minimal', d: 'Forme piatte e pulite, colori pieni, senza linee.' },
  neon: { n: 'Neon', d: 'Contorni sottili al buio, il muscolo allenato si illumina.' }
};
function bodyStyle() { return (typeof S !== 'undefined' && S.settings && S.settings.bodyStyle) || 'ibrido'; }

/* ===== Stile Leonardo: pergamena, inchiostro seppia, tratteggio, sanguigna ===== */
function hatchLines(pts, angleOff, gap, ext) {
  const n = pts.length, cx = pts.reduce((a, p) => a + p[0], 0) / n, cy = pts.reduce((a, p) => a + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0; pts.forEach(p => { const x = p[0] - cx, y = p[1] - cy; sxx += x * x; syy += y * y; sxy += x * y; });
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy) + (angleOff || 0), dx = Math.cos(th), dy = Math.sin(th), nx = -dy, ny = dx;
  let dmin = 1e9, dmax = -1e9, nmin = 1e9, nmax = -1e9;
  pts.forEach(p => { const x = p[0] - cx, y = p[1] - cy, a = x * dx + y * dy, b = x * nx + y * ny; dmin = Math.min(dmin, a); dmax = Math.max(dmax, a); nmin = Math.min(nmin, b); nmax = Math.max(nmax, b); });
  let d = '';
  for (let t = nmin + gap * 0.5; t < nmax; t += gap) {
    const w = (Math.sin(t * 7.3) * 0.5) * (ext || 1);
    d += 'M' + (cx + nx * t + dx * (dmin - 3)).toFixed(1) + ' ' + (cy + ny * t + dy * (dmin - 3)).toFixed(1) + ' Q' + (cx + nx * (t + w) + dx * (dmin + dmax) / 2).toFixed(1) + ' ' + (cy + ny * (t + w) + dy * (dmin + dmax) / 2).toFixed(1) + ' ' + (cx + nx * t + dx * (dmax + 3)).toFixed(1) + ' ' + (cy + ny * t + dy * (dmax + 3)).toFixed(1) + ' ';
  }
  return d;
}
function daVinciSvg(fill, opts) {
  const u = ++_bodyN, R = 'rf' + u, EM = 'em' + u;
  let defs = '<filter id="' + R + '" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.85" xChannelSelector="R" yChannelSelector="G"/></filter>' +
    '<filter id="pp' + u + '"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0.38  0 0 0 0 0.25  0 0 0 0 0.1  0 0 0 0.16 0"/></filter>' +
    '<filter id="st' + u + '"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.12  0 0 0 0.22 -0.06"/></filter>' +
    '<radialGradient id="pg' + u + '" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#f3e6c8"/><stop offset=".7" stop-color="#e8d3a6"/><stop offset="1" stop-color="#cfb27c"/></radialGradient>' +
    '<radialGradient id="' + EM + 'g" cx="50%" cy="50%" r="55%"><stop offset=".45" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>' +
    '<mask id="' + EM + '" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#' + EM + 'g)"/></mask>' +
    '<radialGradient id="sg' + u + '" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#c8643f"/><stop offset="1" stop-color="#9b3d22"/></radialGradient>';
  const figure = (ox, list, back, fid) => {
    const clip = 'dc' + u + fid;
    let g = '<g transform="translate(' + (ox + 60) + ',0) scale(1.14,1) translate(-60,0)"><clipPath id="' + clip + '"><path d="' + SILHOUETTE + '"/><path d="' + HEAD + '"/></clipPath>';
    // ombreggiatura generale del corpo sui bordi (tratteggio incrociato)
    g += '<g clip-path="url(#' + clip + ')"><g mask="url(#' + EM + ')"><path d="' + hatchLines(SIL_HALF.concat(mirrorPts(SIL_HALF)), 0.9, 1.5) + '" class="dv-x"/></g></g>';
    g += '<g filter="url(#' + R + ')">';
    list.forEach(([m, pts]) => {
      const r = m !== 'x' ? fill(m) : null, dm = m !== 'x' ? ' data-m="' + m + '"' : '';
      [pts, mirrorPts(pts)].forEach(P0 => {
        const P = grow(P0, 1.1), d = smoothPath(P, true), cid = 'dm' + u + '_' + (++_bodyN);
        g += '<clipPath id="' + cid + '"><path d="' + d + '"/></clipPath>';
        g += '<path' + dm + ' d="' + d + '" class="dv-mu' + (r ? ' on' : '') + '" fill="' + (r ? 'url(#sg' + u + ')' : 'rgba(255,250,235,0.01)') + '"' + (r ? ' fill-opacity="' + (0.35 + 0.55 * (r.op == null ? 1 : r.op)) + '"' : '') + '/>';
        if (!opts.mini) {
          g += '<path d="' + hatchLines(P, 0, 1.9) + '" class="dv-f" clip-path="url(#' + cid + ')"/>';
          g += '<g clip-path="url(#' + cid + ')"><g mask="url(#' + EM + ')"><path d="' + hatchLines(P, 1.05, 1.4) + '" class="dv-x"/></g></g>';
        }
      });
    });
    // contorno e dettagli anatomici
    g += '<path d="' + SILHOUETTE + '" class="dv-out"/><path d="' + HEAD + '" class="dv-out"/>';
    if (!back) {
      g += '<path d="M44 53.5 Q51 50.5 58 54.5 M76 53.5 Q69 50.5 62 54.5 M60 56 L60 92 M57.5 152 q2.5 2.4 5 0 M52 21 q3 -1.8 6 0 M62 21 q3 -1.8 6 0 M53 23.5 q2 1 4 0 M63 23.5 q2 1 4 0 M60 22 Q58.5 26.5 59 28.8 Q60.5 29.6 62 28.6 M56.3 32.6 q3.7 1.6 7.4 0 M57.3 34 q2.7 1 5.4 0 M47 9 Q60 1 73 9" class="dv-d"/>';
      g += '<path d="M43.5 231 q3.5 -4 7 0 q0.5 5 -3.5 7.5 q-4 -2.5 -3.5 -7.5 Z M76.5 231 q-3.5 -4 -7 0 q-0.5 5 3.5 7.5 q4 -2.5 3.5 -7.5 Z" class="dv-d"/>';
      g += '<path d="M44 290 q-2 3 0 5 M76 290 q2 3 0 5 M37.5 104 q2 2 4 1 M37.5 110 q2 2 4 1 M82.5 104 q-2 2 -4 1 M82.5 110 q-2 2 -4 1" class="dv-d"/>';
    } else {
      g += '<path d="M42 60 Q36 70 41 84 Q47 78 50 66 Z M78 60 Q84 70 79 84 Q73 78 70 66 Z M48 14 C52 4 68 4 72 14 M47 9 Q60 0 73 9 M50 37 Q60 41 70 37" class="dv-d"/>';
      for (let y = 46; y <= 146; y += 6.5) g += '<path d="M58.6 ' + y + ' q1.4 -1.4 2.8 0 q-1.4 1.6 -2.8 0" class="dv-d"/>';
      g += '<path d="M44 293 q-1 -6 2 -10 M76 293 q1 -6 -2 -10" class="dv-d"/>';
    }
    g += '<path d="M12 184 L11.5 193 M14.5 186 L14.5 197 M17.5 186 L17.8 197 M108 184 L108.5 193 M105.5 186 L105.5 197 M102.5 186 L102.2 197 M44 308 L44.5 311 M47.5 309 L47.8 312 M76 308 L75.5 311 M72.5 309 L72.2 312" class="dv-d"/>';
    return g + '</g></g>';
  };
  const W = 290, H = opts.mini ? 318 : 352;
  const paper = '<rect x="-14" y="-2" width="' + W + '" height="' + H + '" rx="10" fill="url(#pg' + u + ')"/><rect x="-14" y="-2" width="' + W + '" height="' + H + '" rx="10" filter="url(#st' + u + ')"/><rect x="-14" y="-2" width="' + W + '" height="' + H + '" rx="10" filter="url(#pp' + u + ')"/>';
  const lbl = opts.mini ? '' : '<text x="60" y="334" text-anchor="middle" class="dv-l">Fronte</text><text x="202" y="334" text-anchor="middle" class="dv-l">Retro</text>';
  return '<svg class="body-svg bs-davinci' + (opts.click ? ' clickable' : '') + (opts.mini ? ' mini' : '') + '" viewBox="-14 -2 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' + paper +
    figure(0, MUSCLES_FRONT, false, 'f') + figure(142, MUSCLES_BACK, true, 'b') + lbl + '</svg>';
}

function bodySvg(fill, opts) {
  opts = opts || {};
  // figura v2 (stile scelto: vettoriale)
  if (typeof bodySvg2 === 'function') return bodySvg2(m => { const r = fill(m); return r ? { op: r.op } : null; }, Object.assign({ style: (typeof S !== 'undefined' && S.settings && S.settings.body2) || 'realistico' }, opts));
  const st = opts.style || bodyStyle(), uid0 = ++_bodyN;
  if (st === 'davinci') return daVinciSvg(fill, opts);
  const sel = m => fill(m) || null;
  const K = st === 'minimal' ? 1.04 : st === 'ibrido' ? 1.12 : 1.13;
  const real = st === 'realistico' || st === 'ibrido';
  let defs = '';
  if (real) {
    defs += '<radialGradient id="rg' + uid0 + '" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="var(--mu-hi)"/><stop offset="1" stop-color="var(--mu-lo)"/></radialGradient>' +
      '<radialGradient id="ra' + uid0 + '" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="var(--acc-hi)"/><stop offset="1" stop-color="var(--accent)"/></radialGradient>' +
      '<linearGradient id="rs' + uid0 + '" x1="0" x2="1"><stop offset="0" stop-color="var(--sk-lo)"/><stop offset=".5" stop-color="var(--sk-hi)"/><stop offset="1" stop-color="var(--sk-lo)"/></linearGradient>';
  }
  if (st === 'neon') defs += '<filter id="gl' + uid0 + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  const figure = (ox, list, back, fid) => {
    const clip = 'cl' + uid0 + fid;
    // corpo più atletico: un po' più largo
    let g = '<g transform="translate(' + (ox + 60) + ',0) scale(1.14,1) translate(-60,0)"><clipPath id="' + clip + '"><path d="' + SILHOUETTE + '"/></clipPath>';
    g += '<path d="' + SILHOUETTE + '" class="sil"' + (real ? ' fill="url(#rs' + uid0 + ')"' : '') + '/><path d="' + HEAD + '" class="sil head"' + (real ? ' fill="url(#rs' + uid0 + ')"' : '') + '/>';
    g += '<g clip-path="url(#' + clip + ')">';
    list.forEach(([m, pts]) => {
      const r = m !== 'x' ? sel(m) : null, dm = m !== 'x' ? ' data-m="' + m + '"' : '';
      [pts, mirrorPts(pts)].forEach(P0 => {
        const P = grow(P0, K), d = smoothPath(P, true);
        let fillA;
        if (r) fillA = real ? 'fill="url(#ra' + uid0 + ')" fill-opacity="' + (r.op == null ? 1 : r.op) + '"' : 'fill="' + (r.color || 'var(--accent)') + '" fill-opacity="' + (r.op == null ? 1 : r.op) + '"';
        else fillA = real ? 'fill="url(#rg' + uid0 + ')"' : st === 'neon' ? 'fill="transparent"' : '';
        g += '<path' + dm + ' d="' + d + '" ' + fillA + ' class="mu' + (r ? ' on' : '') + '"' + (st === 'neon' && r ? ' filter="url(#gl' + uid0 + ')"' : '') + '/>';
        if (!opts.mini && (st === 'atlante' || st === 'realistico')) g += hatch(P, d, st === 'atlante' ? 2.3 : 3.2);
      });
    });
    g += '</g>';
    if (!opts.mini && st !== 'minimal' && st !== 'ibrido') {
      if (back) { for (let y = 47; y <= 146; y += 7.5) g += '<circle cx="60" cy="' + y + '" r="0.9" class="dot"/>'; }
      else g += '<path d="M52 21 q3 -1.6 6 0 M62 21 q3 -1.6 6 0 M60 23 L59 28.5 L61 28.5 M56.5 32.5 q3.5 1.8 7 0" class="ink thin"/>';
      g += '<path d="M12 184 L11.5 193 M14.5 186 L14.5 197 M17.5 186 L17.8 197 M108 184 L108.5 193 M105.5 186 L105.5 197 M102.5 186 L102.2 197" class="ink thin"/>';
    }
    g += '<path d="' + SILHOUETTE + '" class="outline"/><path d="' + HEAD + '" class="outline"/>';
    return g + '</g>';
  };
  const lbl = (x, t) => opts.mini ? '' : '<text x="' + x + '" y="330" text-anchor="middle" class="svg-lbl">' + t + '</text>';
  return '<svg class="body-svg bs-' + st + (opts.click ? ' clickable' : '') + (opts.mini ? ' mini' : '') + '" viewBox="' + (opts.mini ? '-14 -2 290 318' : '-14 -2 290 340') + '" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' +
    figure(0, MUSCLES_FRONT, false, 'f') + figure(142, MUSCLES_BACK, true, 'b') + lbl(60, 'Fronte') + lbl(202, 'Retro') + '</svg>';
}

/* evidenzia muscoli di un esercizio */
function exerciseBody(e) {
  return bodySvg(m => m === e.m ? { color: 'var(--accent)', op: 1 } : e.s.includes(m) ? { color: 'var(--accent)', op: 0.4 } : null);
}

/* mappa di calore */
function heatBody(load, mini) {
  const max = Math.max(1, ...Object.values(load));
  return bodySvg(m => load[m] ? { color: 'var(--accent)', op: 0.25 + 0.75 * Math.min(1, load[m] / max) } : null, { mini });
}

/* grafico a linee: points [{x:time, y:value}] */
function lineChart(points, opts) {
  opts = opts || {};
  const W = 340, H = 180, P = { l: 38, r: 10, t: 12, b: 24 };
  if (!points.length) return '<div class="empty small">Ancora nessun dato</div>';
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 864e5; x1 += 864e5; }
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const pad = (y1 - y0) * 0.15 || Math.max(1, y1 * 0.05); y0 -= pad; y1 += pad;
  const X = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), Y = y => H - P.b - (y - y0) / (y1 - y0) * (H - P.t - P.b);
  const d = points.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
  const area = d + ' L' + X(points[points.length - 1].x).toFixed(1) + ' ' + (H - P.b) + ' L' + X(points[0].x).toFixed(1) + ' ' + (H - P.b) + ' Z';
  const grid = [0, 0.5, 1].map(k => { const v = y0 + (y1 - y0) * k, y = Y(v); return '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (P.l - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="axis">' + fmtKg(Math.round(v * 10) / 10) + '</text>'; }).join('');
  const dots = points.map(p => '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="3" class="dot"/>').join('');
  const xl = '<text x="' + P.l + '" y="' + (H - 6) + '" class="axis">' + fmtDate(x0 + (points.length === 1 ? 864e5 : 0)) + '</text><text x="' + (W - P.r) + '" y="' + (H - 6) + '" text-anchor="end" class="axis">' + fmtDate(points.length === 1 ? x1 - 864e5 : x1) + '</text>';
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '">' + grid + '<path d="' + area + '" class="area"/><path d="' + d + '" class="line"/>' + dots + xl + '</svg>';
}

/* grafico a barre: bars [{label, value}] */
function barChart(bars, opts) {
  opts = opts || {};
  const W = 340, H = 160, P = { l: 8, r: 8, t: 16, b: 22 };
  const max = Math.max(1, ...bars.map(b => b.value));
  const bw = (W - P.l - P.r) / bars.length;
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '">' + bars.map((b, i) => {
    const h = (H - P.t - P.b) * b.value / max, x = P.l + i * bw + bw * 0.18, y = H - P.b - h;
    return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="4" class="' + (b.hi ? 'bar hi' : 'bar') + '"/>' +
      (b.value ? '<text x="' + (x + bw * 0.32).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle" class="axis">' + (opts.fmt ? opts.fmt(b.value) : b.value) + '</text>' : '') +
      '<text x="' + (x + bw * 0.32).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="axis">' + b.label + '</text>';
  }).join('') + '</svg>';
}

/* immagini negli esercizi: 'mappa' (solo muscoli), 'mappa_anim' (muscoli + animazione a richiesta), 'omino' (come prima) */
const mediaMode = () => (typeof S !== 'undefined' && S.settings && S.settings.media) || 'omino';
const BACK_MUSCLES = ['dorso', 'glutei', 'femorali', 'tricipiti', 'polpacci'];
const LOW_MUSCLES = ['quadricipiti', 'femorali', 'glutei', 'polpacci'];
/* miniatura: la parte del corpo con il muscolo allenato */
function muscleThumb(id) {
  const e = EX[id]; if (!e) return '';
  const svg = bodySvg(m => m === e.m ? { op: 1 } : e.s.includes(m) ? { op: 0.4 } : null, { mini: true });
  const x = BACK_MUSCLES.includes(e.m) ? 220 : 0, y = LOW_MUSCLES.includes(e.m) ? 236 : 52;
  return svg.replace(/viewBox="[^"]*"/, 'viewBox="' + (x + 10) + ' ' + y + ' 180 200"').replace('class="body-svg', 'class="body-svg mthumb');
}
