/* GYM — figura anatomica v2: proporzioni atletiche, muscoli uniti, 4 stili */
'use strict';

const B2W = 200, B2M = p => p.map(q => [B2W - q[0], q[1]]);
/* contorno: metà sinistra dello schermo, dal collo al cavallo (x=100 è il centro) */
const B2_SIL = [[100, 71], [91, 72], [89, 84], [80, 88], [66, 92], [52, 96], [42, 101], [34, 110], [30, 124], [29, 140], [27, 156], [25, 172], [23, 188], [21, 198], [18, 214], [15, 232], [14, 250], [14, 266], [11.5, 276], [9.5, 292], [11.5, 306], [17, 316], [23, 314], [26.5, 300], [28.5, 284], [30, 270], [33, 252], [36, 234], [39, 214], [41, 200], [44, 184], [47, 166], [49, 150], [52, 140], [55, 156], [58, 176], [62, 196], [65.5, 214], [66, 230], [63, 248], [61, 268], [60.5, 290], [62.5, 315], [66.5, 340], [69.5, 358], [67.5, 372], [67.5, 392], [71, 416], [75, 440], [78, 456], [76, 468], [78, 478], [90, 481], [96, 478], [95, 466], [93, 456], [93, 440], [95, 416], [96, 394], [94, 374], [93, 360], [95, 340], [97, 312], [99, 288], [100, 272]];
const B2_HEAD = 'M100 8 C116 8 124 21 124 38 C124 52 119 62 111 68 C107 71 104 72 100 72 C96 72 93 71 89 68 C81 62 76 52 76 38 C76 21 84 8 100 8 Z';

