/* GYM — dimostrazioni animate degli esercizi (manichino al rallentatore) */
'use strict';

const GY = 200;            // linea del pavimento
const AY = 195;            // altezza caviglia da terra
const LEN = { t: 58, n: 12, ua: 30, fa: 27, th: 42, sh: 40, ft: 13 };
const rad = d => d * Math.PI / 180;
const vec = (a, l) => [Math.cos(rad(a)) * l, -Math.sin(rad(a)) * l];
const add = (p, v) => [p[0] + v[0], p[1] + v[1]];

/* ---------- pose di base (vista laterale, la figura guarda a destra) ---------- */
const BASE = { t: 90, n: 90, ua: -90, fa: -90, th: -90, sh: -90, ft: 0, uaS: 1, faS: 1 };
const P = o => Object.assign({}, BASE, { anchor: { j: 'ankle', x: 160, y: AY } }, o);
const SEAT = o => P(Object.assign({ t: 92, th: 0, sh: -90, anchor: { j: 'hip', x: 150, y: 155 } }, o));
const LIE = o => P(Object.assign({ t: 180, n: 180, th: -25, sh: -92, anchor: { j: 'hip', x: 190, y: 139 } }, o));
const PRONE = o => P(Object.assign({ t: 180, n: 190, th: 0, sh: 0, ft: -60, anchor: { j: 'hip', x: 165, y: 139 } }, o));
const FLOOR = o => P(Object.assign({ t: 178, n: 178, th: 50, sh: -60, anchor: { j: 'hip', x: 175, y: 188 } }, o));
/* vista frontale */
const FBASE = { f: true, uaR: -82, faR: -86, thR: -88, shR: -88, uaS: 1, thS: 1, tS: 1, lean: 0, hx: 0 };
const F = o => Object.assign({}, FBASE, { anchor: { j: 'feet', x: 160, y: AY } }, o);
const FSEAT = o => F(Object.assign({ thS: 0.35, anchor: { j: 'hip', x: 160, y: 150 } }, o));

