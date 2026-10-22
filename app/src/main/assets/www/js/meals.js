/* GYM — alimentazione avanzata: preferenze, ricette fit, piano pasti settimanale, lista della spesa,
   avvisi sui macro e integratori basati sugli studi. */
'use strict';

/* ---------- alimenti in più (valori medi per 100 g) [nome, kcal, P, C, G, porzione] ---------- */
[
  ['Riso integrale (crudo)', 350, 7.5, 73, 2.7, 80], ['Quinoa (cruda)', 368, 14, 64, 6, 70], ['Farro (crudo)', 340, 15, 67, 2.5, 80],
  ['Cous cous (crudo)', 360, 12.8, 72, 0.6, 70], ['Patate dolci', 86, 1.6, 20, 0.1, 200], ['Piadina', 300, 8, 50, 8, 70],
  ['Pasta senza glutine (cruda)', 355, 7, 79, 1.5, 80], ['Pane senza glutine', 250, 3.5, 48, 5, 50], ['Polenta (farina)', 360, 8.5, 77, 2.7, 70],
  ['Cereali corn flakes', 375, 7, 84, 0.9, 30], ['Crackers integrali', 430, 11, 66, 12, 30],
  ['Salmone affumicato', 117, 18, 0, 4.5, 50], ['Gamberi', 85, 18, 0.5, 1, 150], ['Orata', 120, 20, 0, 4, 200], ['Sgombro', 205, 19, 0, 14, 150],
  ['Carne macinata magra 5%', 137, 21, 0, 5, 150], ['Lonza di maiale', 145, 22, 0, 6, 150],
  ['Tofu', 120, 13, 2, 7, 150], ['Tempeh', 192, 19, 9, 11, 100], ['Seitan', 120, 21, 4, 2, 120], ['Edamame', 122, 11, 9, 5, 100],
  ['Hummus di ceci', 177, 8, 14, 10, 50], ['Piselli (surgelati)', 81, 5.4, 14, 0.4, 150],
  ['Skyr', 63, 11, 4, 0.2, 150], ['Kefir', 55, 3.5, 4.5, 2.5, 200], ['Latte senza lattosio', 46, 3.3, 4.8, 1.5, 200], ['Yogurt greco senza lattosio', 60, 10, 4, 0.2, 170],
  ['Bevanda di soia', 40, 3.3, 2.5, 1.8, 200], ['Feta', 264, 14, 4, 21, 50], ['Mozzarella light', 160, 20, 1, 8.5, 125], ['Formaggio spalmabile light', 150, 8, 5, 11, 30],
  ['Proteine vegetali in polvere', 380, 75, 8, 6, 30],
  ['Avocado', 160, 2, 8.5, 14.7, 80], ['Semi di chia', 486, 17, 42, 31, 15], ['Anacardi', 553, 18, 30, 44, 30],
  ['Spinaci', 23, 2.9, 3.6, 0.4, 150], ['Carote', 41, 0.9, 9.6, 0.2, 150], ['Peperoni', 26, 1, 6, 0.3, 150], ['Melanzane', 25, 1, 6, 0.2, 200],
  ['Funghi champignon', 22, 3, 3.3, 0.3, 150], ['Cavolfiore', 25, 2, 5, 0.3, 200], ['Fagiolini', 31, 1.8, 7, 0.2, 200], ['Rucola', 25, 2.6, 3.7, 0.7, 50],
  ['Mirtilli', 57, 0.7, 14.5, 0.3, 100], ['Kiwi', 61, 1.1, 14.7, 0.5, 100], ['Pera', 57, 0.4, 15, 0.1, 150], ['Ananas', 50, 0.5, 13, 0.1, 150],
  ['Datteri secchi', 282, 2.5, 75, 0.4, 30], ['Frutti di bosco (surgelati)', 45, 1, 10, 0.3, 100], ['Uva', 69, 0.7, 18, 0.2, 150],
  ['Cacao amaro', 228, 20, 58, 14, 5], ['Pomodori pelati', 22, 1.2, 3.5, 0.2, 200], ['Passata di pomodoro', 30, 1.5, 5, 0.2, 100], ['Pesto alla genovese', 450, 5, 6, 45, 20],
  ['Succo di barbabietola', 45, 1, 10, 0, 250]
].forEach(([n, kcal, p, c, f, por]) => { if (!FOOD_DB.some(x => x.name === n)) FOOD_DB.push({ id: 'db:' + n, name: n, kcal, p, c, f, serving: por, src: 'db' }); });

