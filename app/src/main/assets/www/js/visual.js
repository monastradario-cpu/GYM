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

/* contorno (metà sinistra, dall'alto del collo al cavallo) */
const SIL_HALF = [[60, 37], [53, 38], [52, 47], [44, 52], [33, 55], [25, 61], [21, 72], [20, 86], [17, 102], [15, 118], [13, 136], [12, 152], [10, 164], [11, 176], [16, 181], [20, 172], [21, 160], [24, 140], [27, 122], [30, 104], [33, 90], [35, 104], [37, 122], [34, 140], [32, 160], [33, 190], [36, 214], [37, 226], [35, 246], [38, 268], [42, 284], [38, 294], [44, 299], [54, 298], [53, 286], [54, 266], [55, 246], [55, 228], [56, 210], [58, 186], [60, 166]];
const SILHOUETTE = smoothPath(SIL_HALF.concat(mirrorPts(SIL_HALF.slice(1, -1)).reverse()), true);

const MUSCLES_FRONT = [
  ['dorso', [[53, 41], [52, 48], [43, 53], [48, 54], [54, 51]]],                                   // trapezio (vista frontale)
  ['spalle', [[42, 54], [32, 57], [24, 64], [21, 76], [23, 88], [29, 82], [33, 71], [38, 62]]],      // deltoide
  ['petto', [[58, 58], [46, 57], [37, 62], [33, 72], [34, 82], [42, 89], [52, 90], [58, 86]]],       // pettorale
  ['bicipiti', [[30, 86], [25, 90], [21, 102], [21, 114], [26, 117], [30, 106], [32, 94]]],
  ['avambracci', [[21, 121], [16, 128], [14, 142], [15, 156], [20, 156], [24, 140], [26, 126]]],
  ['addome', [[52, 93], [59, 93], [59, 104], [52, 104]]],
  ['addome', [[52, 107], [59, 107], [59, 118], [52, 118]]],
  ['addome', [[52, 121], [59, 121], [59, 132], [52, 133]]],
  ['addome', [[52, 136], [59, 136], [59, 154], [54, 150]]],
  ['addome', [[49, 94], [41, 92], [37, 104], [38, 120], [42, 134], [49, 140], [50, 118]]],           // obliqui
  ['quadricipiti', [[50, 152], [40, 150], [35, 164], [35, 190], [39, 212], [45, 220], [50, 206], [54, 184], [55, 166]]],
  ['quadricipiti', [[55, 196], [50, 208], [50, 220], [55, 224], [57, 212]]],                          // vasto mediale
  ['adduttori', [[59, 160], [56, 166], [55, 186], [58, 182]]],
  ['polpacci', [[40, 232], [37, 248], [39, 266], [44, 272], [47, 254], [46, 236]]],                    // tibiale/polpaccio
  ['polpacci', [[52, 234], [50, 250], [52, 264], [54, 248]]]
];
const MUSCLES_BACK = [
  ['dorso', [[60, 40], [53, 42], [42, 53], [47, 60], [55, 72], [60, 96]]],                           // trapezio
  ['spalle', [[41, 55], [31, 58], [24, 65], [21, 78], [24, 88], [30, 80], [35, 68]]],                 // deltoide posteriore
  ['dorso', [[47, 63], [38, 66], [35, 80], [37, 98], [43, 118], [52, 124], [57, 110], [56, 92], [53, 76]]], // gran dorsale
  ['dorso', [[59, 112], [54, 118], [53, 136], [59, 140]]],                                           // lombari
  ['tricipiti', [[31, 86], [25, 89], [20, 102], [21, 116], [27, 118], [31, 104], [33, 92]]],
  ['avambracci', [[21, 121], [16, 128], [14, 142], [15, 156], [20, 156], [24, 140], [26, 126]]],
  ['glutei', [[59, 142], [48, 138], [38, 146], [35, 160], [40, 172], [50, 175], [59, 170]]],
  ['femorali', [[57, 178], [45, 177], [37, 188], [37, 206], [42, 220], [49, 222], [54, 210], [57, 194]]],
  ['polpacci', [[46, 228], [39, 234], [37, 250], [40, 266], [45, 262], [47, 246]]],
  ['polpacci', [[49, 228], [48, 246], [50, 262], [54, 256], [55, 238]]]
];

function bodySvg(fill, opts) {
  opts = opts || {};
  const f = m => { const r = fill(m) || {}; return 'fill="' + (r.color || 'var(--muscle)') + '" fill-opacity="' + (r.op == null ? 1 : r.op) + '"'; };
  const figure = (ox, list, back) => {
    let g = '<g transform="translate(' + ox + ',0)">';
    g += '<ellipse cx="60" cy="21" rx="12.5" ry="15" fill="var(--body)"/>';
    g += '<path d="' + SILHOUETTE + '" fill="var(--body)"/>';
    list.forEach(([m, pts]) => {
      const dm = m === 'adduttori' ? '' : ' data-m="' + m + '"';
      const attr = m === 'adduttori' ? 'fill="var(--muscle)"' : f(m);
      g += '<path' + dm + ' d="' + smoothPath(pts, true) + '" ' + attr + ' class="mu"/>';
      g += '<path' + dm + ' d="' + smoothPath(mirrorPts(pts), true) + '" ' + attr + ' class="mu"/>';
    });
    if (!back) g += '<path d="M60 92 L60 156" stroke="var(--body)" stroke-width="1.5"/>';
    else g += '<path d="M60 96 L60 140" stroke="var(--body)" stroke-width="1.5"/>';
    return g + '</g>';
  };
  const lbl = (x, t) => '<text x="' + x + '" y="318" text-anchor="middle" class="svg-lbl">' + t + '</text>';
  return '<svg class="body-svg' + (opts.click ? ' clickable' : '') + '" viewBox="0 0 260 326" xmlns="http://www.w3.org/2000/svg">' +
    figure(0, MUSCLES_FRONT, false) + figure(140, MUSCLES_BACK, true) + lbl(60, 'Fronte') + lbl(200, 'Retro') + '</svg>';
}

/* evidenzia muscoli di un esercizio */
function exerciseBody(e) {
  return bodySvg(m => m === e.m ? { color: 'var(--accent)', op: 1 } : e.s.includes(m) ? { color: 'var(--accent)', op: 0.4 } : null);
}

/* mappa di calore */
function heatBody(load) {
  const max = Math.max(1, ...Object.values(load));
  return bodySvg(m => load[m] ? { color: 'var(--accent)', op: 0.2 + 0.8 * Math.min(1, load[m] / max) } : null);
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