/* key: [pose iniziale, pose finale], cues: [andata, ritorno], dur: secondi [andata, ritorno] */
const ANIMS = {
  bench_press: { props: ['bench'], keys: [LIE({ ua: 88, fa: 90 }), LIE({ ua: -78, fa: 96 })], cues: ['Scendi lento verso il petto, inspira', 'Spingi in alto espirando, scapole strette'] },
  incline_press: { props: ['incline'], keys: [P({ t: 140, n: 120, ua: 84, fa: 86, th: -10, sh: -100, anchor: { j: 'hip', x: 180, y: 150 } }), P({ t: 140, n: 120, ua: -96, fa: 80, th: -10, sh: -100, anchor: { j: 'hip', x: 180, y: 150 } })], cues: ['Scendi verso il petto alto, gomiti a 45°', 'Spingi verso l\'alto espirando'] },
  chest_press: { props: ['seat', 'lever'], lever: [232, 70], leverH: true, keys: [SEAT({ ua: 190, fa: 4 }), SEAT({ ua: 0, fa: 0 })], order: 1, cues: ['Spingi in avanti espirando, schiena appoggiata', 'Torna indietro lento, senti l\'allungamento del petto'] },
  pushup: { props: [], keys: [P({ t: 156, n: 150, ua: -90, fa: -90, th: -24, sh: -24, ft: -70, anchor: { j: 'hand', x: 110, y: 197 } }), P({ t: 177, n: 170, ua: 30, fa: -125, th: -3, sh: -3, ft: -70, anchor: { j: 'hand', x: 110, y: 197 } })], cues: ['Scendi col petto verso terra, corpo dritto', 'Spingi il pavimento lontano, addome contratto'] },
  fly: { props: ['seatF'], keys: [FSEAT({ uaR: 0, faR: 84, uaS: 1 }), FSEAT({ uaR: 6, faR: 86, uaS: 0.15 })], order: 1, front: true, cues: ['Chiudi le braccia davanti al petto e stringi', 'Apri le braccia lento fino a sentire l\'allungamento'] },
  deadlift: { props: [], keys: [P({ t: 40, n: 30, th: -30, sh: -105 }), P({})], cues: ['Spingi il pavimento, bilanciere vicino alle gambe', 'Riscendi controllato, schiena neutra'] },
  rdl: { props: [], keys: [P({ th: -84, sh: -94 }), P({ t: 15, n: 0, th: -60, sh: -100 })], cues: ['Anche indietro, schiena neutra, scendi lungo le gambe', 'Spingi le anche avanti e stringi i glutei'] },
  good_morning: { props: [], keys: [P({ ua: -150, fa: 75, th: -84, sh: -94 }), P({ t: 15, n: 0, ua: -60, fa: 150, th: -60, sh: -100 })], cues: ['Piega il busto portando le anche indietro', 'Risali a schiena neutra'] },
  hyperext: { props: ['padHip'], keys: [P({ t: 135, n: 135, th: -45, sh: -45, ft: 45, rel: true, ua: -150, fa: 30, anchor: { j: 'ankle', x: 235, y: 185 } }), P({ t: 212, n: 212, th: -45, sh: -45, ft: 45, rel: true, ua: -150, fa: 30, anchor: { j: 'ankle', x: 235, y: 185 } })], cues: ['Scendi col busto a schiena neutra', 'Risali fino ad allineare busto e gambe'] },
  row_bent: { props: [], keys: [P({ t: 35, n: 20, th: -65, sh: -100 }), P({ t: 35, n: 20, th: -65, sh: -100, ua: 200, fa: -80 })], order: 1, cues: ['Tira verso l\'ombelico, gomiti indietro', 'Distendi le braccia controllato'] },
  row_db: { props: ['benchLow'], keys: [P({ t: 15, n: 0, th: -65, sh: -100, ua2: -80, fa2: -90 }), P({ t: 15, n: 0, th: -65, sh: -100, ua: 195, fa: -75, ua2: -80, fa2: -90 })], order: 1, cues: ['Tira il manubrio verso l\'anca', 'Scendi allungando bene il dorsale'] },
  row_seated: { props: ['seatLow', 'cable', 'footplate'], cable: [300, null], keys: [P({ t: 92, th: 5, sh: -20, ft: 70, ua: 0, fa: 0, anchor: { j: 'hip', x: 140, y: 170 } }), P({ t: 92, th: 5, sh: -20, ft: 70, ua: 190, fa: 0, anchor: { j: 'hip', x: 140, y: 170 } })], order: 1, cues: ['Tira verso l\'ombelico, stringi le scapole', 'Allunga in avanti controllato, busto fermo'] },
  pullover: { props: ['bench'], keys: [LIE({ ua: 86, fa: 86 }), LIE({ ua: 172, fa: 172 })], cues: ['Porta il manubrio dietro la testa, braccia quasi tese', 'Riporta sopra il petto contraendo i dorsali'] },
  lat_pull: { props: ['seatF', 'latbar'], keys: [FSEAT({ uaR: 70, faR: 80 }), FSEAT({ uaR: -40, faR: 88 })], order: 1, front: true, cues: ['Tira la barra al petto, gomiti verso i fianchi', 'Risali lento fino a braccia tese'] },
  pullup: { props: ['pullbar'], keys: [F({ uaR: 76, faR: 80, thR: -92, shR: -100, anchor: { j: 'hands', x: 160, y: 28 } }), F({ uaR: -30, faR: 88, thR: -92, shR: -100, anchor: { j: 'hands', x: 160, y: 28 } })], order: 1, front: true, cues: ['Sali portando il mento sopra la sbarra', 'Scendi controllato fino a braccia tese'] },
  ohp: { props: [], keys: [F({ uaR: -20, faR: 92 }), F({ uaR: 76, faR: 86 })], order: 1, front: true, cues: ['Spingi sopra la testa espirando', 'Riscendi all\'altezza del mento'] },
  lateral: { props: [], keys: [F({ uaR: -80, faR: -84 }), F({ uaR: -4, faR: -10 })], order: 1, front: true, cues: ['Alza lateralmente fino all\'altezza delle spalle', 'Scendi lento, senza slancio'] },
  front_raise: { props: [], keys: [P({}), P({ ua: 4, fa: 4 })], order: 1, cues: ['Alza davanti fino all\'altezza degli occhi', 'Scendi controllato'] },
  rear_fly: { props: [], keys: [F({ tS: 0.45, uaR: -86, faR: -90, thR: -86, shR: -92 }), F({ tS: 0.45, uaR: 0, faR: -8, thR: -86, shR: -92 })], order: 1, front: true, cues: ['Busto piegato: apri le braccia e stringi le scapole', 'Scendi lento'] },
  face_pull: { props: ['cable'], cable: [300, 58], keys: [P({ ua: 10, fa: 10 }), P({ ua: 175, fa: 58 })], order: 1, cues: ['Tira verso la fronte, gomiti alti', 'Allunga le braccia controllato'] },
  upright_row: { props: [], keys: [F({ uaR: -88, faR: -96 }), F({ uaR: 18, faR: -158 })], order: 1, front: true, cues: ['Tira lungo il corpo, gomiti alti', 'Scendi controllato'] },
  curl: { props: [], keys: [P({ ua: -88, fa: -88 }), P({ ua: -80, fa: 96 })], order: 1, cues: ['Piega senza muovere i gomiti, espira', 'Scendi lento fino a braccio teso'] },
  curl_seated: { props: ['seat'], keys: [SEAT({ t: 70, ua: -84, fa: -84 }), SEAT({ t: 70, ua: -84, fa: 96 })], order: 1, cues: ['Piega e stringi il bicipite', 'Scendi lento'] },
  curl_scott: { props: ['seat', 'scott'], keys: [SEAT({ ua: -38, fa: -40 }), SEAT({ ua: -38, fa: 100 })], order: 1, cues: ['Piega fino in alto', 'Scendi lento senza stendere di colpo'] },
  skull: { props: ['bench'], keys: [LIE({ ua: 100, fa: 100 }), LIE({ ua: 106, fa: 196 })], cues: ['Piega i gomiti verso la fronte, gomiti fermi', 'Stendi le braccia espirando'] },
  overhead_ext: { props: ['seat'], keys: [SEAT({ ua: 98, fa: 95 }), SEAT({ ua: 104, fa: 250 })], cues: ['Scendi dietro la testa piegando i gomiti', 'Stendi le braccia sopra la testa'] },
  kickback: { props: [], keys: [P({ t: 25, n: 10, th: -65, sh: -100, ua: 200, fa: -90 }), P({ t: 25, n: 10, th: -65, sh: -100, ua: 200, fa: 198 })], order: 1, cues: ['Stendi il braccio indietro e stringi', 'Torna lento a 90°'] },
  pushdown: { props: ['cable'], cable: [205, 6], keys: [P({ ua: -92, fa: 55 }), P({ ua: -92, fa: -88 })], order: 1, cues: ['Spingi in basso fino a braccia tese', 'Risali fino a 90°, gomiti fermi'] },
  dip: { props: ['parallels'], keys: [P({ t: 92, th: -100, sh: -125, ua: -90, fa: -90, anchor: { j: 'hand', x: 168, y: 118 } }), P({ t: 80, th: -100, sh: -125, ua: -150, fa: -40, anchor: { j: 'hand', x: 168, y: 118 } })], cues: ['Scendi fino a gomiti a 90°', 'Spingi in alto fino a braccia tese'] },
  crunch: { props: ['mat'], keys: [FLOOR({ rel: true, ua: 60, fa: 172 }), FLOOR({ t: 146, n: 120, rel: true, ua: 60, fa: 172 })], order: 1, cues: ['Arrotola il busto staccando le scapole, espira', 'Scendi lento'] },
  crunch_machine: { props: ['seat'], keys: [SEAT({ t: 95, rel: true, ua: -40, fa: 70 }), SEAT({ t: 55, n: 40, rel: true, ua: -40, fa: 70 })], order: 1, cues: ['Arrotola il busto in avanti', 'Torna lento'] },
  crunch_cable: { props: ['cable', 'mat'], cable: [205, 6], keys: [P({ t: 80, n: 70, th: -90, sh: 180, ft: 180, rel: true, ua: 60, fa: 172, anchor: { j: 'knee', x: 175, y: 190 } }), P({ t: 18, n: -10, th: -90, sh: 180, ft: 180, rel: true, ua: 60, fa: 172, anchor: { j: 'knee', x: 175, y: 190 } })], order: 1, cues: ['Arrotola il busto portando i gomiti alle cosce', 'Risali controllato'] },
  plank: { props: ['mat'], keys: [P({ t: 167, n: 165, ua: -90, fa: 180, th: -12.5, sh: -12.5, ft: -70, anchor: { j: 'elbow', x: 105, y: 190 } }), P({ t: 166, n: 165, ua: -90, fa: 180, th: -12, sh: -12, ft: -70, anchor: { j: 'elbow', x: 105, y: 190 } })], dur: [2, 2], cues: ['Corpo in linea, addome e glutei contratti', 'Respira con calma e mantieni'] },
  leg_raise: { props: ['mat'], keys: [P({ t: 180, n: 178, ua: -3, fa: -3, th: -2, sh: -2, anchor: { j: 'hip', x: 160, y: 188 } }), P({ t: 180, n: 178, ua: -3, fa: -3, th: 86, sh: 86, ft: 0, anchor: { j: 'hip', x: 160, y: 188 } })], order: 1, cues: ['Alza le gambe tese fino a 90°', 'Scendi lento senza toccare terra'] },
  twist: { props: ['matF'], keys: [FSEAT({ uaR: -55, faR: -100, uaL: -30, faL: -60, anchor: { j: 'hip', x: 160, y: 175 } }), FSEAT({ uaR: -150, faR: -120, uaL: -125, faL: -80, anchor: { j: 'hip', x: 160, y: 175 } })], dur: [1.5, 1.5], front: true, cues: ['Ruota il busto verso un lato', 'Ruota verso l\'altro lato, busto alto'] },
  squat_back: { props: [], keys: [P({ ua: -150, fa: 75 }), P({ t: 55, n: 40, th: -15, sh: -112, ua: -170, fa: 65 })], cues: ['Scendi con le anche indietro, ginocchia in fuori', 'Risali spingendo con tutto il piede'] },
  squat_front: { props: [], keys: [P({ ua: 15, fa: 160 }), P({ t: 72, n: 70, th: -15, sh: -112, ua: 15, fa: 160 })], cues: ['Scendi col busto dritto, gomiti alti', 'Risali spingendo coi talloni'] },
  squat_goblet: { props: [], keys: [P({ ua: -75, fa: 100 }), P({ t: 65, n: 50, th: -15, sh: -112, ua: -95, fa: 80 })], cues: ['Scendi tra le gambe col busto dritto', 'Risali spingendo coi talloni'] },
  squat_bw: { props: [], keys: [P({}), P({ t: 60, n: 45, th: -15, sh: -112, ua: 0, fa: 0 })], cues: ['Scendi con le anche indietro, braccia avanti', 'Risali deciso'] },
  leg_press: { props: ['recline', 'platform'], keys: [P({ t: 125, n: 110, ua: -100, fa: -30, th: 35, sh: 35, ft: 125, anchor: { j: 'hip', x: 140, y: 165 } }), P({ t: 125, n: 110, ua: -100, fa: -30, th: 78, sh: -12, ft: 125, anchor: { j: 'hip', x: 140, y: 165 } })], cues: ['Piega le ginocchia verso il petto, bacino appoggiato', 'Spingi senza bloccare le ginocchia'] },
  lunge: { props: [], keys: [P({ th: -80, sh: -95, th2: -100, sh2: -92, anchor: { j: 'ankle', x: 175, y: AY } }), P({ t: 88, th: -10, sh: -95, th2: -110, sh2: -165, ft2: -55, anchor: { j: 'ankle', x: 185, y: AY } })], cues: ['Scendi finché il ginocchio dietro sfiora terra', 'Spingi col piede davanti e risali'] },
  bulgarian: { props: ['benchBack'], keys: [P({ th: -80, sh: -95, th2: -120, sh2: -170, ft2: 170, anchor: { j: 'ankle', x: 175, y: AY } }), P({ t: 85, th: -15, sh: -100, th2: -100, sh2: 140, ft2: 170, anchor: { j: 'ankle', x: 175, y: AY } })], cues: ['Scendi verticale sulla gamba davanti', 'Risali spingendo col tallone'] },
  stepup: { props: ['box'], keys: [P({ th: -10, sh: -115, th2: -100, sh2: -100, anchor: { j: 'ankle', x: 192, y: 160 } }), P({ th: -88, sh: -92, th2: -40, sh2: -110, anchor: { j: 'ankle', x: 192, y: 160 } })], order: 1, cues: ['Sali spingendo con la gamba sul rialzo', 'Scendi controllato'] },
  leg_ext: { props: ['seat', 'padAnkle'], keys: [SEAT({ t: 100, ua: -100, fa: -60, sh: -85 }), SEAT({ t: 100, ua: -100, fa: -60, sh: -6 })], order: 1, cues: ['Stendi le gambe e stringi i quadricipiti', 'Scendi lento'] },
  leg_curl_lying: { props: ['bench', 'padAnkle'], keys: [PRONE({ ua: -100, fa: -60 }), PRONE({ ua: -100, fa: -60, sh: 115 })], order: 1, cues: ['Porta i talloni verso i glutei', 'Scendi lento, bacino appoggiato'] },
  leg_curl_seated: { props: ['seat', 'padAnkle'], keys: [SEAT({ ua: -100, fa: -60, sh: -8 }), SEAT({ ua: -100, fa: -60, sh: -112 })], order: 1, cues: ['Piega le gambe verso il basso', 'Torna lento'] },
  hip_thrust: { props: ['benchBack', 'hipbar'], gear: 'none', keys: [P({ t: 150, n: 150, th: 24, sh: -87, ua: -60, fa: 10, anchor: { j: 'shoulder', x: 112, y: 140 } }), P({ t: 180, n: 175, th: -15, sh: -95, ua: -40, fa: 5, anchor: { j: 'shoulder', x: 112, y: 140 } })], order: 1, cues: ['Spingi le anche in alto e stringi i glutei', 'Scendi controllato'] },
  bridge: { props: ['mat'], keys: [P({ t: 185, n: 185, th: 35, sh: -80, ua: -5, fa: -5, anchor: { j: 'shoulder', x: 100, y: 186 } }), P({ t: 200, n: 195, th: 20, sh: -88, ua: -20, fa: -20, anchor: { j: 'shoulder', x: 100, y: 186 } })], order: 1, cues: ['Solleva il bacino stringendo i glutei', 'Scendi lento'] },
  kickback_leg: { props: ['cableAnkle'], keys: [P({ t: 70, n: 60, ua: -40, fa: -20, th: -95, sh: -95, th2: -90, sh2: -90, anchor: { j: 'ankle2', x: 165, y: AY } }), P({ t: 70, n: 60, ua: -40, fa: -20, th: -160, sh: -150, th2: -90, sh2: -90, anchor: { j: 'ankle2', x: 165, y: AY } })], order: 1, cues: ['Spingi la gamba indietro e stringi il gluteo', 'Torna controllato'] },
  abduction: { props: ['seatF'], keys: [FSEAT({ thR: -90, shR: -90, thS: 0.35 }), FSEAT({ thR: -35, shR: -90, thS: 0.8 })], order: 1, front: true, cues: ['Apri le gambe e stringi', 'Richiudi lento'] },
  calf: { props: ['step'], keys: [P({ ft: -10, anchor: { j: 'toe', x: 175, y: 182 } }), P({ ft: 38, anchor: { j: 'toe', x: 175, y: 182 } })], order: 1, cues: ['Sali sulle punte il più possibile', 'Scendi allungando bene il polpaccio'] },
  calf_seated: { props: ['seat'], keys: [SEAT({ ft: 0, ua: -60, fa: 0 }), SEAT({ ft: 35, ua: -60, fa: 0 })], order: 1, cues: ['Sali sulle punte', 'Scendi lento'] },
  burpee: { props: ['mat'], seq: true, keys: [
    P({ anchor: { j: 'ankle', x: 175, y: AY } }),
    P({ t: 40, n: 0, th: -20, sh: -115, ua: -80, fa: -90, anchor: { j: 'ankle', x: 175, y: AY } }),
    P({ t: 160, n: 150, ua: -90, fa: -90, th: -20, sh: -20, ft: -70, anchor: { j: 'hand', x: 140, y: 197 } }),
    P({ t: 40, n: 0, th: -20, sh: -115, ua: -80, fa: -90, anchor: { j: 'ankle', x: 175, y: AY } }),
    P({ ua: 80, fa: 85, ft: -30, anchor: { j: 'ankle', x: 175, y: 182 } })],
    dur: [0.8, 0.8, 0.8, 0.8, 0.8], cues: ['Scendi e appoggia le mani', 'Porta i piedi indietro in plank', 'Riporta i piedi sotto', 'Salta con le braccia in alto', 'Atterra morbido'] },
  jumping_jack: { props: [], keys: [F({}), F({ uaR: 60, faR: 76, thR: -70, shR: -70, anchor: { j: 'feet', x: 160, y: 190 } })], dur: [0.6, 0.6], front: true, cues: ['Salta aprendo gambe e braccia', 'Salta richiudendo'] },
  mountain: { props: ['mat'], seq: true, keys: [
    P({ t: 160, n: 150, ua: -90, fa: -90, th: -20, sh: -20, ft: -70, anchor: { j: 'hand', x: 100, y: 197 } }),
    P({ t: 160, n: 150, ua: -90, fa: -90, th: -160, sh: -75, th2: -20, sh2: -20, ft: -70, anchor: { j: 'hand', x: 100, y: 197 } }),
    P({ t: 160, n: 150, ua: -90, fa: -90, th: -20, sh: -20, ft: -70, anchor: { j: 'hand', x: 100, y: 197 } }),
    P({ t: 160, n: 150, ua: -90, fa: -90, th: -20, sh: -20, th2: -160, sh2: -75, ft: -70, anchor: { j: 'hand', x: 100, y: 197 } })],
    dur: [0.6, 0.6, 0.6, 0.6], cues: ['Ginocchio destro al petto', 'Torna in plank', 'Ginocchio sinistro al petto', 'Torna in plank'] },
  swing: { props: [], keys: [P({ t: 25, n: 0, th: -62, sh: -100, ua: -112, fa: -118 }), P({ ua: 0, fa: 2 })], dur: [0.9, 0.9], cues: ['Spingi le anche avanti con forza', 'Lascia scendere il peso tra le gambe'] },
  wrist_curl: { props: ['seat'], keys: [SEAT({ ua: -62, fa: -14 }), SEAT({ ua: -62, fa: 14 })], order: 1, cues: ['Fletti il polso portando il peso in alto', 'Scendi lento fino in fondo'] },
  shrug: { props: [], keys: [F({ uaR: -86, faR: -88 }), F({ tS: 1.07, uaR: -86, faR: -88 })], order: 1, front: true, cues: ['Alza le spalle verso le orecchie', 'Scendi lento'] },
  rot_ext: { props: [], keys: [F({ uaR: 0, faR: -88 }), F({ uaR: 0, faR: 88 })], order: 1, front: true, cues: ['Ruota il braccio in alto, gomito fermo', 'Torna giù lento'] },
  jump: { props: [], seq: true, keys: [
    P({ t: 60, n: 45, th: -15, sh: -112, ua: -150, fa: -150, anchor: { j: 'ankle', x: 160, y: AY } }),
    P({ ua: 80, fa: 85, ft: -40, anchor: { j: 'ankle', x: 160, y: 168 } }),
    P({ t: 62, n: 48, th: -18, sh: -110, ua: -20, fa: -10, anchor: { j: 'ankle', x: 160, y: AY } })],
    dur: [0.55, 0.45, 0.7], cues: ['Carica: anche indietro, braccia dietro', 'Salta esplosivo, braccia in alto', 'Atterra morbido piegando le gambe'] },
  clean: { props: [], seq: true, keys: [
    P({ t: 40, n: 30, th: -30, sh: -105 }), P({ t: 95, n: 92, ua: -95, fa: -95, ft: 25, anchor: { j: 'toe', x: 186, y: 199 } }),
    P({ t: 72, n: 70, th: -15, sh: -112, ua: 15, fa: 160 }), P({ ua: 15, fa: 160 })],
    dur: [0.9, 0.5, 0.7, 0.9], cues: ['Stacco: schiena neutra', 'Estensione esplosiva di anche e gambe', 'Ricevi il bilanciere sulle spalle in piegata', 'Alzati in piedi'] },
  snatch: { props: [], seq: true, keys: [
    P({ t: 40, n: 30, th: -30, sh: -105, ua: -100, fa: -100 }), P({ t: 95, n: 92, ua: -95, fa: -95, ft: 25, anchor: { j: 'toe', x: 186, y: 199 } }),
    P({ t: 66, n: 55, th: -15, sh: -112, ua: 104, fa: 104 }), P({ ua: 96, fa: 96 })],
    dur: [0.9, 0.5, 0.7, 0.9], cues: ['Presa larga, schiena neutra', 'Estensione esplosiva', 'Ricevi il peso sopra la testa in piegata', 'Alzati con le braccia tese'] },
  thruster: { props: [], seq: true, keys: [P({ t: 72, n: 70, th: -15, sh: -112, ua: 15, fa: 160 }), P({ ua: 15, fa: 160 }), P({ ua: 92, fa: 92 })],
    dur: [0.8, 0.6, 0.9], cues: ['Squat frontale', 'Risali con forza', 'Spingi il peso sopra la testa'] },
  row_inverted: { props: ['lowbar'], keys: [P({ t: 160, n: 160, th: -20, sh: -20, ft: 10, ua: 90, fa: 90, anchor: { j: 'ankle', x: 245, y: 195 } }), P({ t: 148, n: 148, th: -32, sh: -32, ft: 10, ua: 63, fa: 171, anchor: { j: 'ankle', x: 245, y: 195 } })], order: 1, cues: ['Tira il petto verso la sbarra, corpo dritto', 'Scendi a braccia tese'] },
  wall_sit: { props: ['wall'], keys: [P({ t: 92, n: 90, th: 0, sh: -90, ua: -80, fa: -80, anchor: { j: 'hip', x: 128, y: 155 } }), P({ t: 91, n: 90, th: 0, sh: -90, ua: -80, fa: -80, anchor: { j: 'hip', x: 128, y: 155 } })], dur: [2, 2], cues: ['Schiena al muro, cosce parallele a terra', 'Respira e mantieni'] },
  high_knees: { props: [], seq: true, keys: [
    P({ t: 92, th: 0, sh: -95, th2: -92, sh2: -92, ua: -150, fa: -40, ua2: -40, fa2: 60, anchor: { j: 'ankle2', x: 160, y: AY } }),
    P({ t: 92, th: -92, sh: -92, th2: 0, sh2: -95, ua: -40, fa: 60, ua2: -150, fa2: -40, anchor: { j: 'ankle', x: 160, y: AY } })],
    dur: [0.45, 0.45], cues: ['Ginocchio alto, braccio opposto avanti', 'Cambia gamba, atterra morbido'] },
  superman: { props: ['mat'], keys: [PRONE({ ua: 180, fa: 180, ft: -80, anchor: { j: 'hip', x: 170, y: 186 } }), PRONE({ t: 170, n: 175, ua: 168, fa: 168, th: 8, sh: 8, ft: -70, anchor: { j: 'hip', x: 170, y: 186 } })], order: 1, cues: ['Solleva braccia, petto e gambe insieme', 'Scendi lento'] },
  calf_floor: { props: [], keys: [P({ ft: -10, anchor: { j: 'toe', x: 175, y: 199 } }), P({ ft: 38, anchor: { j: 'toe', x: 175, y: 199 } })], order: 1, cues: ['Sali sulle punte il più possibile', 'Scendi lento'] },
  sit_stand: { props: ['chair'], keys: [P({ t: 100, n: 92, th: 0, sh: -90, ua: 0, fa: 0, anchor: { j: 'ankle', x: 192, y: AY } }), P({ ua: 0, fa: 0, anchor: { j: 'ankle', x: 192, y: AY } })], order: 1, cues: ['Alzati spingendo coi talloni, senza mani', 'Siediti piano, sfiora la sedia'] },
  desk_pushup: { props: ['desk'], keys: [P({ t: 135, n: 130, ua: 225, fa: 225, th: -45, sh: -45, ft: -80, anchor: { j: 'hand', x: 86, y: 136 } }), P({ t: 150, n: 145, ua: 150, fa: -72, th: -30, sh: -30, ft: -80, anchor: { j: 'hand', x: 86, y: 136 } })], cues: ['Scendi col petto verso il bordo, corpo dritto', 'Spingi fino a braccia tese'] },
  scap_squeeze: { props: [], keys: [P({ ua: -10, fa: 0 }), P({ ua: 205, fa: 20 })], order: 1, cues: ['Gomiti indietro, stringi le scapole', 'Rilascia avanti'] },
  arm_circles: { props: [], seq: true, keys: [F({ uaR: 0, faR: 0 }), F({ uaR: 14, faR: 14 }), F({ uaR: 0, faR: 0 }), F({ uaR: -14, faR: -14 })], dur: [0.5, 0.5, 0.5, 0.5], front: true, cues: ['Piccoli cerchi', 'Braccia all\'altezza delle spalle', 'Spalle basse', 'Respira'] },
  walk: { props: [], seq: true, keys: [
    P({ th: -68, sh: -98, th2: -112, sh2: -100, ua: -112, fa: -95, ua2: -68, fa2: -50, anchor: { j: 'hip', x: 160, y: 114 } }),
    P({ th: -112, sh: -100, th2: -68, sh2: -98, ua: -68, fa: -50, ua2: -112, fa2: -95, anchor: { j: 'hip', x: 160, y: 114 } })],
    dur: [0.6, 0.6], cues: ['Passo svelto', 'Braccia che accompagnano'] },
  neck_tilt: { props: [], keys: [F({ hx: 9 }), F({ hx: -9 })], dur: [2.5, 2.5], front: true, cues: ['Orecchio verso la spalla destra, spalle basse', 'Lento verso l\'altro lato'] },
  chest_open: { props: [], keys: [P({ ua: -100, fa: -100 }), P({ t: 95, n: 100, ua: -135, fa: -128 })], dur: [2.5, 2.5], cues: ['Mani dietro, apri il petto', 'Rilassa e ripeti'] },
  side_bend: { props: [], keys: [F({ uaR: 82, faR: 88, lean: 0 }), F({ uaR: 82, faR: 88, lean: 16 })], dur: [2.5, 2.5], front: true, cues: ['Braccia in alto, piegati di lato', 'Torna al centro e cambia lato'] },
  twist_chair: { props: ['seatF'], keys: [FSEAT({ uaR: -55, faR: -100, uaL: -30, faL: -60 }), FSEAT({ uaR: -150, faR: -120, uaL: -125, faL: -80 })], dur: [2, 2], front: true, cues: ['Ruota il busto da un lato', 'Ruota dall\'altro lato, schiena dritta'] },
  back_ext: { props: [], keys: [P({ ua: -115, fa: -20 }), P({ t: 104, n: 112, ua: -128, fa: -30 })], dur: [2, 2], cues: ['Bacino avanti, busto un po\' indietro', 'Torna dritto'] },
  ham_stretch: { props: [], keys: [P({ ua: -90, fa: -90 }), P({ t: 22, n: 0, th: -84, sh: -93, ua: -100, fa: -100 })], dur: [2.5, 2.5], cues: ['Anche indietro, schiena lunga', 'Risali lento'] },
  hip_flexor: { props: ['mat'], keys: [P({ t: 88, th: -15, sh: -95, th2: -110, sh2: 180, ft2: 180, ua: -90, fa: -90, anchor: { j: 'ankle', x: 205, y: AY } }), P({ t: 95, n: 95, th: -8, sh: -98, th2: -120, sh2: 178, ft2: 180, ua: -90, fa: -90, anchor: { j: 'ankle', x: 205, y: AY } })], dur: [2.5, 2.5], cues: ['Bacino avanti, gluteo stretto', 'Rilassa e ripeti'] },
  cat_cow: { props: ['mat'], keys: [P({ t: 165, n: 210, ua: -92, fa: -92, th: -90, sh: 0, ft: 0, anchor: { j: 'hip', x: 190, y: 155 } }), P({ t: 167, n: 150, ua: -92, fa: -92, th: -90, sh: 0, ft: 0, anchor: { j: 'hip', x: 190, y: 155 } })], dur: [2.5, 2.5], cues: ['Espira: schiena tonda, mento al petto', 'Inspira: pancia giù, sguardo avanti'] },
  child_pose: { props: ['mat'], keys: [P({ t: 200, n: 205, ua: 180, fa: 180, th: -132, sh: 0, ft: 0, anchor: { j: 'knee', x: 182, y: 194 } }), P({ t: 196, n: 200, ua: 178, fa: 178, th: -132, sh: 0, ft: 0, anchor: { j: 'knee', x: 182, y: 194 } })], dur: [3, 3], cues: ['Busto a terra, braccia lunghe', 'Respira profondo e rilassa'] }
};