/* categorie e restrizioni degli alimenti */
const FOOD_CATS = {
  carne: ['Petto di pollo (crudo)', 'Petto di tacchino (crudo)', 'Manzo magro (crudo)', 'Bresaola', 'Prosciutto crudo', 'Prosciutto cotto', 'Carne macinata magra 5%', 'Lonza di maiale'],
  pesce: ['Tonno al naturale (sgocciolato)', 'Tonno sott\'olio (sgocciolato)', 'Salmone fresco', 'Merluzzo', 'Salmone affumicato', 'Gamberi', 'Orata', 'Sgombro'],
  uova: ['Uovo intero', 'Albume d\'uovo'],
  latticini: ['Latte parzialmente scremato', 'Latte intero', 'Yogurt greco 0%', 'Yogurt greco intero', 'Yogurt bianco intero', 'Mozzarella', 'Parmigiano', 'Ricotta vaccina', 'Fiocchi di latte', 'Skyr', 'Kefir', 'Feta', 'Mozzarella light', 'Formaggio spalmabile light', 'Latte senza lattosio', 'Yogurt greco senza lattosio', 'Proteine in polvere (whey)'],
  vegetali: ['Tofu', 'Tempeh', 'Seitan', 'Edamame', 'Ceci (cotti/in scatola)', 'Lenticchie (cotte)', 'Fagioli (cotti)', 'Hummus di ceci', 'Piselli (surgelati)', 'Bevanda di soia', 'Proteine vegetali in polvere'],
  cereali: ['Pasta di semola (cruda)', 'Pasta integrale (cruda)', 'Riso bianco (crudo)', 'Riso basmati (crudo)', 'Riso integrale (crudo)', 'Quinoa (cruda)', 'Farro (crudo)', 'Cous cous (crudo)', 'Pane comune', 'Pane integrale', 'Fette biscottate', 'Fiocchi d\'avena', 'Gallette di riso', 'Patate', 'Patate dolci', 'Piadina', 'Pasta senza glutine (cruda)', 'Pane senza glutine', 'Polenta (farina)', 'Cereali corn flakes', 'Crackers integrali'],
  verdura: ['Pomodori', 'Zucchine', 'Insalata', 'Broccoli', 'Spinaci', 'Carote', 'Peperoni', 'Melanzane', 'Funghi champignon', 'Cavolfiore', 'Fagiolini', 'Rucola', 'Pomodori pelati', 'Passata di pomodoro'],
  frutta: ['Banana', 'Mela', 'Arancia', 'Fragole', 'Mirtilli', 'Kiwi', 'Pera', 'Ananas', 'Datteri secchi', 'Frutti di bosco (surgelati)', 'Uva', 'Avocado'],
  grassi: ['Olio extravergine d\'oliva', 'Burro', 'Mandorle', 'Noci', 'Burro di arachidi', 'Semi di chia', 'Anacardi', 'Pesto alla genovese'],
  altro: ['Miele', 'Marmellata', 'Cioccolato fondente 70%', 'Cacao amaro', 'Zucchero', 'Succo di barbabietola']
};
const FOOD_CAT_N = { carne: 'Carne', pesce: 'Pesce', uova: 'Uova', latticini: 'Latticini', vegetali: 'Proteine vegetali e legumi', cereali: 'Cereali e patate', verdura: 'Verdura', frutta: 'Frutta', grassi: 'Grassi e frutta secca', altro: 'Dolci e altro' };
const catOfFood = n => Object.keys(FOOD_CATS).find(k => FOOD_CATS[k].includes(n)) || 'altro';
const LACTOSE = ['Latte parzialmente scremato', 'Latte intero', 'Yogurt greco 0%', 'Yogurt greco intero', 'Yogurt bianco intero', 'Ricotta vaccina', 'Fiocchi di latte', 'Skyr', 'Kefir', 'Formaggio spalmabile light', 'Mozzarella', 'Mozzarella light', 'Feta', 'Burro'];
const LACTOSE_SWAP = { 'Latte parzialmente scremato': 'Latte senza lattosio', 'Latte intero': 'Latte senza lattosio', 'Yogurt greco 0%': 'Yogurt greco senza lattosio', 'Yogurt greco intero': 'Yogurt greco senza lattosio', 'Skyr': 'Yogurt greco senza lattosio', 'Fiocchi di latte': 'Yogurt greco senza lattosio', 'Ricotta vaccina': 'Tofu', 'Mozzarella': 'Tofu', 'Mozzarella light': 'Tofu', 'Feta': 'Tofu', 'Formaggio spalmabile light': 'Hummus di ceci', 'Kefir': 'Bevanda di soia', 'Yogurt bianco intero': 'Yogurt greco senza lattosio', 'Burro': 'Olio extravergine d\'oliva' };
const GLUTEN = ['Pasta di semola (cruda)', 'Pasta integrale (cruda)', 'Pane comune', 'Pane integrale', 'Fette biscottate', 'Farro (crudo)', 'Cous cous (crudo)', 'Piadina', 'Seitan', 'Crackers integrali', 'Biscotti frollini', 'Cereali corn flakes', 'Birra'];
const GLUTEN_SWAP = { 'Pasta di semola (cruda)': 'Pasta senza glutine (cruda)', 'Pasta integrale (cruda)': 'Pasta senza glutine (cruda)', 'Pane comune': 'Pane senza glutine', 'Pane integrale': 'Pane senza glutine', 'Fette biscottate': 'Gallette di riso', 'Farro (crudo)': 'Quinoa (cruda)', 'Cous cous (crudo)': 'Quinoa (cruda)', 'Piadina': 'Pane senza glutine', 'Seitan': 'Tofu', 'Crackers integrali': 'Gallette di riso', 'Cereali corn flakes': 'Fiocchi d\'avena' };
const NUTS = ['Mandorle', 'Noci', 'Burro di arachidi', 'Anacardi', 'Pesto alla genovese'];
const DIET_TYPES = { onnivoro: 'Mangio di tutto', pescetariano: 'Pesce sì, carne no', vegetariano: 'Vegetariano (uova e latticini sì)', vegano: 'Vegano' };
function foodAllowed(n, P) {
  const c = catOfFood(n);
  if (P.dislike.includes(n)) return false;
  if (P.diet !== 'onnivoro' && c === 'carne') return false;
  if ((P.diet === 'vegetariano' || P.diet === 'vegano') && c === 'pesce') return false;
  if (P.diet === 'vegano' && (c === 'uova' || c === 'latticini' || n === 'Miele' || n === 'Burro')) return false;
  if (P.noLact && LACTOSE.includes(n)) return false;
  if (P.noGlut && GLUTEN.includes(n)) return false;
  if (P.noNuts && NUTS.includes(n)) return false;
  return true;
}
/* alimento sostitutivo che rispetta le preferenze (o null) */
function foodSwap(n, P) {
  if (foodAllowed(n, P)) return n;
  const tries = [];
  if (P.noLact && LACTOSE_SWAP[n]) tries.push(LACTOSE_SWAP[n]);
  if (P.noGlut && GLUTEN_SWAP[n]) tries.push(GLUTEN_SWAP[n]);
  const c = catOfFood(n), protein = ['carne', 'pesce', 'uova', 'latticini'].includes(c);
  if (protein) tries.push(...(P.diet === 'vegano' ? ['Tofu', 'Tempeh', 'Seitan', 'Lenticchie (cotte)', 'Ceci (cotti/in scatola)'] : P.diet === 'vegetariano' ? ['Uovo intero', 'Tofu', 'Fiocchi di latte', 'Lenticchie (cotte)'] : ['Merluzzo', 'Tonno al naturale (sgocciolato)', 'Salmone fresco', 'Uovo intero']));
  if (n.includes('whey')) tries.unshift('Proteine vegetali in polvere');
  if (n.includes('Latte') || n.includes('Yogurt') || n === 'Skyr' || n === 'Kefir') tries.unshift('Bevanda di soia');
  tries.push(...FOOD_CATS[c]);
  return tries.find(x => foodAllowed(x, P)) || null;
}