const B2_FRONT = [
  ['dorso', [[90, 77], [88.5, 86], [70, 93], [84, 91.5]]],
  ['spalle', [[62, 95.5], [50, 97.5], [40.5, 103.5], [33.5, 114], [31.5, 128], [31.5, 142], [35, 156], [40, 150], [44, 138], [47, 124], [52, 112], [58, 104]]],
  ['petto', [[98.5, 98], [84, 96.5], [70, 97.5], [60.5, 103], [52.5, 114], [49.5, 126], [50.5, 138], [57, 146], [70, 151], [86, 150.5], [98.5, 146]]],
  ['bicipiti', [[47, 143], [41.5, 149], [37, 161], [35.5, 176], [36.5, 190], [40.5, 196], [44, 186], [46, 170], [48.5, 156]]],
  ['tricipiti', [[34, 160], [31.5, 172], [29.5, 186], [32, 194], [35, 181]]],
  ['avambracci', [[40.5, 200.5], [33, 202], [24.5, 206], [19.5, 218], [17.5, 236], [18, 254], [21, 264], [28, 264], [32, 248], [36, 230], [39, 214]]],
  ['x', [[56.5, 149], [63, 152], [62, 158.5], [57, 158]]], ['x', [[57.5, 161], [64, 163], [63, 169.5], [58, 169]]], ['x', [[58.5, 172], [64.5, 174], [63.5, 180], [59.5, 179.5]]],
  ['addome', [[87, 154], [98.5, 154], [98.5, 174.5], [87, 174.5]]],
  ['addome', [[87, 177.5], [98.5, 177.5], [98.5, 197], [87, 197]]],
  ['addome', [[87, 200], [98.5, 200], [98.5, 219], [87, 219]]],
  ['addome', [[87.5, 222], [98.5, 222], [98.5, 266], [93, 258]]],
  ['addome', [[84, 155], [70, 156.5], [65, 170], [65, 196], [66.5, 216], [72, 234], [84, 250], [85, 220], [85, 190]]],
  ['x', [[67, 252], [71.5, 254], [93, 330], [89.5, 332.5]]],
  ['quadricipiti', [[67.5, 257], [63, 269], [62.5, 292], [64.5, 318], [68.5, 340], [73, 352], [76, 336], [75, 306], [72.5, 278]]],
  ['quadricipiti', [[80.5, 262], [75.5, 276], [76, 306], [77.5, 334], [81, 348], [86, 334], [87, 304], [85.5, 278]]],
  ['quadricipiti', [[88.5, 316], [85, 330], [84.5, 346], [88, 356], [93, 350], [94, 334], [92, 320]]],
  ['x', [[90.5, 270], [88.5, 284], [88.5, 310], [94.5, 315], [98.5, 300], [98.5, 280]]],
  ['polpacci', [[74, 376], [71, 392], [72, 418], [76, 440], [79, 440], [80, 412], [78, 384]]],
  ['polpacci', [[88, 374], [84, 388], [84, 410], [88, 424], [93, 412], [94, 390], [92, 378]]],
  ['polpacci', [[69.5, 384], [68, 400], [69.5, 420], [71.5, 408]]]
];
const B2_BACK = [
  ['dorso', [[100, 74], [92, 76], [86.5, 88], [70, 94], [56.5, 98.5], [66, 106], [80, 116], [92, 140], [100, 170]]],
  ['spalle', [[56, 99], [44, 100.5], [36, 108], [32, 122], [32, 140], [36, 154], [42, 146], [46, 130], [52, 114], [60, 106]]],
  ['dorso', [[78, 118.5], [66, 110.5], [56, 112.5], [50.5, 124], [52.5, 138], [62, 144], [74, 140], [82, 130]]],
  ['dorso', [[86, 144], [72, 145], [58.5, 147], [54.5, 160], [58, 182], [64, 204], [74, 224], [88, 234], [96, 220], [94, 190], [92, 166]]],
  ['dorso', [[98.5, 176], [92.5, 186], [90.5, 214], [90.5, 238], [98.5, 246]]],
  ['tricipiti', [[46, 145], [40, 151], [35.5, 163], [33.5, 178], [35.5, 192], [40, 196], [43, 182], [44, 166], [47, 154]]],
  ['tricipiti', [[50, 149], [47.5, 161], [46.5, 178], [46.5, 192], [50, 190], [51, 170]]],
  ['avambracci', [[40.5, 200.5], [33, 202], [24.5, 206], [19.5, 218], [17.5, 236], [18, 254], [21, 264], [28, 264], [32, 248], [36, 230], [39, 214]]],
  ['glutei', [[84, 237], [70, 233], [62.5, 242], [63, 256], [72, 254], [84, 248.5]]],
  ['glutei', [[98.5, 245], [84, 250], [70, 257], [63.5, 272], [66, 290], [78, 298], [92, 298.5], [99, 292]]],
  ['femorali', [[74, 301], [66, 307], [64, 326], [68, 348], [74, 360], [78, 346], [78, 322]]],
  ['femorali', [[94, 301], [82, 303], [80.5, 326], [82, 350], [88, 362], [93, 346], [95, 322]]],
  ['x', [[98.5, 299], [96, 305], [96, 330], [98.5, 326]]],
  ['polpacci', [[78, 374], [70.5, 382], [68.5, 400], [71, 420], [77, 428], [80, 410], [81, 388]]],
  ['polpacci', [[84, 374], [83, 392], [84, 414], [88, 428], [93, 418], [95, 396], [92, 380]]],
  ['x', [[80.5, 440], [79, 456], [86, 456], [86, 440]]]
];