/* esercizio -> animazione */
const ANIM_FOR = {
  panca_piana_bil: 'bench_press', panca_inclinata_bil: 'incline_press', panca_piana_man: 'bench_press', panca_inclinata_man: 'incline_press',
  croci_man: 'fly', chest_press: 'chest_press', pec_deck: 'fly', croci_cavi: 'fly', piegamenti: 'pushup',
  stacco_bil: 'deadlift', rematore_bil: 'row_bent', rematore_man: 'row_db', pullover_man: 'pullover', lat_machine: 'lat_pull',
  pulley: 'row_seated', row_machine: 'row_seated', trazioni: 'pullup', iperestensioni: 'hyperext',
  military_bil: 'ohp', lento_man: 'ohp', alzate_laterali: 'lateral', alzate_frontali: 'front_raise', alzate_posteriori: 'rear_fly',
  shoulder_press_mac: 'ohp', laterali_cavi: 'lateral', face_pull: 'face_pull', tirate_mento: 'upright_row',
  curl_bil: 'curl', curl_man: 'curl', curl_martello: 'curl', curl_concentrato: 'curl_seated', curl_cavi: 'curl', curl_scott: 'curl_scott',
  french_press: 'skull', panca_stretta: 'bench_press', estensioni_man: 'overhead_ext', kickback: 'kickback', pushdown: 'pushdown',
  dip_machine: 'dip', dip: 'dip', crunch: 'crunch', crunch_macchina: 'crunch_machine', crunch_cavi: 'crunch_cable', plank: 'plank',
  leg_raise: 'leg_raise', russian_twist: 'twist', squat_bil: 'squat_back', front_squat: 'squat_front', affondi_man: 'lunge',
  goblet_squat: 'squat_goblet', bulgarian_man: 'bulgarian', step_up: 'stepup', leg_press: 'leg_press', leg_extension: 'leg_ext',
  hack_squat: 'squat_bw', squat_corpo: 'squat_bw', stacco_rumeno_bil: 'rdl', stacco_rumeno_man: 'rdl', leg_curl: 'leg_curl_lying',
  leg_curl_seduto: 'leg_curl_seated', good_morning: 'good_morning', hip_thrust_bil: 'hip_thrust', hip_thrust_man: 'hip_thrust',
  glute_machine: 'kickback_leg', abductor: 'abduction', ponte_glutei: 'bridge', calf_piedi: 'calf', calf_man: 'calf', calf_bil: 'calf',
  calf_seduto: 'calf_seated', burpees: 'burpee', jumping_jack: 'jumping_jack', mountain_climber: 'mountain', swing_man: 'swing',
  affondi_corpo: 'lunge', piegamenti_ginocchia: 'pushup', sedia_muro: 'wall_sit', skip: 'high_knees', superman: 'superman', calf_corpo: 'calf_floor', dip_sedia: 'dip',
  alzati_siediti: 'sit_stand', piegamenti_scrivania: 'desk_pushup', retrazione_scapole: 'scap_squeeze', circonduzioni_braccia: 'arm_circles', cammina: 'walk',
  allunga_collo: 'neck_tilt', apri_petto: 'chest_open', allungamento_laterale: 'side_bend', torsione_seduta: 'twist_chair', estensione_schiena: 'back_ext',
  allunga_femorali: 'ham_stretch', allunga_flessori: 'hip_flexor', gatto_mucca: 'cat_cow', posizione_bambino: 'child_pose'
};