/* ---------- preferenze alimentari ---------- */
function foodPrefs() {
  S.foodPrefs = Object.assign({ diet: 'onnivoro', noLact: false, noGlut: false, noNuts: false, like: [], dislike: [], meals: 4, done: false }, S.foodPrefs || {});
  return S.foodPrefs;
}
VIEWS.foodPrefs = () => {
  const P = foodPrefs(), cat = UI.prefCat || 'carne';
  return header('Le tue preferenze', { back: true, noGear: true, sub: 'Per piano pasti e ricette' }) + '<div class="pad">' +
    '<div class="card"><h3>Come mangi?</h3><div class="chips">' + Object.keys(DIET_TYPES).map(k => chip(DIET_TYPES[k], P.diet === k, 'prefDiet', 'data-k="' + k + '"')).join('') + '</div></div>' +
    '<div class="card"><h3>Intolleranze o allergie</h3><div class="chips">' + [['noLact', 'Senza lattosio'], ['noGlut', 'Senza glutine'], ['noNuts', 'Senza frutta a guscio']].map(([k, l]) => chip(l, P[k], 'prefFlag', 'data-k="' + k + '"')).join('') + '</div>' +
      '<p class="small muted">Per allergie vere controlla sempre le etichette: l\'app non può garantire l\'assenza di tracce.</p></div>' +
    '<div class="card"><h3>Cosa ti piace e cosa no</h3><p class="small muted">Tocca un alimento: una volta = ti piace ❤️, due volte = non lo vuoi ✕, tre volte = neutro.</p>' +
      '<div class="chips scroll">' + Object.keys(FOOD_CATS).map(k => chip(FOOD_CAT_N[k], cat === k, 'prefCat', 'data-k="' + k + '"')).join('') + '</div>' +
      '<div class="chips pref-foods">' + FOOD_CATS[cat].map(n => { const st = P.like.includes(n) ? 'like' : P.dislike.includes(n) ? 'no' : ''; return '<button class="chip pf ' + st + '" data-act="prefFood" data-n="' + esc(n) + '">' + (st === 'like' ? '❤️ ' : st === 'no' ? '✕ ' : '') + esc(n.replace(/ \((crud[oa]|cott[ie]|sgocciolato|cotti\/in scatola|surgelati)\)/, '')) + '</button>'; }).join('') + '</div></div>' +
    '<div class="card"><h3>Pasti al giorno</h3><div class="seg">' + [3, 4, 5].map(n => chip(n + ' pasti', P.meals === n, 'prefMeals', 'data-n="' + n + '"')).join('') + '</div><p class="small muted">Lo puoi cambiare ogni volta che crei il piano.</p></div>' +
    '<button class="btn wide big" data-act="prefDone">' + ic('check') + 'Fatto: crea il piano</button></div>';
};