/* ===== figura anatomica realistica (immagini fig/corpo_*.webp) con zone toccabili tracciate sopra ===== */
const AN_W = 256, AN_H = 495;
const AN_FRONT = { cx: 128, m: [
  ['spalle', [[90, 88], [76, 89], [66, 96], [61, 108], [61, 122], [66, 126], [72, 116], [80, 104], [90, 96]]],
  ['petto', [[127, 96], [112, 91], [96, 92], [86, 100], [82, 112], [84, 125], [93, 134], [107, 138], [120, 136], [127, 131]]],
  ['bicipiti', [[66, 126], [60, 133], [56, 146], [54, 160], [56, 170], [62, 169], [67, 157], [71, 143], [74, 131]]],
  ['avambracci', [[57, 172], [50, 179], [43, 196], [37, 213], [34, 225], [40, 228], [48, 214], [56, 197], [64, 178]]],
  ['addome', [[127, 137], [112, 136], [100, 139], [91, 149], [89, 168], [94, 188], [106, 200], [127, 204]]],
  ['quadricipiti', [[79, 284], [76, 300], [80, 318], [86, 334], [96, 341], [108, 338], [116, 320], [122, 297], [124, 284]]],
  ['polpacci', [[102, 357], [97, 372], [97, 392], [100, 410], [106, 404], [110, 384], [108, 364]]],
  ['polpacci', [[80, 352], [76, 370], [77, 392], [81, 400], [84, 380], [84, 360]]]
] };
const AN_BACK = { cx: 125, m: [
  ['dorso', [[125, 62], [112, 66], [104, 76], [86, 88], [96, 96], [106, 110], [116, 140], [125, 168]]],
  ['spalle', [[78, 88], [64, 94], [55, 106], [52, 120], [58, 127], [66, 117], [74, 105], [84, 96]]],
  ['dorso', [[98, 100], [82, 110], [73, 121], [76, 141], [86, 166], [96, 190], [110, 198], [120, 172], [112, 140], [104, 118]]],
  ['dorso', [[125, 170], [116, 176], [114, 198], [125, 204]]],
  ['tricipiti', [[64, 119], [56, 125], [50, 141], [48, 160], [52, 171], [60, 168], [66, 151], [72, 131]]],
  ['avambracci', [[50, 173], [42, 185], [34, 205], [30, 226], [36, 236], [44, 220], [52, 201], [60, 181]]],
  ['glutei', [[125, 214], [104, 212], [88, 218], [80, 236], [82, 258], [96, 272], [112, 274], [124, 270]]],
  ['femorali', [[70, 282], [68, 300], [74, 322], [84, 340], [96, 346], [108, 338], [116, 316], [120, 290], [118, 282]]],
  ['polpacci', [[78, 346], [70, 360], [66, 380], [70, 402], [80, 412], [92, 412], [100, 400], [102, 380], [98, 360], [92, 348]]]
] };
function anatomicSvg(fill, opts) {
  opts = opts || {};
  const u = ++_b2n, mir = (P, cx) => P.map(p => [2 * cx - p[0], p[1]]);
  const side = (ox, F, img) => {
    let g = '<g transform="translate(' + ox + ',0)"><image href="fig/' + img + '.webp" x="0" y="0" width="' + AN_W + '" height="' + AN_H + '" preserveAspectRatio="none"/>';
    F.m.forEach(([m, pts]) => {
      const r = fill(m);
      [pts, mir(pts, F.cx)].forEach(P => {
        const d = smoothPath(P, true), op = r ? (r.op == null ? 1 : r.op) : 0;
        g += '<path data-m="' + m + '" d="' + d + '" class="an-mu' + (r ? ' on' : '') + '" fill="#e8402a" fill-opacity="' + (r ? (0.28 + 0.5 * op).toFixed(2) : 0) + '"' + (r ? ' filter="url(#anb' + u + ')"' : '') + '/>';
      });
    });
    return g + '</g>';
  };
  const H = opts.mini ? AN_H : AN_H + 22;
  const lbl = opts.mini ? '' : '<text x="' + AN_W / 2 + '" y="' + (AN_H + 16) + '" text-anchor="middle" class="svg-lbl">Fronte</text><text x="' + (AN_W * 1.5) + '" y="' + (AN_H + 16) + '" text-anchor="middle" class="svg-lbl">Retro</text>';
  return '<svg class="body-svg b2 b2-anatomico' + (opts.click ? ' clickable' : '') + (opts.mini ? ' mini' : '') + '" viewBox="0 0 ' + (AN_W * 2) + ' ' + H + '" xmlns="http://www.w3.org/2000/svg"><defs><filter id="anb' + u + '" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>' +
    '<rect x="0" y="0" width="' + (AN_W * 2) + '" height="' + AN_H + '" rx="14" fill="#fff"/>' + side(0, AN_FRONT, 'corpo_fronte') + side(AN_W, AN_BACK, 'corpo_retro') + lbl + '</svg>';
}