/* ---------- cinematica ---------- */
function solveSide(p) {
  const rl = p.rel ? p.t - 90 : 0;
  const J = {};
  J.hip = [0, 0];
  J.shoulder = add(J.hip, vec(p.t, LEN.t));
  J.head = add(J.shoulder, vec(p.n, LEN.n + 9));
  const arm = (ua, fa) => { const e = add(J.shoulder, vec(ua + rl, LEN.ua * p.uaS)); return [e, add(e, vec(fa + rl, LEN.fa * p.faS))]; };
  const leg = (th, sh, ft) => { const k = add(J.hip, vec(th, LEN.th)); const a = add(k, vec(sh, LEN.sh)); return [k, a, add(a, vec(ft, LEN.ft))]; };
  [J.elbow, J.hand] = arm(p.ua, p.fa);
  [J.elbow2, J.hand2] = arm(p.ua2 == null ? p.ua : p.ua2, p.fa2 == null ? p.fa : p.fa2);
  [J.knee, J.ankle, J.toe] = leg(p.th, p.sh, p.ft);
  [J.knee2, J.ankle2, J.toe2] = leg(p.th2 == null ? p.th : p.th2, p.sh2 == null ? p.sh : p.sh2, p.ft2 == null ? p.ft : p.ft2);
  return J;
}
function solveFront(p) {
  const J = {}, sw = 18, hw = 8, tl = LEN.t * p.tS;
  J.hip = [0, 0];
  J.sh = [0, -tl];
  J.head = [0, -tl - 21 * (p.tS < 1 ? 0.75 : 1)];
  J.shoulderR = [sw, -tl]; J.shoulderL = [-sw, -tl];
  J.hipR = [hw, 0]; J.hipL = [-hw, 0];
  const mir = a => 180 - a;
  const uaL = p.uaL == null ? mir(p.uaR) : p.uaL, faL = p.faL == null ? mir(p.faR) : p.faL;
  const thL = p.thL == null ? mir(p.thR) : p.thL, shL = p.shL == null ? mir(p.shR) : p.shL;
  const arm = (s, ua, fa) => { const e = add(s, vec(ua, LEN.ua * p.uaS)); return [e, add(e, vec(fa, LEN.fa))]; };
  [J.elbowR, J.handR] = arm(J.shoulderR, p.uaR, p.faR);
  [J.elbowL, J.handL] = arm(J.shoulderL, uaL, faL);
  const leg = (h, th, sh) => { const k = add(h, vec(th, LEN.th * p.thS)); return [k, add(k, vec(sh, LEN.sh))]; };
  [J.kneeR, J.ankleR] = leg(J.hipR, p.thR, p.shR);
  [J.kneeL, J.ankleL] = leg(J.hipL, thL, shL);
  if (p.hx) J.head = [J.head[0] + p.hx, J.head[1] + Math.abs(p.hx) * 0.25];
  if (p.lean) { // busto inclinato di lato (ruota tutto quello sopra il bacino)
    const c = Math.cos(rad(p.lean)), sn = Math.sin(rad(p.lean));
    ['sh', 'head', 'shoulderR', 'shoulderL', 'elbowR', 'elbowL', 'handR', 'handL'].forEach(k => { const [x, y] = J[k]; J[k] = [x * c - y * sn, x * sn + y * c]; });
  }
  return J;
}
/* posizione del bacino per ogni fotogramma chiave (rispettando l'appoggio) */
function rootOf(p) {
  const J = p.f ? solveFront(p) : solveSide(p), a = p.anchor;
  if (!a) return p.r || [160, 120];
  let pt;
  if (a.j === 'feet') pt = [(J.ankleR[0] + J.ankleL[0]) / 2, Math.max(J.ankleR[1], J.ankleL[1])];
  else if (a.j === 'hands') pt = [(J.handR[0] + J.handL[0]) / 2, Math.min(J.handR[1], J.handL[1])];
  else pt = J[a.j];
  return [a.x - pt[0], a.y - pt[1]];
}
function lerpPose(a, b, k) {
  const o = {};
  for (const key in a) {
    if (typeof a[key] === 'number') o[key] = a[key] + ((b[key] == null ? a[key] : b[key]) - a[key]) * k;
    else o[key] = a[key];
  }
  for (const key in b) if (o[key] == null && typeof b[key] === 'number') o[key] = b[key];
  return o;
}
const ease = k => 0.5 - Math.cos(Math.PI * k) / 2;