/* ---------- ricette fit ---------- */
const RECIPES = [
  { id: 'porridge', n: 'Porridge proteico con frutti di bosco', m: ['colazione'], min: 8, ing: [['Fiocchi d\'avena', 50], ['Latte parzialmente scremato', 200], ['Proteine in polvere (whey)', 20], ['Frutti di bosco (surgelati)', 100], ['Noci', 10]], s: ['Scalda latte e avena 3–4 minuti mescolando.', 'Fuori dal fuoco aggiungi le proteine e mescola bene.', 'Completa con frutti di bosco e noci.'] },
  { id: 'yogurt_bowl', n: 'Bowl di yogurt greco, avena e mirtilli', m: ['colazione', 'spuntino'], min: 3, ing: [['Yogurt greco 0%', 200], ['Fiocchi d\'avena', 30], ['Mirtilli', 80], ['Miele', 8], ['Mandorle', 10]], s: ['Versa lo yogurt in una ciotola.', 'Aggiungi avena, mirtilli e mandorle a pezzetti.', 'Un filo di miele sopra.'] },
  { id: 'pancake', n: 'Pancake proteici alla banana', m: ['colazione'], min: 12, ing: [['Fiocchi d\'avena', 50], ['Albume d\'uovo', 150], ['Banana', 100], ['Cacao amaro', 5], ['Frutti di bosco (surgelati)', 80]], s: ['Frulla avena, albumi, banana e cacao.', 'Cuoci a cucchiaiate in padella antiaderente, 2 minuti per lato.', 'Servi con i frutti di bosco.'] },
  { id: 'toast_uova', n: 'Toast integrale con uova e avocado', m: ['colazione', 'pranzo'], min: 10, ing: [['Pane integrale', 70], ['Uovo intero', 110], ['Avocado', 50], ['Pomodori', 80]], s: ['Tosta il pane.', 'Cuoci le uova in padella o in camicia.', 'Schiaccia l\'avocado sul pane, aggiungi uova e pomodoro, sale e pepe.'] },
  { id: 'skyr_crunch', n: 'Skyr con granola casalinga', m: ['colazione', 'spuntino'], min: 3, ing: [['Skyr', 170], ['Fiocchi d\'avena', 25], ['Mela', 120], ['Noci', 10]], s: ['Taglia la mela a cubetti.', 'Unisci skyr, avena tostata in padella 2 minuti e noci.'] },
  { id: 'tofu_scramble', n: 'Tofu strapazzato con spinaci', m: ['colazione', 'cena'], min: 10, ing: [['Tofu', 180], ['Spinaci', 120], ['Pane integrale', 60], ['Olio extravergine d\'oliva', 8]], s: ['Sbriciola il tofu in padella con l\'olio e una punta di curcuma.', 'Aggiungi gli spinaci e cuoci 3–4 minuti.', 'Servi con il pane tostato.'] },
  { id: 'fette_ricotta', n: 'Fette biscottate con ricotta e miele', m: ['colazione', 'spuntino'], min: 3, ing: [['Fette biscottate', 30], ['Ricotta vaccina', 100], ['Miele', 10], ['Fragole', 120]], s: ['Spalma la ricotta sulle fette.', 'Un filo di miele e le fragole a parte.'] },
  { id: 'frullato_post', n: 'Frullato post allenamento', m: ['spuntino', 'post'], min: 3, ing: [['Latte parzialmente scremato', 250], ['Banana', 120], ['Proteine in polvere (whey)', 30], ['Fiocchi d\'avena', 30]], s: ['Frulla tutto per 30 secondi.', 'Bevi entro 1–2 ore dall\'allenamento.'] },
  { id: 'pasta_tonno', n: 'Pasta integrale tonno, pomodorini e rucola', m: ['pranzo', 'cena'], min: 15, ing: [['Pasta integrale (cruda)', 80], ['Tonno al naturale (sgocciolato)', 100], ['Pomodori', 150], ['Rucola', 30], ['Olio extravergine d\'oliva', 10]], s: ['Cuoci la pasta.', 'In padella scalda i pomodorini tagliati con l\'olio, aggiungi il tonno.', 'Salta la pasta nel sugo e completa con la rucola.'] },
  { id: 'pollo_riso', n: 'Pollo, riso basmati e zucchine', m: ['pranzo', 'cena'], min: 20, ing: [['Petto di pollo (crudo)', 150], ['Riso basmati (crudo)', 80], ['Zucchine', 200], ['Olio extravergine d\'oliva', 10]], s: ['Cuoci il riso.', 'Cuoci il pollo a striscioline in padella con metà olio.', 'Salta le zucchine a rondelle e unisci tutto.'] },
  { id: 'insalata_ceci', n: 'Insalata di ceci, feta e verdure', m: ['pranzo'], min: 10, ing: [['Ceci (cotti/in scatola)', 200], ['Feta', 50], ['Pomodori', 150], ['Peperoni', 100], ['Olio extravergine d\'oliva', 10], ['Pane integrale', 40]], s: ['Sciacqua i ceci.', 'Taglia verdure e feta a cubetti.', 'Condisci con olio, origano e un po\' di limone.'] },
  { id: 'poke_salmone', n: 'Poke bowl al salmone', m: ['pranzo', 'cena'], min: 20, ing: [['Riso basmati (crudo)', 70], ['Salmone fresco', 120], ['Edamame', 60], ['Carote', 80], ['Avocado', 40]], s: ['Cuoci e raffredda il riso.', 'Taglia il salmone a cubetti (abbattuto o cotto a vapore).', 'Componi la bowl con edamame, carote a julienne e avocado; un filo di salsa di soia.'] },
  { id: 'farro_verdure', n: 'Farro con verdure e mozzarella light', m: ['pranzo'], min: 25, ing: [['Farro (crudo)', 80], ['Melanzane', 150], ['Peperoni', 100], ['Mozzarella light', 100], ['Olio extravergine d\'oliva', 10]], s: ['Cuoci il farro.', 'Griglia melanzane e peperoni.', 'Unisci con la mozzarella a cubetti e l\'olio.'] },
  { id: 'lenticchie_riso', n: 'Lenticchie e riso integrale', m: ['pranzo', 'cena'], min: 25, ing: [['Lenticchie (cotte)', 200], ['Riso integrale (crudo)', 60], ['Carote', 80], ['Passata di pomodoro', 100], ['Olio extravergine d\'oliva', 10]], s: ['Cuoci il riso.', 'Scalda le lenticchie con passata e carote a dadini 10 minuti.', 'Servi insieme con un filo d\'olio a crudo.'] },
  { id: 'wrap_tacchino', n: 'Piadina con tacchino, formaggio light e insalata', m: ['pranzo', 'spuntino'], min: 8, ing: [['Piadina', 70], ['Petto di tacchino (crudo)', 120], ['Formaggio spalmabile light', 25], ['Insalata', 40], ['Pomodori', 80]], s: ['Cuoci il tacchino alla piastra.', 'Spalma il formaggio sulla piadina calda.', 'Farcisci con tacchino, insalata e pomodoro e arrotola.'] },
  { id: 'quinoa_tofu', n: 'Quinoa con tofu croccante e broccoli', m: ['pranzo', 'cena'], min: 20, ing: [['Quinoa (cruda)', 70], ['Tofu', 150], ['Broccoli', 200], ['Olio extravergine d\'oliva', 10]], s: ['Sciacqua e cuoci la quinoa 15 minuti.', 'Rosola il tofu a cubetti finché è dorato.', 'Unisci i broccoli cotti al vapore.'] },
  { id: 'bresaola_rucola', n: 'Bresaola, rucola e grana con pane', m: ['pranzo', 'cena'], min: 5, ing: [['Bresaola', 80], ['Rucola', 50], ['Parmigiano', 20], ['Pane integrale', 60], ['Olio extravergine d\'oliva', 8]], s: ['Disponi la bresaola, sopra rucola e scaglie di grana.', 'Olio e limone, pane a parte.'] },
  { id: 'merluzzo_patate', n: 'Merluzzo al forno con patate e fagiolini', m: ['cena'], min: 35, ing: [['Merluzzo', 200], ['Patate', 250], ['Fagiolini', 200], ['Olio extravergine d\'oliva', 12]], s: ['Patate a spicchi in forno a 200 °C per 20 minuti.', 'Aggiungi il merluzzo con limone ed erbe, altri 12–15 minuti.', 'Fagiolini lessati con un filo d\'olio.'] },
  { id: 'frittata', n: 'Frittata di albumi e zucchine al forno', m: ['cena', 'pranzo'], min: 25, ing: [['Albume d\'uovo', 200], ['Uovo intero', 55], ['Zucchine', 200], ['Parmigiano', 15], ['Pane integrale', 60]], s: ['Sbatti albumi, uovo e parmigiano.', 'Aggiungi le zucchine grattugiate.', 'In forno a 180 °C per 20 minuti; pane a parte.'] },
  { id: 'salmone_quinoa', n: 'Salmone, quinoa e spinaci', m: ['cena'], min: 20, ing: [['Salmone fresco', 150], ['Quinoa (cruda)', 60], ['Spinaci', 150], ['Olio extravergine d\'oliva', 5]], s: ['Cuoci la quinoa.', 'Salmone in padella 4 minuti per lato.', 'Spinaci saltati 2 minuti.'] },
  { id: 'burger_manzo', n: 'Burger di manzo magro con patate dolci', m: ['cena'], min: 30, ing: [['Carne macinata magra 5%', 150], ['Patate dolci', 200], ['Insalata', 60], ['Olio extravergine d\'oliva', 8]], s: ['Patate dolci a spicchi in forno 25 minuti.', 'Forma il burger e cuocilo in padella 4–5 minuti per lato.', 'Insalata condita con olio.'] },
  { id: 'gamberi_cous', n: 'Cous cous con gamberi e verdure', m: ['pranzo', 'cena'], min: 15, ing: [['Cous cous (crudo)', 70], ['Gamberi', 150], ['Zucchine', 150], ['Peperoni', 100], ['Olio extravergine d\'oliva', 10]], s: ['Reidrata il cous cous con acqua bollente.', 'Salta verdure e gamberi in padella 5 minuti.', 'Unisci e condisci.'] },
  { id: 'tempeh_bowl', n: 'Bowl vegana con tempeh e hummus', m: ['pranzo', 'cena'], min: 15, ing: [['Tempeh', 120], ['Riso integrale (crudo)', 60], ['Hummus di ceci', 50], ['Carote', 80], ['Spinaci', 80]], s: ['Cuoci il riso.', 'Rosola il tempeh a fette.', 'Componi la bowl con hummus e verdure.'] },
  { id: 'lonza_verdure', n: 'Lonza di maiale con cavolfiore al forno', m: ['cena'], min: 30, ing: [['Lonza di maiale', 150], ['Cavolfiore', 250], ['Pane integrale', 60], ['Olio extravergine d\'oliva', 10]], s: ['Cavolfiore a cimette in forno 25 minuti con metà olio.', 'Lonza in padella 3–4 minuti per lato.', 'Pane a parte.'] },
  { id: 'pasta_pesto_pollo', n: 'Pasta al pesto con pollo e fagiolini', m: ['pranzo'], min: 20, ing: [['Pasta di semola (cruda)', 80], ['Petto di pollo (crudo)', 120], ['Fagiolini', 150], ['Pesto alla genovese', 15]], s: ['Cuoci pasta e fagiolini insieme.', 'Pollo a cubetti in padella.', 'Unisci tutto con il pesto.'] },
  { id: 'uova_spinaci_patate', n: 'Uova al tegamino, spinaci e patate', m: ['cena'], min: 20, ing: [['Uovo intero', 110], ['Patate', 200], ['Spinaci', 150], ['Olio extravergine d\'oliva', 8]], s: ['Patate lesse o al microonde.', 'Spinaci saltati.', 'Uova al tegamino con poco olio.'] },
  { id: 'fiocchi_crackers', n: 'Fiocchi di latte con crackers e pomodorini', m: ['spuntino', 'cena'], min: 3, ing: [['Fiocchi di latte', 150], ['Crackers integrali', 30], ['Pomodori', 100]], s: ['Condisci i fiocchi di latte con pepe ed erbe.', 'Servi con crackers e pomodorini.'] },
  { id: 'pre_banana', n: 'Pre allenamento: banana e gallette con miele', m: ['spuntino', 'pre'], min: 2, ing: [['Banana', 120], ['Gallette di riso', 20], ['Miele', 10]], s: ['30–60 minuti prima: carboidrati veloci e digeribili.'] },
  { id: 'pre_yogurt', n: 'Pre allenamento: yogurt, miele e datteri', m: ['spuntino', 'pre'], min: 2, ing: [['Yogurt greco 0%', 150], ['Miele', 10], ['Datteri secchi', 20]], s: ['Un\'ora prima dell\'allenamento.'] },
  { id: 'snack_mandorle', n: 'Mela e mandorle', m: ['spuntino'], min: 1, ing: [['Mela', 150], ['Mandorle', 20]], s: ['Spuntino da portare ovunque.'] },
  { id: 'snack_edamame', n: 'Edamame e kiwi', m: ['spuntino'], min: 5, ing: [['Edamame', 120], ['Kiwi', 100]], s: ['Edamame scaldati con un pizzico di sale.'] },
  { id: 'snack_proteico', n: 'Shake proteico vegetale e frutta', m: ['spuntino', 'post'], min: 2, ing: [['Bevanda di soia', 250], ['Proteine vegetali in polvere', 25], ['Banana', 100]], s: ['Frulla tutto.'] },
  { id: 'cioccolato_skyr', n: 'Skyr al cacao con fragole', m: ['spuntino'], min: 3, ing: [['Skyr', 150], ['Cacao amaro', 5], ['Fragole', 150], ['Miele', 5]], s: ['Mescola skyr, cacao e miele.', 'Servi con le fragole.'] },
  { id: 'polenta_funghi', n: 'Polenta con funghi e tofu', m: ['cena'], min: 20, ing: [['Polenta (farina)', 70], ['Funghi champignon', 200], ['Tofu', 120], ['Olio extravergine d\'oliva', 10]], s: ['Polenta istantanea in 5–8 minuti.', 'Funghi trifolati e tofu a cubetti in padella.'] },
  { id: 'orata_cartoccio', n: 'Orata al cartoccio con verdure e pane', m: ['cena'], min: 30, ing: [['Orata', 220], ['Pomodori', 150], ['Zucchine', 150], ['Pane integrale', 60], ['Olio extravergine d\'oliva', 8]], s: ['Metti orata e verdure nella carta forno con olio e limone.', 'Forno a 200 °C per 25 minuti.'] },
  { id: 'sgombro_insalata', n: 'Sgombro con insalata di patate', m: ['pranzo', 'cena'], min: 20, ing: [['Sgombro', 130], ['Patate', 200], ['Fagiolini', 150], ['Olio extravergine d\'oliva', 5]], s: ['Lessa patate e fagiolini.', 'Sgombro alla piastra o al naturale.'] }
];
const RECIPE_MEAL_N = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino', pre: 'Pre allenamento', post: 'Post allenamento' };
const foodByName = n => FOOD_DB.find(f => f.name === n);
/* ricetta adattata alle preferenze e scalata a una quantità di kcal */
function recipeFor(r, P, kcal) {
  let ing = r.ing.map(([n, g]) => [foodSwap(n, P), g]);
  if (ing.some(x => !x[0])) return null;
  ing = ing.filter(([n]) => foodByName(n));
  const fixed = n => ['verdura'].includes(catOfFood(n)) || n.includes('Olio');
  const kc = list => list.reduce((a, [n, g]) => a + foodByName(n).kcal * g / 100, 0);
  if (kcal) {
    const base = kc(ing.filter(([n]) => !fixed(n))), fx = kc(ing.filter(([n]) => fixed(n)));
    const k = base ? Math.max(0.55, Math.min(2, (kcal - fx) / base)) : 1;
    ing = ing.map(([n, g]) => [n, fixed(n) ? g : Math.max(5, Math.round(g * k / 5) * 5)]);
  }
  const tot = ing.reduce((t, [n, g]) => { const f = foodByName(n), q = g / 100; t.kcal += f.kcal * q; t.p += f.p * q; t.c += f.c * q; t.f += f.f * q; return t; }, { kcal: 0, p: 0, c: 0, f: 0 });
  return { r, ing, tot, swapped: ing.some(([n], i) => n !== r.ing[i][0]) };
}
const recipeOk = (r, P) => r.ing.every(([n]) => foodSwap(n, P));
const recipeScore = (r, P) => r.ing.reduce((a, [n]) => a + (P.like.includes(n) ? 1 : 0), 0);

