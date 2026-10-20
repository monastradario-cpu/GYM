/* GYM — figura del corpo con muscoli e grafici SVG */
'use strict';

/* Figura fronte/retro. Ogni forma ha data-m = muscolo. */
function bodySvg(fill, opts) {
  opts = opts || {};
  // fill(m) -> {color, op}
  const f = m => { const r = fill(m) || {}; return 'fill="' + (r.color || 'var(--muscle)') + '" fill-opacity="' + (r.op == null ? 1 : r.op) + '"'; };
  const sil = 'fill="var(--body)"';
  const figure = (ox, back) => {
    const g = [];
    // silhouette
    g.push('<circle cx="' + (ox + 60) + '" cy="26" r="17" ' + sil + '/>');
    g.push('<rect x="' + (ox + 52) + '" y="40" width="16" height="12" rx="4" ' + sil + '/>');
    g.push('<path d="M' + (ox + 22) + ' 66 Q' + (ox + 60) + ' 50 ' + (ox + 98) + ' 66 L' + (ox + 94) + ' 200 Q' + (ox + 60) + ' 212 ' + (ox + 26) + ' 200 Z" ' + sil + '/>');
    // braccia (silhouette)
    g.push('<path d="M' + (ox + 20) + ' 68 Q' + (ox + 6) + ' 120 ' + (ox + 8) + ' 196 L' + (ox + 20) + ' 198 Q' + (ox + 24) + ' 130 ' + (ox + 32) + ' 90 Z" ' + sil + '/>');
    g.push('<path d="M' + (ox + 100) + ' 68 Q' + (ox + 114) + ' 120 ' + (ox + 112) + ' 196 L' + (ox + 100) + ' 198 Q' + (ox + 96) + ' 130 ' + (ox + 88) + ' 90 Z" ' + sil + '/>');
    // gambe (silhouette)
    g.push('<path d="M' + (ox + 28) + ' 200 L' + (ox + 58) + ' 206 L' + (ox + 56) + ' 372 L' + (ox + 38) + ' 372 Q' + (ox + 26) + ' 290 ' + (ox + 28) + ' 200 Z" ' + sil + '/>');
    g.push('<path d="M' + (ox + 92) + ' 200 L' + (ox + 62) + ' 206 L' + (ox + 64) + ' 372 L' + (ox + 82) + ' 372 Q' + (ox + 94) + ' 290 ' + (ox + 92) + ' 200 Z" ' + sil + '/>');
    // spalle (deltoidi)
    g.push('<ellipse data-m="spalle" cx="' + (ox + 25) + '" cy="78" rx="11" ry="14" ' + f('spalle') + '/>');
    g.push('<ellipse data-m="spalle" cx="' + (ox + 95) + '" cy="78" rx="11" ry="14" ' + f('spalle') + '/>');
    if (!back) {
      // petto
      g.push('<path data-m="petto" d="M' + (ox + 36) + ' 72 Q' + (ox + 48) + ' 66 ' + (ox + 58) + ' 70 L' + (ox + 58) + ' 102 Q' + (ox + 44) + ' 108 ' + (ox + 34) + ' 98 Z" ' + f('petto') + '/>');
      g.push('<path data-m="petto" d="M' + (ox + 84) + ' 72 Q' + (ox + 72) + ' 66 ' + (ox + 62) + ' 70 L' + (ox + 62) + ' 102 Q' + (ox + 76) + ' 108 ' + (ox + 86) + ' 98 Z" ' + f('petto') + '/>');
      // addome
      for (let r = 0; r < 4; r++) {
        g.push('<rect data-m="addome" x="' + (ox + 47) + '" y="' + (112 + r * 20) + '" width="12" height="17" rx="4" ' + f('addome') + '/>');
        g.push('<rect data-m="addome" x="' + (ox + 61) + '" y="' + (112 + r * 20) + '" width="12" height="17" rx="4" ' + f('addome') + '/>');
      }
      // bicipiti
      g.push('<ellipse data-m="bicipiti" cx="' + (ox + 19) + '" cy="116" rx="7" ry="18" ' + f('bicipiti') + '/>');
      g.push('<ellipse data-m="bicipiti" cx="' + (ox + 101) + '" cy="116" rx="7" ry="18" ' + f('bicipiti') + '/>');
      // avambracci
      g.push('<ellipse data-m="avambracci" cx="' + (ox + 14) + '" cy="164" rx="6" ry="20" ' + f('avambracci') + '/>');
      g.push('<ellipse data-m="avambracci" cx="' + (ox + 106) + '" cy="164" rx="6" ry="20" ' + f('avambracci') + '/>');
      // quadricipiti
      g.push('<ellipse data-m="quadricipiti" cx="' + (ox + 44) + '" cy="252" rx="13" ry="40" ' + f('quadricipiti') + '/>');
      g.push('<ellipse data-m="quadricipiti" cx="' + (ox + 76) + '" cy="252" rx="13" ry="40" ' + f('quadricipiti') + '/>');
      // polpacci (vista frontale)
      g.push('<ellipse data-m="polpacci" cx="' + (ox + 46) + '" cy="330" rx="7" ry="24" ' + f('polpacci') + '/>');
      g.push('<ellipse data-m="polpacci" cx="' + (ox + 74) + '" cy="330" rx="7" ry="24" ' + f('polpacci') + '/>');
    } else {
      // trapezio + dorsali + lombari = dorso
      g.push('<path data-m="dorso" d="M' + (ox + 40) + ' 64 Q' + (ox + 60) + ' 54 ' + (ox + 80) + ' 64 L' + (ox + 66) + ' 90 L' + (ox + 54) + ' 90 Z" ' + f('dorso') + '/>');
      g.push('<path data-m="dorso" d="M' + (ox + 34) + ' 90 Q' + (ox + 48) + ' 84 ' + (ox + 57) + ' 94 L' + (ox + 57) + ' 150 Q' + (ox + 42) + ' 140 ' + (ox + 34) + ' 120 Z" ' + f('dorso') + '/>');
      g.push('<path data-m="dorso" d="M' + (ox + 86) + ' 90 Q' + (ox + 72) + ' 84 ' + (ox + 63) + ' 94 L' + (ox + 63) + ' 150 Q' + (ox + 78) + ' 140 ' + (ox + 86) + ' 120 Z" ' + f('dorso') + '/>');
      g.push('<rect data-m="dorso" x="' + (ox + 50) + '" y="154" width="20" height="34" rx="6" ' + f('dorso') + '/>');
      // tricipiti
      g.push('<ellipse data-m="tricipiti" cx="' + (ox + 19) + '" cy="116" rx="7" ry="18" ' + f('tricipiti') + '/>');
      g.push('<ellipse data-m="tricipiti" cx="' + (ox + 101) + '" cy="116" rx="7" ry="18" ' + f('tricipiti') + '/>');
      g.push('<ellipse data-m="avambracci" cx="' + (ox + 14) + '" cy="164" rx="6" ry="20" ' + f('avambracci') + '/>');
      g.push('<ellipse data-m="avambracci" cx="' + (ox + 106) + '" cy="164" rx="6" ry="20" ' + f('avambracci') + '/>');
      // glutei
      g.push('<ellipse data-m="glutei" cx="' + (ox + 46) + '" cy="210" rx="15" ry="14" ' + f('glutei') + '/>');
      g.push('<ellipse data-m="glutei" cx="' + (ox + 74) + '" cy="210" rx="15" ry="14" ' + f('glutei') + '/>');
      // femorali
      g.push('<ellipse data-m="femorali" cx="' + (ox + 44) + '" cy="262" rx="12" ry="34" ' + f('femorali') + '/>');
      g.push('<ellipse data-m="femorali" cx="' + (ox + 76) + '" cy="262" rx="12" ry="34" ' + f('femorali') + '/>');
      // polpacci
      g.push('<ellipse data-m="polpacci" cx="' + (ox + 46) + '" cy="326" rx="9" ry="26" ' + f('polpacci') + '/>');
      g.push('<ellipse data-m="polpacci" cx="' + (ox + 74) + '" cy="326" rx="9" ry="26" ' + f('polpacci') + '/>');
    }
    return g.join('');
  };
  const lbl = (x, t) => '<text x="' + x + '" y="392" text-anchor="middle" class="svg-lbl">' + t + '</text>';
  return '<svg class="body-svg' + (opts.click ? ' clickable' : '') + '" viewBox="0 0 270 400" xmlns="http://www.w3.org/2000/svg">' +
    figure(10, false) + figure(140, true) + lbl(70, 'Fronte') + lbl(200, 'Retro') + '</svg>';
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