/* ---------- disegno ---------- */
function seg(a, b, w, col, op) { return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"' + (op != null ? ' stroke-opacity="' + op + '"' : '') + '/>'; }
function dot(p, r, col, op) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r + '" fill="' + col + '"' + (op != null ? ' fill-opacity="' + op + '"' : '') + '/>'; }
const TR = (p, o) => [p[0] + o[0], p[1] + o[1]];

function hiOf(e) {
  const h = {}; if (!e) return h;
  h[e.m] = 1; (e.s || []).forEach(m => { if (!h[m]) h[m] = 0.45; }); return h;
}
const ACC = 'var(--accent)';

function drawSide(p, root, e, def) {
  const J0 = solveSide(p), J = {}; for (const k in J0) J[k] = TR(J0[k], root);
  const hi = hiOf(e), near = 'var(--mq)', far = 'var(--mq2)', out = [];
  const tdir = vec(p.t, 1), front = [tdir[1] * -1 * -1, tdir[0] * -1 * -1];
  // normale "davanti" = direzione del busto ruotata di -90° (schermo)
  const nf = [-(-tdir[1]), -tdir[0]]; // [sin, -cos] in coordinate schermo
  const nrm = [Math.sin(rad(p.t)), Math.cos(rad(p.t))];
  const along = (k, off) => [J.hip[0] + (J.shoulder[0] - J.hip[0]) * k + nrm[0] * off, J.hip[1] + (J.shoulder[1] - J.hip[1]) * k + nrm[1] * off];
  const segCol = m => hi[m] ? ACC : null;
  // arto lontano
  out.push(seg(J.hip, J.knee2, 15, far), seg(J.knee2, J.ankle2, 11, far), seg(J.ankle2, J.toe2, 7, far));
  out.push(seg(J.shoulder, J.elbow2, 10, far), seg(J.elbow2, J.hand2, 8, far));
  // busto
  out.push(seg(J.hip, J.shoulder, 25, near), dot(J.hip, 13, near));
  // muscoli del busto evidenziati
  if (hi.petto) out.push(dot(along(0.78, 6), 9, ACC, hi.petto));
  if (hi.addome) out.push(dot(along(0.38, 6), 8, ACC, hi.addome));
  if (hi.dorso) out.push(dot(along(0.62, -6), 10, ACC, hi.dorso));
  if (hi.glutei) out.push(dot(along(0.02, -6), 10, ACC, hi.glutei));
  // testa e collo
  out.push(seg(J.shoulder, add(J.shoulder, vec(p.n, LEN.n)), 9, near), dot(J.head, 10.5, near));
  out.push(dot(add(J.head, vec(p.n - 90, 7)), 2.6, 'var(--bg)'));
  // gamba vicina
  const thC = segCol('quadricipiti') || segCol('femorali'), thO = hi.quadricipiti || hi.femorali;
  out.push(seg(J.hip, J.knee, 16, near), thC ? seg(J.hip, J.knee, 10, ACC, thO) : '');
  out.push(seg(J.knee, J.ankle, 12, near), hi.polpacci ? seg(J.knee, J.ankle, 7, ACC, hi.polpacci) : '');
  out.push(seg(J.ankle, J.toe, 7, near));
  // braccio vicino
  const uaO = Math.max(hi.bicipiti || 0, hi.tricipiti || 0);
  out.push(seg(J.shoulder, J.elbow, 11, near), uaO ? seg(J.shoulder, J.elbow, 6, ACC, uaO) : '');
  out.push(seg(J.elbow, J.hand, 9, near), hi.avambracci ? seg(J.elbow, J.hand, 5, ACC, hi.avambracci) : '');
  if (hi.spalle) out.push(dot(J.shoulder, 7.5, ACC, hi.spalle));
  return { svg: out.join(''), J };
}