/* ---------- piano pasti settimanale ---------- */
const MEAL_SPLITS = {
  3: [['colazione', 0.25], ['pranzo', 0.40], ['cena', 0.35]],
  4: [['colazione', 0.22], ['pranzo', 0.35], ['spuntino', 0.13], ['cena', 0.30]],
  5: [['colazione', 0.20], ['spuntino', 0.10], ['pranzo', 0.30], ['spuntino', 0.12], ['cena', 0.28]]
};
function mealPlanBuild(meals) {
  const P = foodPrefs(), n = nutritionTargets(), kcal = n.kcal || 2200, split = MEAL_SPLITS[meals] || MEAL_SPLITS[4];
  const rnd = mulberry(Date.now() % 100000), days = [], recent = [];
  const start = new Date(); start.setHours(0, 0, 0, 0);
  for (let d = 0; d < 7; d++) {
    const date = new Date(start); date.setDate(start.getDate() + d);
    const train = S.profile.days.includes(date.getDay());
    const slots = split.map(([slot, pct], i) => {
      const want = slot === 'spuntino' && train && i === split.length - 2 ? 'post' : slot;
      let pool = RECIPES.filter(r => (r.m.includes(want) || r.m.includes(slot)) && recipeOk(r, P));
      if (!pool.length) pool = RECIPES.filter(r => r.m.includes(slot) && recipeOk(r, P));
      pool = pool.map(r => ({ r, s: rnd() + recipeScore(r, P) * 0.6 - (recent.includes(r.id) ? 1.5 : 0) + (want === 'post' && r.m.includes('post') ? 1 : 0) })).sort((a, b) => b.s - a.s);
      const pick = pool[0] ? pool[0].r : null;
      if (pick) { recent.push(pick.id); if (recent.length > 6) recent.shift(); }
      return { slot: want, rid: pick ? pick.id : null, kcal: Math.round(kcal * pct) };
    });
    days.push({ d: dayKey(date), train, slots });
  }
  S.mealPlan = { created: Date.now(), meals, kcal, days };
  save();
}
function planMeal(day, i) { const s = day.slots[i], r = RECIPES.find(x => x.id === s.rid); return r ? recipeFor(r, foodPrefs(), s.kcal) : null; }