const B2_STYLES = {
  anatomico: { n: 'Anatomico realistico', d: 'Figura anatomica dettagliata, i muscoli allenati si accendono in rosso.' },
  medico: { n: 'Tavola medica', d: 'Corpo grigio, muscoli allenati rossi con le fibre, come le tavole di anatomia.' },
  lineare: { n: 'Disegno a linee', d: 'Bianco con contorni neri sottili, il muscolo allenato colorato.' },
  realistico: { n: 'Realistico', d: 'Muscoli grigi con ombre e pantaloncini, il muscolo allenato in rosso.' },
  moderno: { n: 'Moderno', d: 'Piatto e pulito: muscoli separati da linee sottili, quello allenato colorato.' },
  chiaro: { n: 'Moderno chiaro', d: 'Come Moderno, con il corpo più chiaro.' },
  morbido: { n: 'Morbido', d: 'Sfumature leggere, nessun riflesso, muscolo allenato luminoso.' },
  vettoriale: { n: 'Vettoriale', d: 'Forme piene a due toni, stile illustrazione moderna.' },
  rilievo: { n: 'Rilievo 3D', d: 'Grigio con ombre e fibre, muscolo allenato in evidenza.' }
};

let _b2n = 0;
function b2Fibers(P, gap) { return hatchLines(P, 0, gap || 2.4); }
function bodySvg2(fill, opts) {
  opts = opts || {};
  if ((opts.style || 'anatomico') === 'anatomico') return anatomicSvg(fill, opts);
  const st = opts.style || 'medico', u = ++_b2n;
  const sel = m => m !== 'x' ? fill(m) : null;
  let defs = '';
  if (st === 'realistico') defs += '<linearGradient id="b2rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".6" stop-color="#c8ccd2"/><stop offset="1" stop-color="#8f959e"/></linearGradient>' +
    '<linearGradient id="b2rr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffab8c"/><stop offset=".5" stop-color="#f0583a"/><stop offset="1" stop-color="#b8261a"/></linearGradient>' +
    '<linearGradient id="b2rk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#45484e"/><stop offset="1" stop-color="#16171a"/></linearGradient>';
  if (st === 'rilievo' || st === 'medico') defs +=
    '<radialGradient id="b2g' + u + '" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="var(--b2-hi)"/><stop offset="1" stop-color="var(--b2-lo)"/></radialGradient>' +
    '<radialGradient id="b2a' + u + '" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="var(--b2-ahi)"/><stop offset="1" stop-color="var(--b2-alo)"/></radialGradient>';
  const fig = (ox, list, back) => {
    let g = '<g transform="translate(' + ox + ',0)">';
    g += '<path d="' + smoothPath(B2_SIL.concat(B2M(B2_SIL.slice(1, -1)).reverse()), true) + '" class="b2-sil"/><path d="' + B2_HEAD + '" class="b2-sil"/>';
    list.forEach(([m, pts]) => {
      const r = sel(m), dm = m !== 'x' ? ' data-m="' + m + '"' : '';
      [pts, B2M(pts)].forEach(P => {
        const d = smoothPath(P, true), op = r ? (r.op == null ? 1 : r.op) : 1;
        let f = '';
        if (st === 'rilievo') f = r ? 'fill="url(#b2a' + u + ')" fill-opacity="' + (0.35 + 0.65 * op) + '"' : 'fill="url(#b2g' + u + ')"';
        else if (st === 'medico') f = r ? 'fill="url(#b2a' + u + ')" fill-opacity="' + (0.3 + 0.7 * op) + '"' : '';
        else if (st === 'realistico') f = r ? 'fill="url(#b2rr)" fill-opacity="' + (0.45 + 0.55 * op) + '"' : 'fill="url(#b2rg)"';
        else if (r) f = 'fill="var(--accent)" fill-opacity="' + (0.3 + 0.7 * op) + '"';
        g += '<path' + dm + ' d="' + d + '" ' + f + ' class="b2-mu' + (r ? ' on' : '') + (m === 'x' ? ' xx' : '') + '"/>';
        if (st === 'vettoriale') { const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length; g += '<path d="' + smoothPath(P.map(p => [cx + (p[0] - cx) * 0.62 - 1.2, cy + (p[1] - cy) * 0.62 - 1.6]), true) + '" class="b2-hl' + (r ? ' on' : '') + '" pointer-events="none"/>'; }
        if (!opts.mini && (st === 'medico' ? r : st === 'rilievo')) g += '<clipPath id="b2c' + u + '_' + (++_b2n) + '"><path d="' + d + '"/></clipPath><path d="' + b2Fibers(P, st === 'medico' ? 2.2 : 3) + '" class="b2-fib' + (r ? ' on' : '') + '" clip-path="url(#b2c' + u + '_' + _b2n + ')"/>';
      });
    });
    // pantaloncini (stile realistico)
    if (st === 'realistico') {
      const SH = back ? [[100, 238], [84, 236], [68, 238], [61, 250], [61, 272], [63, 300], [80, 306], [96, 303], [100, 298]] : [[100, 240], [84, 238], [70, 240], [62, 252], [61, 272], [63, 300], [80, 305], [95, 301], [100, 282]];
      g += '<path d="' + smoothPath(SH.concat(B2M(SH.slice(1, -1)).reverse()), true) + '" fill="url(#b2rk)" stroke="#111" stroke-width=".8" class="b2-shorts"/>';
      if (back && sel('glutei')) list.filter(([m]) => m === 'glutei').forEach(([m, pts]) => { [pts, B2M(pts)].forEach(P => { g += '<path d="' + smoothPath(P, true) + '" fill="url(#b2rr)" fill-opacity="' + (0.45 + 0.55 * (sel('glutei').op == null ? 1 : sel('glutei').op)) + '" class="b2-mu on"/>'; }); });
    }
    // dettagli
    if (!opts.mini) {
      if (!back) g += '<path d="M68 96.5 Q84 93 98 97 M132 96.5 Q116 93 102 97 M100 98 L100 150 M97 236 q3 3 6 0 M74 362 q4 -6 8 0 q0 7 -4 9 q-4 -2 -4 -9 M126 362 q-4 -6 -8 0 q0 7 4 9 q4 -2 4 -9" class="b2-d"/>';
      else g += '<path d="M100 76 L100 246 M78 486 M84 300 L84 300" class="b2-d"/>';
      g += '<path d="M14 290 L13.5 303 M18 292 L18 307 M22 291 L22.5 305 M186 290 L186.5 303 M182 292 L182 307 M178 291 L177.5 305" class="b2-d"/>';
    }
    return g + '<path d="' + smoothPath(B2_SIL.concat(B2M(B2_SIL.slice(1, -1)).reverse()), true) + '" class="b2-out"/><path d="' + B2_HEAD + '" class="b2-out"/></g>';
  };
  const lbl = opts.mini ? '' : '<text x="100" y="506" text-anchor="middle" class="svg-lbl">Fronte</text><text x="320" y="506" text-anchor="middle" class="svg-lbl">Retro</text>';
  return '<svg class="body-svg b2 b2-' + st + (opts.click ? ' clickable' : '') + (opts.mini ? ' mini' : '') + '" viewBox="0 0 420 ' + (opts.mini ? 490 : 516) + '" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' + fig(0, B2_FRONT, false) + fig(220, B2_BACK, true) + lbl + '</svg>';
}