function drawFront(p, root, e) {
  const J0 = solveFront(p), J = {}; for (const k in J0) J[k] = TR(J0[k], root);
  const hi = hiOf(e), c = 'var(--mq)', out = [];
  const tl = LEN.t * p.tS;
  // gambe
  [['R', 1], ['L', -1]].forEach(([s]) => {
    out.push(seg(J['hip' + s], J['knee' + s], 15, c), seg(J['knee' + s], J['ankle' + s], 11, c));
    const q = hi.quadricipiti || hi.femorali; if (q) out.push(seg(J['hip' + s], J['knee' + s], 9, ACC, q));
    if (hi.polpacci) out.push(seg(J['knee' + s], J['ankle' + s], 6, ACC, hi.polpacci));
    out.push(seg(J['ankle' + s], add(J['ankle' + s], [s === 'R' ? 7 : -7, 2]), 6, c));
  });
  // busto (trapezio arrotondato)
  const h = J.hip, s = J.sh;
  out.push('<path d="M' + (s[0] - 21) + ' ' + (s[1] - 2) + ' Q' + s[0] + ' ' + (s[1] - 8) + ' ' + (s[0] + 21) + ' ' + (s[1] - 2) + ' L' + (h[0] + 13) + ' ' + (h[1] + 4) + ' Q' + h[0] + ' ' + (h[1] + 12) + ' ' + (h[0] - 13) + ' ' + (h[1] + 4) + ' Z" fill="' + c + '" stroke="' + c + '" stroke-width="6" stroke-linejoin="round"/>');
  const at = (k, dx) => [h[0] + dx, h[1] - tl * k];
  if (hi.petto) { out.push(dot(at(0.8, 8), 8, ACC, hi.petto), dot(at(0.8, -8), 8, ACC, hi.petto)); }
  if (hi.addome) out.push('<rect x="' + (h[0] - 6) + '' + '" y="' + (h[1] - tl * 0.62) + '" width="12" height="' + (tl * 0.5) + '" rx="5" fill="' + ACC + '" fill-opacity="' + hi.addome + '"/>');
  if (hi.dorso) { out.push(dot(at(0.6, 15), 6, ACC, hi.dorso), dot(at(0.6, -15), 6, ACC, hi.dorso)); }
  if (hi.glutei) { out.push(dot(at(0.02, 8), 7, ACC, hi.glutei), dot(at(0.02, -8), 7, ACC, hi.glutei)); }
  // testa
  out.push(seg(s, add(s, [0, -10]), 9, c), dot(J.head, 10.5, c));
  // braccia
  ['R', 'L'].forEach(sd => {
    out.push(seg(J['shoulder' + sd], J['elbow' + sd], 10, c), seg(J['elbow' + sd], J['hand' + sd], 8, c));
    const u = Math.max(hi.bicipiti || 0, hi.tricipiti || 0); if (u) out.push(seg(J['shoulder' + sd], J['elbow' + sd], 5, ACC, u));
    if (hi.avambracci) out.push(seg(J['elbow' + sd], J['hand' + sd], 4, ACC, hi.avambracci));
    if (hi.spalle) out.push(dot(J['shoulder' + sd], 7, ACC, hi.spalle));
  });
  return { svg: out.join(''), J };
}