/* ---------- avvisi sui macro ---------- */
function macroAlerts(list, n) {
  if (!n.kcal) return [];
  const t = foodTotals(list), h = new Date().getHours(), out = [], P = foodPrefs();
  const pLeft = Math.round(n.protein - t.p), kLeft = Math.round(n.kcal - t.kcal);
  const dayFrac = Math.max(0.15, Math.min(1, (h - 7) / 14));
  if (pLeft > 15) {
    const ideas = ['Yogurt greco 0%', 'Skyr', 'Petto di pollo (crudo)', 'Tonno al naturale (sgocciolato)', 'Fiocchi di latte', 'Tofu', 'Albume d\'uovo', 'Proteine in polvere (whey)', 'Lenticchie (cotte)']
      .map(x => foodSwap(x, P)).filter((x, i, a) => x && a.indexOf(x) === i).map(foodByName).filter(Boolean).slice(0, 3);
    out.push({ k: t.p < n.protein * dayFrac * 0.7 ? 'warn' : 'info', t: 'Ti mancano ' + pLeft + ' g di proteine', d: 'Idee: ' + ideas.map(f => { const g = f.serving; return esc(f.name.replace(/ \(.*\)/, '')) + ' ' + g + ' g (+' + Math.round(f.p * g / 100) + ' g)'; }).join(' · ') });
  } else if (t.p >= n.protein - 15) out.push({ k: 'ok', t: 'Proteine a posto: ' + Math.round(t.p) + ' g', d: 'Ottimo per recupero e massa muscolare.' });
  if (kLeft < -100) out.push({ k: 'warn', t: 'Sei sopra di ' + (-kLeft) + ' kcal', d: dietActive() ? 'Non è un problema per un giorno: domani riparti normale, non compensare saltando i pasti.' : 'Se capita spesso, riduci un po\' le porzioni di condimenti e snack.' });
  if (n.fat && t.f > n.fat * 1.25) out.push({ k: 'info', t: 'Grassi alti oggi (' + Math.round(t.f) + ' g)', d: 'Attenzione a olio, formaggi e frutta secca: sono sani ma molto calorici.' });
  const trainToday = S.profile.days.includes(new Date().getDay());
  if (trainToday && n.carbs && t.c < n.carbs * 0.35 && h >= 12 && h <= 18) out.push({ k: 'info', t: 'Oggi ti alleni: carboidrati bassi', d: 'Uno spuntino con carboidrati 1–2 ore prima (banana, gallette, pane) ti dà energia.' });
  if (h >= 20 && kLeft > 500 && dietActive()) out.push({ k: 'info', t: 'Ancora ' + kLeft + ' kcal disponibili', d: 'Mangiare troppo poco rallenta il recupero: una cena completa va benissimo.' });
  return out;
}

/* ---------- integratori ---------- */
const SUPPLEMENTS = [
  { lv: 'forte', n: 'Creatina monoidrato', dose: '3–5 g al giorno, tutti i giorni (anche nei giorni di riposo). Facoltativo: 20 g/giorno divisi in 4 dosi per 5–7 giorni per saturare prima.', why: 'È l\'integratore più studiato: aumenta forza, potenza e massa magra se ti alleni con i pesi. Sicura negli adulti sani alle dosi indicate. Può dare +1–2 kg di acqua nei muscoli.', src: 0 },
  { lv: 'forte', n: 'Caffeina', dose: '3–6 mg per kg di peso, circa 60 minuti prima dell\'allenamento (un caffè espresso ≈ 60–80 mg); spesso bastano 3 mg/kg. Non superare circa 400 mg al giorno in totale.', why: 'Migliora forza, resistenza e concentrazione. Evitala nel pomeriggio tardi se ti rovina il sonno: dormire bene conta di più.', src: 1 },
  { lv: 'utile', n: 'Proteine in polvere (whey o vegetali)', dose: 'Solo se non arrivi al tuo obiettivo di proteine con il cibo: 20–40 g dopo l\'allenamento o in uno spuntino.', why: 'Non fanno magie: conta il totale della giornata. Gli studi mostrano che oltre circa 1,6 g di proteine per kg al giorno il beneficio in più è minimo.', src: 2 },
  { lv: 'moderata', n: 'Beta-alanina', dose: '4–6 g al giorno divisi in dosi da 1,5–2 g, per almeno 2–4 settimane.', why: 'Utile per sforzi intensi da 1 a 4 minuti (circuiti, HIIT, serie lunghe). Il formicolio sulla pelle è innocuo.', src: 3 },
  { lv: 'moderata', n: 'Nitrati (succo di barbabietola)', dose: 'Circa 500 ml di succo o un concentrato equivalente 2–3 ore prima.', why: 'Aiuta soprattutto negli sport di resistenza; per i pesi le prove sono più deboli.', src: 4 },
  { lv: 'carenza', n: 'Vitamina D, ferro, omega-3', dose: 'Solo dopo gli esami del sangue e su indicazione del medico.', why: 'Servono se sei carente (es. poca esposizione al sole, dieta vegana, poco pesce). Senza carenza non migliorano la prestazione.', src: 4 },
  { lv: 'no', n: 'BCAA e aminoacidi ramificati', dose: 'Non servono se mangi abbastanza proteine.', why: 'Le proteine complete (cibo o whey) contengono già i BCAA e tutti gli altri aminoacidi necessari a costruire muscolo.', src: 5 },
  { lv: 'no', n: 'Bruciagrassi, "termogenici", booster del testosterone, glutammina, ZMA', dose: 'Sconsigliati.', why: 'Non ci sono prove di effetti utili nelle persone sane; alcuni prodotti sono stati trovati contaminati con sostanze vietate.', src: 4 }
];
const SUPP_LV = { forte: ['Prove forti', 'good'], utile: ['Utile in certi casi', 'info'], moderata: ['Prove moderate', 'info'], carenza: ['Solo se carente', 'warn'], no: ['Non serve', 'bad'] };
const SUPP_SOURCES = [
  ['ISSN 2017 – Creatina: sicurezza ed efficacia (Kreider e coll.)', 'https://doi.org/10.1186/s12970-017-0173-z'],
  ['ISSN 2021 – Caffeina e prestazione (Guest e coll.)', 'https://doi.org/10.1186/s12970-020-00383-4'],
  ['Morton 2018 – Meta-analisi integrazione proteica (BJSM)', 'https://pubmed.ncbi.nlm.nih.gov/28698222/'],
  ['ISSN 2015 – Beta-alanina (Trexler e coll.)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4501114/'],
  ['IOC 2018 – Integratori e atleti (Maughan e coll.)', 'https://pubmed.ncbi.nlm.nih.gov/29540367/'],
  ['Wolfe 2017 – BCAA e sintesi proteica: mito o realtà?', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5568273/']
];

/* ---------- vista Alimentazione con schede ---------- */
const NUT_TABS = [['diario', 'Diario'], ['piano', 'Piano pasti'], ['ricette', 'Ricette'], ['spesa', 'Spesa'], ['integratori', 'Integratori']];
function nutTabs() { const t = UI.nutTab || 'diario'; return '<div class="chips scroll tabs nut-tabs">' + NUT_TABS.map(x => chip(x[1], t === x[0], 'nutTab', 'data-t="' + x[0] + '"')).join('') + '</div>'; }
const macroLine = t => Math.round(t.kcal) + ' kcal · P ' + Math.round(t.p) + ' · C ' + Math.round(t.c) + ' · G ' + Math.round(t.f);

function nutPlan() {
  const P = foodPrefs(), MP = S.mealPlan;
  if (!P.done) return '<div class="card hero"><div class="eyebrow">Piano pasti</div><h2>Prima dimmi cosa ti piace</h2><p class="muted">Ti chiedo come mangi, cosa ti piace e cosa no: poi creo un menu di 7 giorni sulle tue calorie, con la lista della spesa.</p><button class="btn big" data-act="go" data-v="foodPrefs">' + ic('edit') + 'Le mie preferenze</button></div>';
  const meals = UI.planMeals || P.meals;
  let out = '<div class="card"><div class="field"><span>Pasti al giorno</span><div class="seg">' + [3, 4, 5].map(k => chip(k + ' pasti', meals === k, 'planMeals', 'data-n="' + k + '"')).join('') + '</div></div>' +
    '<div class="row gap"><button class="btn grow" data-act="planMake">' + ic('sparkle') + (MP ? 'Rifai il piano' : 'Crea il piano della settimana') + '</button><button class="btn ghost" data-act="go" data-v="foodPrefs">' + ic('edit') + 'Gusti</button></div>' +
    '<p class="small muted">Calorie: ' + (nutritionTargets().kcal || '—') + ' kcal/giorno (dal tuo obiettivo). ' + DIET_TYPES[P.diet] + (P.noLact ? ' · senza lattosio' : '') + (P.noGlut ? ' · senza glutine' : '') + '</p></div>';
  if (!MP) return out;
  const di = Math.max(0, Math.min(6, UI.planDay == null ? MP.days.findIndex(d => d.d === todayKey()) : UI.planDay));
  const day = MP.days[di < 0 ? 0 : di];
  out += '<div class="chips scroll">' + MP.days.map((d, i) => { const dt = new Date(d.d + 'T12:00:00'); return chip(WEEKDAYS[dt.getDay()] + ' ' + dt.getDate() + (d.train ? ' 💪' : ''), i === di, 'planDay', 'data-i="' + i + '"'); }).join('') + '</div>';
  let dt = { kcal: 0, p: 0, c: 0, f: 0 };
  out += day.slots.map((s, i) => {
    const m = planMeal(day, i); if (!m) return '';
    dt.kcal += m.tot.kcal; dt.p += m.tot.p; dt.c += m.tot.c; dt.f += m.tot.f;
    return '<div class="card meal-plan"><div class="card-h"><div><div class="eyebrow">' + RECIPE_MEAL_N[s.slot] + '</div><h3>' + esc(m.r.n) + '</h3></div><button class="icon-btn sm" data-act="planSwap" data-i="' + i + '" aria-label="Cambia">' + ic('swap') + '</button></div>' +
      '<p class="small muted">' + m.ing.map(([n, g]) => esc(n.replace(/ \(.*\)/, '')) + ' ' + g + ' g').join(' · ') + '</p>' +
      '<div class="row gap"><span class="small grow">' + macroLine(m.tot) + '</span><button class="btn sm ghost" data-act="recipeOpen" data-id="' + m.r.id + '" data-k="' + s.kcal + '">Ricetta</button><button class="btn sm" data-act="planLog" data-i="' + i + '">Mangiato</button></div></div>';
  }).join('');
  out += '<p class="small muted center">Totale del giorno: ' + macroLine(dt) + '</p>';
  return out;
}
function nutRecipes() {
  const P = foodPrefs(), f = UI.recF || '';
  const list = RECIPES.filter(r => (!f || r.m.includes(f)) && recipeOk(r, P));
  return '<div class="chips scroll">' + [['', 'Tutte'], ['colazione', 'Colazione'], ['pranzo', 'Pranzo'], ['cena', 'Cena'], ['spuntino', 'Spuntini'], ['pre', 'Pre allenamento'], ['post', 'Post allenamento']].map(([k, l]) => chip(l, f === k, 'recF', 'data-k="' + k + '"')).join('') + '</div>' +
    list.map(r => { const m = recipeFor(r, P); return '<button class="card recipe-card" data-act="recipeOpen" data-id="' + r.id + '"><div class="eyebrow">' + r.m.map(x => RECIPE_MEAL_N[x]).join(' · ') + ' · ' + r.min + ' min</div><b>' + esc(r.n) + '</b><small class="muted">' + macroLine(m.tot) + (m.swapped ? ' · adattata ai tuoi gusti' : '') + '</small></button>'; }).join('') +
    (list.length ? '' : '<div class="empty">Nessuna ricetta con questi filtri.</div>');
}
function recipeSheet() {
  const R = UI.recipe, r = RECIPES.find(x => x.id === R.id), P = foodPrefs();
  const m = recipeFor(r, P, R.kcal || 0);
  return '<h3>' + esc(r.n) + '</h3><p class="small muted">' + r.min + ' minuti · ' + macroLine(m.tot) + (R.kcal ? ' · porzione scalata sulle tue calorie' : '') + '</p>' +
    (m.swapped ? '<div class="note small">Ingredienti adattati alle tue preferenze.</div>' : '') +
    '<div class="card flat"><h3>Ingredienti</h3>' + m.ing.map(([n, g]) => '<div class="list-item flat"><div><b>' + esc(n) + '</b></div><span>' + g + ' g</span></div>').join('') + '</div>' +
    '<ol class="steps num">' + r.s.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
    '<div class="field"><span>Aggiungi al diario come</span><div class="seg">' + MEALS_DAY.map(([mk, mn]) => chip(mn, (R.meal || mealNow()) === mk, 'recMeal', 'data-m="' + mk + '"')).join('') + '</div></div>' +
    '<button class="btn wide big" data-act="recipeLog">' + ic('check') + 'Aggiungi al diario</button>';
}
function shoppingList() {
  const MP = S.mealPlan; if (!MP) return null;
  const agg = {};
  MP.days.forEach(day => day.slots.forEach((s, i) => { const m = planMeal(day, i); if (m) m.ing.forEach(([n, g]) => { agg[n] = (agg[n] || 0) + g; }); }));
  const by = {};
  Object.keys(agg).forEach(n => { const c = catOfFood(n); (by[c] = by[c] || []).push([n, agg[n]]); });
  return by;
}
const shopQty = (n, g) => { const f = foodByName(n); if (n.startsWith('Uovo')) return Math.ceil(g / 55) + ' uova'; if (n.includes('Albume')) return g + ' g (≈ ' + Math.ceil(g / 33) + ' albumi)'; return g >= 1000 ? fmtKg(Math.round(g / 100) / 10) + ' kg' : Math.round(g / 10) * 10 + ' g'; };
function nutShop() {
  const by = shoppingList();
  if (!by) return '<div class="empty">Crea prima il piano pasti: la lista della spesa si compila da sola.</div>';
  const chk = S.shopChecked || {};
  return '<p class="small muted">Quantità per i 7 giorni del piano (pesi a crudo). Tocca per spuntare.</p>' +
    Object.keys(FOOD_CATS).filter(c => by[c]).map(c => '<div class="card"><h3>' + FOOD_CAT_N[c] + '</h3>' + by[c].sort((a, b) => b[1] - a[1]).map(([n, g]) => '<button class="list-item btnlike shop' + (chk[n] ? ' done' : '') + '" data-act="shopChk" data-n="' + esc(n) + '"><div><b>' + esc(n.replace(/ \((crud[oa]|cott[ie])\)/, '')) + '</b></div><span>' + shopQty(n, g) + '</span>' + (chk[n] ? ic('check') : '') + '</button>').join('') + '</div>').join('') +
    '<button class="btn ghost wide" data-act="shopShare">' + ic('download') + 'Copia la lista</button>';
}
function nutSupp() {
  const w = S.weights.length ? S.weights[S.weights.length - 1].kg : 0;
  return '<div class="note small">Gli integratori sono un\'aggiunta: prima vengono allenamento, calorie, proteine e sonno. Se hai problemi di salute, assumi farmaci o sei in gravidanza chiedi al medico. Scegli prodotti con certificazione antidoping (es. Informed Sport).</div>' +
    SUPPLEMENTS.map(x => { const lv = SUPP_LV[x.lv]; return '<div class="card supp s-' + lv[1] + '"><div class="eyebrow">' + lv[0] + '</div><h3>' + esc(x.n) + '</h3><p class="small"><b>Quanto:</b> ' + esc(x.dose) + (x.n === 'Caffeina' && w ? ' Per te: ' + Math.min(400, Math.round(w * 3)) + '–' + Math.min(400, Math.round(w * 6)) + ' mg (parti dalla dose più bassa).' : '') + '</p><p class="small muted">' + esc(x.why) + '</p></div>'; }).join('') +
    '<h3 class="sec">Fonti</h3><div class="card">' + SUPP_SOURCES.map(([t, u]) => '<button class="list-item btnlike" data-act="openUrl" data-u="' + u + '"><div><b>' + esc(t) + '</b></div>' + ic('back', 'flip') + '</button>').join('') + '</div>';
}

/* aggiunge gli ingredienti di un pasto al diario di oggi */
function logIngredients(ing, meal) {
  const k = todayKey(); S.food = S.food || {}; const list = S.food[k] = S.food[k] || [];
  ing.forEach(([n, g]) => { const f = foodByName(n); if (f) list.push({ name: f.name, brand: '', g, kcal: f.kcal, p: f.p, c: f.c, f: f.f, meal, t: Date.now(), pid: f.id }); });
  save();
}
function copyText(t) {
  try { if (window.Android && window.Android.copyText) { window.Android.copyText(t); return; } } catch (e) { }
  try { navigator.clipboard.writeText(t); } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (x) { } a.remove(); }
}