/* attrezzi */
function gearOf(e, def) {
  if (def.gear) return def.gear;
  if (!e) return 'none';
  if (e.id === 'hack_squat' || e.id === 'leg_press' || e.id === 'pec_deck' || e.id === 'abductor' || e.id === 'glute_machine' || e.id === 'leg_extension' || e.id.startsWith('leg_curl') || e.id === 'crunch_macchina' || e.id === 'calf_seduto' || e.id === 'iperestensioni' || e.id === 'dip_machine' || e.id === 'chest_press' || e.id === 'lat_machine' || e.id === 'pulley' || e.id === 'row_machine' || e.id === 'face_pull' || e.id === 'pushdown' || e.id === 'crunch_cavi') return 'none';
  return { bilanciere: 'barbell', manubri: 'dumbbell', macchinari: 'handle', cavi: 'handle', corpo: 'none', kettlebell: 'kettlebell', elastici: 'none', ez: 'barbell', smith: 'barbell', altro: 'none' }[e.eq] || 'none';
}
function drawProps(def, J, front, gear, layer) {
  const pc = 'var(--prop)', pd = 'var(--prop2)', o = [], pr = def.props || [];
  if (layer === 'back') {
    pr.forEach(k => {
      if (k === 'bench') o.push('<rect x="80" y="150" width="130" height="9" rx="3" fill="' + pc + '"/>', seg([100, 159], [100, GY], 6, pd), seg([190, 159], [190, GY], 6, pd));
      if (k === 'benchLow') o.push('<rect x="190" y="150" width="90" height="9" rx="3" fill="' + pc + '"/>', seg([205, 159], [205, GY], 6, pd), seg([265, 159], [265, GY], 6, pd));
      if (k === 'benchBack') o.push('<rect x="50" y="150" width="62" height="9" rx="3" fill="' + pc + '"/>', seg([62, 159], [62, GY], 6, pd), seg([100, 159], [100, GY], 6, pd));
      if (k === 'box') o.push('<rect x="170" y="162" width="55" height="38" rx="4" fill="' + pc + '"/>');
      if (k === 'lowbar') o.push(seg([100, 90], [126, 90], 5, pc), seg([104, 90], [104, GY], 4, pd));
      if (k === 'chair') o.push('<rect x="120" y="166" width="52" height="8" rx="3" fill="' + pc + '"/>', seg([126, 174], [126, GY], 5, pd), seg([166, 174], [166, GY], 5, pd), seg([123, 168], [117, 110], 7, pc));
      if (k === 'desk') o.push('<rect x="36" y="136" width="78" height="8" rx="3" fill="' + pc + '"/>', seg([46, 144], [46, GY], 6, pd), seg([104, 144], [104, GY], 6, pd));
      if (k === 'wall') o.push('<rect x="96" y="40" width="8" height="160" rx="2" fill="' + pc + '"/>');
      if (k === 'step') o.push('<rect x="150" y="183" width="45" height="17" rx="3" fill="' + pc + '"/>');
      if (k === 'mat' || k === 'matF') o.push('<rect x="60" y="197" width="210" height="4" rx="2" fill="' + pc + '"/>');
      if (k === 'seat' && !front) { const h = J.hip; o.push('<rect x="' + (h[0] - 26) + '" y="' + (h[1] + 11) + '" width="46" height="8" rx="3" fill="' + pc + '"/>', seg([h[0] - 4, h[1] + 19], [h[0] - 4, GY], 6, pd), seg([h[0] - 22, h[1] + 11], [h[0] - 22, h[1] - 52], 7, pc)); }
      if (k === 'seatLow') { const h = J.hip; o.push('<rect x="' + (h[0] - 24) + '" y="' + (h[1] + 11) + '" width="44" height="7" rx="3" fill="' + pc + '"/>', seg([h[0], h[1] + 18], [h[0], GY], 6, pd)); }
      if (k === 'seatF' && front) { const h = J.hip; o.push('<rect x="' + (h[0] - 30) + '" y="' + (h[1] + 6) + '" width="60" height="8" rx="3" fill="' + pc + '"/>', seg([h[0], h[1] + 14], [h[0], GY], 6, pd)); }
      if (k === 'incline') { const h = J.hip; const bt = add(h, vec(140, 80)); o.push('<rect x="' + (h[0] - 20) + '" y="' + (h[1] + 11) + '" width="44" height="8" rx="3" fill="' + pc + '"/>', seg(add(h, [-8, 12]), add(bt, [-8, 12]), 8, pc), seg([h[0], h[1] + 19], [h[0], GY], 6, pd)); }
      if (k === 'recline') { const h = J.hip; const bt = add(h, vec(125, 85)); o.push(seg(add(h, [6, 14]), add(bt, [8, 12]), 9, pc), seg([h[0] + 10, h[1] + 16], [h[0] + 10, GY], 6, pd)); }
      if (k === 'padHip') { const h = J.hip; o.push(dot(add(h, vec(-45, 14)), 9, pc), seg(add(h, vec(-45, 14)), [h[0] + 18, GY], 6, pd)); }
      if (k === 'parallels') o.push(seg([J.hand[0] - 30, J.hand[1] + 3], [J.hand[0] + 25, J.hand[1] + 3], 6, pc), seg([J.hand[0] + 18, J.hand[1] + 3], [J.hand[0] + 18, GY], 6, pd));
      if (k === 'pullbar') o.push(seg([95, 27], [225, 27], 6, pc), seg([100, 27], [100, GY], 5, pd), seg([220, 27], [220, GY], 5, pd));
      if (k === 'footplate') o.push(seg([J.ankle[0] + 10, J.ankle[1] - 18], [J.ankle[0] + 10, J.ankle[1] + 8], 6, pc), seg([J.ankle[0] + 10, J.ankle[1] + 8], [J.ankle[0] + 10, GY], 5, pd));
      if (k === 'scott') o.push(seg(add(J.shoulder, vec(-38, 6)), add(J.shoulder, vec(-38, 34)), 9, pc), seg(add(J.shoulder, vec(-38, 34)), [J.shoulder[0] + 24, GY], 5, pd));
    });
    return o.join('');
  }
  // davanti alla figura
  pr.forEach(k => {
    if (k === 'cable' && !front) { const target = [def.cable[0], def.cable[1] == null ? J.hand[1] : def.cable[1]]; o.push(seg(J.hand, target, 1.6, pd), dot(target, 5, pc), seg([target[0] + 6, 0], [target[0] + 6, GY], 5, pd)); }
    if (k === 'cableAnkle') { o.push(seg(J.ankle, [265, 190], 1.6, pd), dot([265, 190], 5, pc), seg([271, 20], [271, GY], 5, pd), seg([J.ankle[0] - 3, J.ankle[1]], [J.ankle[0] + 3, J.ankle[1]], 8, pc)); }
    if (k === 'lever') { const pv = def.leverH ? [def.lever[0], J.hand[1]] : def.lever; o.push(seg(J.hand, pv, 5, pc), dot(pv, 6, pd), seg([def.lever[0], def.lever[1]], [def.lever[0], GY], 6, pd), seg([J.hand[0], J.hand[1] - 9], [J.hand[0], J.hand[1] + 9], 5, pd)); }
    if (k === 'platform') { const a = J.ankle; const d = vec(125, 30); o.push(seg(add(a, [d[0] + 4, d[1] + 4]), add(a, [-d[0] + 4, -d[1] + 4]), 7, pc), seg(add(a, [8, 8]), [a[0] + 40, GY], 5, pd)); }
    if (k === 'padAnkle') o.push(dot(add(J.ankle, [3, -6]), 6, pc));
    if (k === 'hipbar') o.push(dot(add(J.hip, [0, -16]), 19, pd), dot(add(J.hip, [0, -16]), 5, pc));
    if (k === 'latbar' && front) { const l = J.handL, r = J.handR; o.push(seg([l[0] - 14, l[1]], [r[0] + 14, r[1]], 4, pd), seg([(l[0] + r[0]) / 2, l[1]], [(l[0] + r[0]) / 2, 0], 1.6, pd)); }
  });
  // attrezzo in mano
  if (!front) {
    if (gear === 'barbell') o.push(dot(J.hand, 19, pd), dot(J.hand, 15, pc), dot(J.hand, 3.5, pd));
    if (gear === 'dumbbell') o.push(seg(add(J.hand, [-7, 0]), add(J.hand, [7, 0]), 4, pd), dot(add(J.hand, [-7, 0]), 6.5, pc), dot(add(J.hand, [7, 0]), 6.5, pc));
    if (gear === 'handle') o.push(seg(add(J.hand, [0, -7]), add(J.hand, [0, 7]), 5, pd));
    if (gear === 'kettlebell') o.push(seg(J.hand, add(J.hand, [0, 6]), 3, pd), dot(add(J.hand, [0, 11]), 7.5, pc));
  } else {
    const l = J.handL, r = J.handR;
    if (gear === 'barbell') { o.push(seg([l[0] - 40, l[1]], [r[0] + 40, r[1]], 4, pd)); [[l[0] - 32, l[1]], [r[0] + 32, r[1]]].forEach(p => o.push('<rect x="' + (p[0] - 4) + '" y="' + (p[1] - 18) + '" width="8" height="36" rx="2" fill="' + pc + '"/>')); }
    if (gear === 'dumbbell') [l, r].forEach(p => o.push(seg([p[0] - 8, p[1]], [p[0] + 8, p[1]], 4, pd), '<rect x="' + (p[0] - 11) + '" y="' + (p[1] - 6) + '" width="5" height="12" rx="1.5" fill="' + pc + '"/>', '<rect x="' + (p[0] + 6) + '" y="' + (p[1] - 6) + '" width="5" height="12" rx="1.5" fill="' + pc + '"/>'));
    if (gear === 'handle') [l, r].forEach(p => o.push(seg([p[0], p[1] - 6], [p[0], p[1] + 6], 5, pd)));
    if (gear === 'kettlebell') [l, r].forEach(p => o.push(seg(p, [p[0], p[1] + 6], 3, pd), dot([p[0], p[1] + 11], 7, pc)));
  }
  return o.join('');
}

/* ---------- motore dell'animazione ---------- */
function animDef(exId) { return ANIMS[ANIM_FOR[exId]] || ANIMS.curl; }

function timeline(def, speed) {
  // ritorna lista segmenti: {from, to, dur, cue, hold}
  const segs = [], n = def.keys.length, slow = 1 / (speed || 1);
  if (def.seq) {
    for (let i = 0; i < n; i++) segs.push({ a: i, b: (i + 1) % n, dur: (def.dur ? def.dur[i] : 0.8) * slow, cue: def.cues[i] });
    return segs;
  }
  const d = def.dur || [3, 2];
  // order 1: la prima fase è la "spinta/tirata" (2 s), poi ritorno lento (3 s)
  const d0 = def.order === 1 ? (def.dur ? d[0] : 2) : d[0], d1 = def.order === 1 ? (def.dur ? d[1] : 3) : d[1];
  segs.push({ a: 0, b: 0, dur: 0.9 * slow, cue: 'Posizione di partenza', hold: true });
  segs.push({ a: 0, b: 1, dur: d0 * slow, cue: def.cues[0] });
  segs.push({ a: 1, b: 1, dur: 0.6 * slow, cue: 'Pausa e controllo', hold: true });
  segs.push({ a: 1, b: 0, dur: d1 * slow, cue: def.cues[1] });
  return segs;
}

function frameSvg(def, e, ka, kb, k) {
  const pa = def.keys[ka], pb = def.keys[kb];
  const ra = pa._root || (pa._root = rootOf(pa)), rb = pb._root || (pb._root = rootOf(pb));
  const kk = ease(k), p = lerpPose(pa, pb, kk), root = [ra[0] + (rb[0] - ra[0]) * kk, ra[1] + (rb[1] - ra[1]) * kk];
  const front = !!p.f;
  const v2 = typeof drawSide2 === 'function' && mqStyle() !== 'classico';
  const v3 = v2 && mqStyle() === 'realistico' && typeof drawSide3 === 'function';
  const fig = v3 ? (front ? drawFront3(p, root, e) : drawSide3(p, root, e)) : front ? (v2 ? drawFront2(p, root, e) : drawFront(p, root, e)) : (v2 ? drawSide2(p, root, e, def) : drawSide(p, root, e, def));
  const gear = gearOf(e, def);
  const body = '<line x1="0" y1="' + (GY + 1) + '" x2="320" y2="' + (GY + 1) + '" stroke="var(--line)" stroke-width="2"/>' +
    drawProps(def, fig.J, front, gear, 'back') + fig.svg + drawProps(def, fig.J, front, gear, 'front');
  return v3 ? '<g style="--prop:#3a3e45;--prop2:#1f2226;--line:#d5d9df">' + body + '</g>' : body;
}

/* giocatore: monta l'animazione in un contenitore */
const Demo = {
  raf: 0, st: null,
  mount(el, exId, opts) {
    this.stop();
    const e = EX[exId], def = animDef(exId);
    const st = this.st = { el, e, def, speed: (opts && opts.speed) || (el.dataset.compact ? 0.8 : 0.6), t0: performance.now(), paused: false, pausedAt: 0 };
    const compact = el.dataset.compact;
    el.innerHTML = '<div class="demo-stage' + (mqStyle() === 'realistico' ? ' real' : '') + '"><svg viewBox="35 -14 250 218" class="demo-svg"></svg>' + (compact ? '' : '<div class="demo-view">' + (def.keys[0].f ? 'vista frontale' : 'vista laterale') + '</div>') + '</div>' +
      '<div class="demo-cue"><span class="demo-phase"></span><b class="demo-text"></b></div><div class="demo-bar"><i></i></div>' + (compact ? '' :
      '<div class="demo-ctrl"><button class="btn sm ghost" data-demo="pause">Pausa</button>' +
      [0.35, 0.6, 1].map(s => '<button class="btn sm ghost' + (s === st.speed ? ' on' : '') + '" data-demo="speed" data-s="' + s + '">' + (s === 0.35 ? 'Molto lento' : s === 0.6 ? 'Lento' : 'Normale') + '</button>').join('') + '</div>');
    el.onclick = ev => {
      const b = ev.target.closest('[data-demo]'); if (!b) return;
      if (b.dataset.demo === 'pause') { st.paused = !st.paused; if (st.paused) st.pausedAt = performance.now(); else st.t0 += performance.now() - st.pausedAt; b.textContent = st.paused ? 'Riprendi' : 'Pausa'; }
      if (b.dataset.demo === 'speed') { st.speed = +b.dataset.s; st.t0 = performance.now(); el.querySelectorAll('[data-demo=speed]').forEach(x => x.classList.toggle('on', x === b)); }
    };
    const svg = el.querySelector('svg'), txt = el.querySelector('.demo-text'), ph = el.querySelector('.demo-phase'), bar = el.querySelector('.demo-bar i');
    let lastDraw = 0;
    const loop = now => {
      if (!document.body.contains(el)) { this.stop(); return; }
      // Risparmio batteria: al massimo 30 disegni al secondo, nessuno se la pagina è nascosta.
      const skip = document.hidden || now - lastDraw < 33;
      if (!skip) lastDraw = now;
      if (!st.paused && !skip) {
        const segs = timeline(def, st.speed), total = segs.reduce((a, s) => a + s.dur, 0);
        let t = ((now - st.t0) / 1000) % total, i = 0;
        while (t > segs[i].dur && i < segs.length - 1) { t -= segs[i].dur; i++; }
        const s = segs[i], k = s.hold ? 0 : Math.min(1, t / s.dur);
        svg.innerHTML = frameSvg(def, e, s.a, s.b, k);
        if (txt.textContent !== s.cue) txt.textContent = s.cue;
        const label = def.seq ? (i + 1) + '/' + segs.length : s.hold ? 'Fermo' : (Math.round(s.dur / st.speed * st.speed * 10) / 10) + ' s';
        ph.textContent = label;
        bar.style.width = (100 * ((segs.slice(0, i).reduce((a, x) => a + x.dur, 0) + t) / total)) + '%';
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },
  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
};

/* immagine statica (per anteprime e test) */
function demoStill(exId, keyIdx, k) {
  const def = animDef(exId);
  return '<svg viewBox="0 -16 320 224" class="demo-svg">' + frameSvg(def, EX[exId], keyIdx || 0, keyIdx || 0, k || 0) + '</svg>';
}
