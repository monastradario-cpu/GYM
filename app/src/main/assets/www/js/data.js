/* GYM — dati: muscoli, attrezzi, esercizi, obiettivi, schede e circuiti preimpostati */
'use strict';

const MUSCLES = {
  petto: 'Petto', dorso: 'Dorso', spalle: 'Spalle', bicipiti: 'Bicipiti', tricipiti: 'Tricipiti',
  addome: 'Addome', quadricipiti: 'Quadricipiti', femorali: 'Femorali', glutei: 'Glutei', polpacci: 'Polpacci'
};
const BIG_MUSCLES = ['petto', 'dorso', 'quadricipiti', 'femorali', 'glutei'];

const EQUIP = { manubri: 'Manubri', macchinari: 'Macchinari', bilanciere: 'Bilanciere', corpo: 'Corpo libero' };
const COACH_EQUIP = ['manubri', 'macchinari', 'bilanciere'];

const CARDIO_TYPES = ['Tapis roulant', 'Cyclette', 'Ellittica', 'Vogatore', 'Corsa', 'Step', 'Altro'];

/* E(id, nome, muscolo, secondari, attrezzo, schema di movimento, esecuzione, errori, consiglio, opzioni) */
function E(id, n, m, s, eq, pat, steps, err, tip, o) {
  return Object.assign({ id, n, m, s, eq, pat, steps, err, tip, type: 'reps', comp: false }, o || {});
}
const C = { comp: true };
const T = { type: 'time' };

const EXERCISES = [
  // PETTO
  E('panca_piana_bil', 'Panca piana con bilanciere', 'petto', ['tricipiti', 'spalle'], 'bilanciere', 'spinta_orizz',
    ['Sdraiati con gli occhi sotto il bilanciere, piedi ben piantati a terra.', 'Scapole addotte e depresse, presa poco più larga delle spalle.', 'Scendi controllato fino a sfiorare il petto all\'altezza dei capezzoli.', 'Spingi in alto e leggermente indietro fino a braccia tese.'],
    ['Rimbalzare il bilanciere sul petto.', 'Gomiti aperti a 90°: tienili a circa 45–70° dal busto.', 'Sollevare i glutei dalla panca.'],
    'Usa sempre le sicure o un compagno quando vai pesante.', C),
  E('panca_inclinata_bil', 'Panca inclinata con bilanciere', 'petto', ['spalle', 'tricipiti'], 'bilanciere', 'spinta_inclinata',
    ['Schienale a 30–45°.', 'Scapole strette, presa poco più larga delle spalle.', 'Scendi verso la parte alta del petto.', 'Spingi fino a braccia tese.'],
    ['Inclinazione troppo alta (diventa un lavoro di spalle).', 'Inarcare troppo la schiena.'],
    'Lavora di più la parte alta del petto rispetto alla panca piana.', C),
  E('panca_piana_man', 'Panca piana con manubri', 'petto', ['tricipiti', 'spalle'], 'manubri', 'spinta_orizz',
    ['Siediti con i manubri sulle cosce, sdraiati portandoli al petto.', 'Scapole addotte, polsi dritti.', 'Scendi fino a sentire un buon allungamento del petto.', 'Spingi in alto avvicinando i manubri senza farli sbattere.'],
    ['Scendere troppo poco.', 'Polsi piegati all\'indietro.'],
    'Maggior escursione rispetto al bilanciere: ottima per la massa.', C),
  E('panca_inclinata_man', 'Panca inclinata con manubri', 'petto', ['spalle', 'tricipiti'], 'manubri', 'spinta_inclinata',
    ['Schienale a 30–45°.', 'Manubri all\'altezza del petto alto, gomiti a 45°.', 'Spingi in alto convergendo.', 'Scendi lento e controllato.'],
    ['Schienale troppo verticale.', 'Perdere il controllo in discesa.'],
    'Ottimo primo esercizio se vuoi sviluppare il petto alto.', C),
  E('croci_man', 'Croci con manubri', 'petto', ['spalle'], 'manubri', 'croci',
    ['Sdraiato, manubri sopra il petto, gomiti leggermente flessi.', 'Apri le braccia ad arco fino a sentire l\'allungamento.', 'Richiudi come per abbracciare un albero.'],
    ['Piegare troppo i gomiti (diventa una distensione).', 'Scendere troppo con carichi alti.'],
    'Usa carichi moderati: conta l\'allungamento, non il peso.'),
  E('chest_press', 'Chest press', 'petto', ['tricipiti', 'spalle'], 'macchinari', 'spinta_orizz',
    ['Regola il sedile: maniglie all\'altezza del petto.', 'Schiena appoggiata, scapole strette.', 'Spingi fino a braccia quasi tese.', 'Torna lento senza far toccare i pesi.'],
    ['Sedile troppo alto o basso.', 'Staccare la schiena dallo schienale.'],
    'Sicura anche da soli: ideale per spingere fino a cedimento.', C),
  E('pec_deck', 'Pectoral machine (pec deck)', 'petto', ['spalle'], 'macchinari', 'croci',
    ['Regola il sedile: braccia all\'altezza delle spalle.', 'Chiudi le braccia davanti al petto.', 'Strizza il petto un secondo, poi apri lento.'],
    ['Tirare con le braccia invece che col petto.', 'Aprire troppo dietro la linea delle spalle.'],
    'Ottimo come esercizio finale per "pompare" il petto.'),
  E('croci_cavi', 'Croci ai cavi', 'petto', ['spalle'], 'macchinari', 'croci',
    ['Carrucole in alto, un passo avanti, busto leggermente inclinato.', 'Porta le mani insieme davanti al bacino ad arco.', 'Torna controllato.'],
    ['Usare lo slancio del corpo.', 'Gomiti che si piegano e si stendono.'],
    'Cambiando l\'altezza delle carrucole lavori zone diverse del petto.'),
  E('piegamenti', 'Piegamenti (push-up)', 'petto', ['tricipiti', 'spalle', 'addome'], 'corpo', 'spinta_orizz',
    ['Mani poco più larghe delle spalle, corpo in linea.', 'Scendi col petto fino quasi a terra.', 'Spingi tenendo addome e glutei contratti.'],
    ['Bacino che cade o sale.', 'Gomiti completamente aperti.'],
    'Se sono difficili, fallo con le ginocchia a terra o mani su una panca.', C),

  // DORSO
  E('stacco_bil', 'Stacco da terra', 'dorso', ['femorali', 'glutei', 'avambracci'], 'bilanciere', 'stacco',
    ['Piedi larghezza anche, bilanciere sopra metà piede.', 'Afferra il bilanciere, schiena neutra, petto alto.', 'Spingi il pavimento e porta il bilanciere lungo le gambe.', 'In alto stendi anche e ginocchia insieme, poi riscendi controllato.'],
    ['Schiena curva.', 'Bilanciere lontano dalle gambe.', 'Iperestendere in alto.'],
    'Esercizio tecnico: impara bene con carichi leggeri prima di salire.', C),
  E('rematore_bil', 'Rematore con bilanciere', 'dorso', ['bicipiti', 'spalle'], 'bilanciere', 'tirata_orizz',
    ['Busto inclinato a circa 45°, ginocchia morbide, schiena neutra.', 'Tira il bilanciere verso l\'ombelico.', 'Stringi le scapole in alto, scendi controllato.'],
    ['Raddrizzare il busto a ogni ripetizione.', 'Schiena curva.'],
    'Pensa a portare i gomiti indietro, non a tirare con le mani.', C),
  E('rematore_man', 'Rematore con manubrio', 'dorso', ['bicipiti', 'spalle'], 'manubri', 'tirata_orizz',
    ['Mano e ginocchio sulla panca, schiena parallela al pavimento.', 'Tira il manubrio verso l\'anca.', 'Scendi allungando bene il dorsale.'],
    ['Ruotare il busto per tirare di più.', 'Tirare verso la spalla.'],
    'Un braccio alla volta: utile per correggere squilibri.', C),
  E('pullover_man', 'Pullover con manubrio', 'dorso', ['petto', 'tricipiti'], 'manubri', 'pullover',
    ['Sdraiato sulla panca, manubrio sopra il petto con due mani.', 'Porta il manubrio dietro la testa con gomiti leggermente flessi.', 'Riporta sopra il petto contraendo dorsali.'],
    ['Piegare troppo i gomiti.', 'Scendere troppo con spalle rigide.'],
    'Lavora dorsali e petto insieme: ottimo a fine allenamento.'),
  E('lat_machine', 'Lat machine', 'dorso', ['bicipiti'], 'macchinari', 'tirata_vert',
    ['Cosce bloccate sotto i rulli, presa poco più larga delle spalle.', 'Petto alto, tira la barra verso la parte alta del petto.', 'Risali lento fino a braccia tese.'],
    ['Tirare dietro la nuca.', 'Dondolare col busto.'],
    'Pensa a spingere i gomiti verso i fianchi.', C),
  E('pulley', 'Pulley basso', 'dorso', ['bicipiti'], 'macchinari', 'tirata_orizz',
    ['Seduto, piedi sulle pedane, ginocchia morbide.', 'Busto dritto, tira il triangolo verso l\'ombelico.', 'Stringi le scapole, poi allunga in avanti controllato.'],
    ['Oscillare avanti e indietro col busto.', 'Spalle che salgono verso le orecchie.'],
    'Mantieni il busto quasi fermo per isolare il dorso.', C),
  E('row_machine', 'Rematore alla macchina', 'dorso', ['bicipiti'], 'macchinari', 'tirata_orizz',
    ['Petto contro il supporto, regola l\'altezza.', 'Tira le maniglie portando i gomiti indietro.', 'Stringi le scapole e torna lento.'],
    ['Staccare il petto dal supporto.', 'Movimento troppo corto.'],
    'Alternativa sicura al rematore con bilanciere.', C),
  E('trazioni', 'Trazioni alla sbarra', 'dorso', ['bicipiti'], 'corpo', 'tirata_vert',
    ['Presa prona poco più larga delle spalle.', 'Parti a braccia tese, scapole attive.', 'Sali fino a portare il mento sopra la sbarra.', 'Scendi controllato.'],
    ['Fare mezze ripetizioni.', 'Calciare con le gambe.'],
    'Se non ne fai ancora, usa la macchina assistita o un elastico.', C),
  E('iperestensioni', 'Iperestensioni', 'dorso', ['glutei', 'femorali'], 'macchinari', 'stacco',
    ['Bacino appoggiato al cuscino, caviglie bloccate.', 'Scendi col busto a schiena neutra.', 'Risali fino a busto in linea con le gambe.'],
    ['Salire oltre la linea del corpo.', 'Movimenti a scatto.'],
    'Rinforza la zona lombare: utile per proteggere la schiena.'),

  // SPALLE
  E('military_bil', 'Military press (lento avanti)', 'spalle', ['tricipiti'], 'bilanciere', 'spinta_vert',
    ['In piedi, bilanciere sulle clavicole, presa poco più larga delle spalle.', 'Glutei e addome contratti.', 'Spingi sopra la testa portando la testa leggermente avanti a fine movimento.', 'Riscendi controllato.'],
    ['Inarcare molto la schiena.', 'Spingere in avanti invece che in verticale.'],
    'Base per spalle forti: lavora anche il core.', C),
  E('lento_man', 'Lento avanti con manubri', 'spalle', ['tricipiti'], 'manubri', 'spinta_vert',
    ['Seduto con schienale verticale, manubri all\'altezza delle orecchie.', 'Spingi in alto avvicinando i manubri.', 'Riscendi fino all\'altezza del mento.'],
    ['Inarcare la schiena.', 'Scendere troppo poco.'],
    'Più libertà di movimento rispetto al bilanciere.', C),
  E('alzate_laterali', 'Alzate laterali', 'spalle', [], 'manubri', 'laterali',
    ['In piedi, manubri ai fianchi, gomiti leggermente flessi.', 'Alza lateralmente fino all\'altezza delle spalle.', 'Scendi lento.'],
    ['Usare lo slancio.', 'Alzare le spalle verso le orecchie.', 'Salire oltre l\'altezza delle spalle.'],
    'Pesi leggeri e tante ripetizioni: è il segreto per spalle larghe.'),
  E('alzate_frontali', 'Alzate frontali', 'spalle', ['petto'], 'manubri', 'frontali',
    ['In piedi, manubri davanti alle cosce.', 'Alza davanti a te fino all\'altezza degli occhi.', 'Scendi controllato.'],
    ['Dondolare col busto.', 'Carico troppo alto.'],
    'Se fai già molta panca, ne serve poco.'),
  E('alzate_posteriori', 'Alzate posteriori a busto flesso', 'spalle', ['dorso'], 'manubri', 'posteriori',
    ['Busto quasi parallelo al pavimento, schiena neutra.', 'Apri le braccia lateralmente con gomiti morbidi.', 'Stringi in alto e scendi lento.'],
    ['Tirare con le scapole invece che con le spalle.', 'Busto troppo alto.'],
    'Il deltoide posteriore migliora postura e salute delle spalle.'),
  E('shoulder_press_mac', 'Shoulder press', 'spalle', ['tricipiti'], 'macchinari', 'spinta_vert',
    ['Regola il sedile: maniglie all\'altezza delle spalle.', 'Spingi in alto fino a braccia quasi tese.', 'Torna lento.'],
    ['Staccare la schiena.', 'Bloccare di scatto i gomiti.'],
    'Ottima per spingere pesante in sicurezza.', C),
  E('laterali_cavi', 'Alzate laterali ai cavi', 'spalle', [], 'macchinari', 'laterali',
    ['Carrucola in basso, impugna con la mano opposta.', 'Alza lateralmente fino all\'altezza della spalla.', 'Scendi lento.'],
    ['Inclinare il busto per aiutarsi.', 'Carico eccessivo.'],
    'Il cavo mantiene la tensione per tutto il movimento.'),
  E('face_pull', 'Face pull', 'spalle', ['dorso'], 'macchinari', 'posteriori',
    ['Corda all\'altezza del viso.', 'Tira verso la fronte aprendo le mani ai lati.', 'Gomiti alti, stringi le scapole, torna lento.'],
    ['Gomiti bassi.', 'Tirare col peso del corpo.'],
    'Ottimo per la salute delle spalle: inseriscilo spesso.'),
  E('tirate_mento', 'Tirate al mento', 'spalle', ['dorso'], 'bilanciere', 'laterali',
    ['Presa larga quanto le spalle o più.', 'Tira il bilanciere lungo il corpo fino al petto alto, gomiti alti.', 'Scendi controllato.'],
    ['Presa troppo stretta.', 'Salire oltre il petto se senti fastidio alle spalle.'],
    'Con presa larga è più sicuro per le spalle.'),

  // BICIPITI
  E('curl_bil', 'Curl con bilanciere', 'bicipiti', ['avambracci'], 'bilanciere', 'curl',
    ['In piedi, presa supina larga quanto le spalle.', 'Gomiti fermi ai fianchi, piega fino in alto.', 'Scendi lento fino a braccia tese.'],
    ['Dondolare col busto.', 'Gomiti che vanno avanti.'],
    'Il bilanciere EZ è più comodo per i polsi.'),
  E('curl_man', 'Curl con manubri', 'bicipiti', ['avambracci'], 'manubri', 'curl',
    ['In piedi o seduto, manubri ai fianchi.', 'Piega ruotando il palmo verso l\'alto.', 'Scendi lento.'],
    ['Usare lo slancio.', 'Movimento troppo corto.'],
    'Puoi alternare le braccia per concentrarti meglio.'),
  E('curl_martello', 'Curl a martello', 'bicipiti', ['avambracci'], 'manubri', 'curl',
    ['Presa neutra (palmi che si guardano).', 'Piega senza ruotare il polso.', 'Scendi controllato.'],
    ['Gomiti che si spostano.', 'Busto che oscilla.'],
    'Lavora anche brachiale e avambracci: braccia più spesse.'),
  E('curl_concentrato', 'Curl concentrato', 'bicipiti', [], 'manubri', 'curl',
    ['Seduto, gomito appoggiato all\'interno della coscia.', 'Piega fino in alto e stringi.', 'Scendi lento fino a braccio teso.'],
    ['Aiutarsi con la spalla.', 'Scendere a metà.'],
    'Ottimo come ultimo esercizio per i bicipiti.'),
  E('curl_cavi', 'Curl ai cavi', 'bicipiti', [], 'macchinari', 'curl',
    ['Carrucola in basso con barra.', 'Gomiti fermi, piega fino in alto.', 'Torna lento.'],
    ['Allontanarsi troppo dalla macchina.', 'Gomiti che salgono.'],
    'Tensione costante: ottimo per finire.'),
  E('curl_scott', 'Curl alla panca Scott (macchina)', 'bicipiti', [], 'macchinari', 'curl',
    ['Ascelle appoggiate sul cuscino, braccia distese sul supporto.', 'Piega fino in alto.', 'Scendi lento senza stendere di scatto.'],
    ['Stendere di colpo in basso.', 'Sollevarsi dal sedile.'],
    'Impedisce di barare: isola bene il bicipite.'),

  // TRICIPITI
  E('french_press', 'French press', 'tricipiti', [], 'bilanciere', 'estensione',
    ['Sdraiato, bilanciere (meglio EZ) sopra la fronte a braccia tese.', 'Piega i gomiti portando il bilanciere verso la fronte.', 'Stendi le braccia senza aprire i gomiti.'],
    ['Gomiti che si allargano.', 'Muovere le spalle.'],
    'Scendere leggermente dietro la testa aumenta il lavoro del capo lungo.'),
  E('panca_stretta', 'Panca presa stretta', 'tricipiti', ['petto', 'spalle'], 'bilanciere', 'spinta_orizz',
    ['Come la panca piana con mani alla larghezza delle spalle.', 'Gomiti vicini al busto.', 'Spingi fino a braccia tese.'],
    ['Presa troppo stretta (fa male ai polsi).', 'Gomiti aperti.'],
    'Il miglior esercizio "pesante" per i tricipiti.', C),
  E('estensioni_man', 'Estensioni sopra la testa', 'tricipiti', [], 'manubri', 'estensione',
    ['Seduto, un manubrio tenuto con due mani sopra la testa.', 'Scendi dietro la testa piegando i gomiti.', 'Stendi le braccia.'],
    ['Gomiti molto aperti.', 'Inarcare la schiena.'],
    'Allunga bene il tricipite: ottimo per la massa.'),
  E('kickback', 'Kickback con manubrio', 'tricipiti', [], 'manubri', 'estensione',
    ['Busto inclinato, braccio parallelo al busto.', 'Stendi il gomito portando il manubrio indietro.', 'Torna lento.'],
    ['Gomito che scende.', 'Usare lo slancio.'],
    'Carichi leggeri, contrazione forte in fondo.'),
  E('pushdown', 'Push down ai cavi', 'tricipiti', [], 'macchinari', 'estensione',
    ['Carrucola alta con barra o corda, gomiti ai fianchi.', 'Spingi in basso fino a braccia tese.', 'Risali fino a 90°.'],
    ['Gomiti che si alzano.', 'Usare il peso del corpo.'],
    'Con la corda apri le mani in fondo per contrarre di più.'),
  E('dip_machine', 'Dip machine', 'tricipiti', ['petto'], 'macchinari', 'spinta_vert_giu',
    ['Seduto, maniglie ai lati.', 'Spingi in basso fino a braccia tese.', 'Risali controllato.'],
    ['Spalle che salgono.', 'Movimento troppo corto.'],
    'Alternativa più facile alle parallele.', C),
  E('dip', 'Dip alle parallele', 'tricipiti', ['petto', 'spalle'], 'corpo', 'spinta_vert_giu',
    ['Braccia tese sulle parallele, busto dritto.', 'Scendi fino a gomiti a circa 90°.', 'Spingi in alto.'],
    ['Scendere troppo con spalle rigide.', 'Dondolare.'],
    'Busto inclinato in avanti = più petto; dritto = più tricipiti.', C),

  // ADDOME
  E('crunch', 'Crunch', 'addome', [], 'corpo', 'flessione_busto',
    ['Sdraiato, ginocchia piegate, mani dietro le orecchie.', 'Arrotola il busto staccando le scapole.', 'Scendi lento.'],
    ['Tirare la testa con le mani.', 'Salire troppo (diventa lavoro dei flessori dell\'anca).'],
    'Espira mentre sali e contrai forte.'),
  E('crunch_macchina', 'Crunch alla macchina', 'addome', [], 'macchinari', 'flessione_busto',
    ['Regola il sedile, impugna le maniglie.', 'Arrotola il busto in avanti.', 'Torna lento.'],
    ['Tirare con le braccia.', 'Carico eccessivo.'],
    'Ti permette di aumentare il carico come per gli altri muscoli.'),
  E('crunch_cavi', 'Crunch ai cavi', 'addome', [], 'macchinari', 'flessione_busto',
    ['In ginocchio, corda dietro la testa.', 'Arrotola il busto portando i gomiti verso le cosce.', 'Risali controllato.'],
    ['Piegarsi con le anche invece che con l\'addome.'],
    'Ottimo per un addome visibile e forte.'),
  E('plank', 'Plank', 'addome', ['spalle'], 'corpo', 'isometria',
    ['Avambracci a terra, gomiti sotto le spalle.', 'Corpo in linea, glutei e addome contratti.', 'Mantieni respirando.'],
    ['Bacino che cede.', 'Glutei troppo alti.'],
    'Meglio 30 secondi perfetti che 2 minuti fatti male.', T),
  E('leg_raise', 'Sollevamento gambe', 'addome', [], 'corpo', 'flessione_anca',
    ['Sdraiato o appeso, gambe tese.', 'Alza le gambe fino a 90°.', 'Scendi lento senza toccare terra.'],
    ['Inarcare la zona lombare.', 'Slancio.'],
    'Lavora soprattutto la parte bassa dell\'addome.'),
  E('russian_twist', 'Russian twist', 'addome', [], 'manubri', 'rotazione',
    ['Seduto, busto inclinato indietro, piedi sollevati o a terra.', 'Tieni un manubrio e ruota da un lato all\'altro.'],
    ['Muovere solo le braccia.', 'Schiena curva.'],
    'Allena gli obliqui. Conta un lato + l\'altro come 1.'),

  // QUADRICIPITI
  E('squat_bil', 'Squat con bilanciere', 'quadricipiti', ['glutei', 'femorali', 'addome'], 'bilanciere', 'squat',
    ['Bilanciere sui trapezi, piedi larghezza spalle, punte leggermente in fuori.', 'Inspira, contrai l\'addome e scendi portando le anche indietro e in basso.', 'Scendi almeno con le cosce parallele al pavimento.', 'Risali spingendo con tutto il piede.'],
    ['Ginocchia che cedono verso l\'interno.', 'Talloni che si staccano.', 'Schiena curva in basso.'],
    'Il re degli esercizi per le gambe: allenati con le sicure.', C),
  E('front_squat', 'Front squat', 'quadricipiti', ['glutei', 'addome'], 'bilanciere', 'squat',
    ['Bilanciere appoggiato sulle spalle davanti, gomiti alti.', 'Scendi col busto il più possibile verticale.', 'Risali tenendo i gomiti alti.'],
    ['Gomiti che cadono.', 'Busto che si piega in avanti.'],
    'Più quadricipiti e meno carico sulla schiena.', C),
  E('affondi_man', 'Affondi con manubri', 'quadricipiti', ['glutei', 'femorali'], 'manubri', 'affondo',
    ['Manubri ai fianchi, fai un passo lungo in avanti.', 'Scendi finché il ginocchio dietro sfiora terra.', 'Spingi col piede davanti e torna.'],
    ['Passo troppo corto.', 'Ginocchio davanti che cede verso l\'interno.'],
    'Puoi farli camminando se hai spazio.', C),
  E('goblet_squat', 'Goblet squat', 'quadricipiti', ['glutei', 'addome'], 'manubri', 'squat',
    ['Tieni un manubrio verticale al petto.', 'Scendi tra le gambe col busto dritto.', 'Risali spingendo coi talloni.'],
    ['Talloni che si staccano.', 'Schiena che si curva.'],
    'Perfetto per imparare lo squat.', C),
  E('bulgarian_man', 'Squat bulgaro', 'quadricipiti', ['glutei'], 'manubri', 'affondo',
    ['Piede dietro appoggiato su una panca.', 'Scendi verticale sulla gamba davanti.', 'Risali spingendo col tallone davanti.'],
    ['Piede davanti troppo vicino alla panca.', 'Perdere l\'equilibrio per la fretta.'],
    'Durissimo ma efficacissimo per gambe e glutei.', C),
  E('step_up', 'Step up con manubri', 'quadricipiti', ['glutei'], 'manubri', 'affondo',
    ['Manubri ai fianchi, un piede su una panca stabile.', 'Sali spingendo con la gamba sopra.', 'Scendi controllato.'],
    ['Spingere con la gamba a terra.', 'Panca troppo alta.'],
    'Alterna le gambe o fai tutte le ripetizioni per lato.', C),
  E('leg_press', 'Leg press', 'quadricipiti', ['glutei', 'femorali'], 'macchinari', 'squat',
    ['Schiena e bacino appoggiati, piedi a larghezza spalle sulla pedana.', 'Sblocca e scendi piegando le ginocchia verso il petto.', 'Spingi senza bloccare le ginocchia.'],
    ['Bacino che si stacca in basso.', 'Ginocchia bloccate in alto.'],
    'Piedi alti = più glutei e femorali; piedi bassi = più quadricipiti.', C),
  E('leg_extension', 'Leg extension', 'quadricipiti', [], 'macchinari', 'estensione_ginocchio',
    ['Regola lo schienale: ginocchio allineato al perno.', 'Stendi le gambe fino in alto e stringi.', 'Scendi lento.'],
    ['Scendere di colpo.', 'Sollevare il bacino.'],
    'Ottimo come pre-affaticamento o per finire.'),
  E('hack_squat', 'Hack squat', 'quadricipiti', ['glutei'], 'macchinari', 'squat',
    ['Spalle sotto i cuscini, piedi a metà pedana.', 'Scendi fino a 90° o più.', 'Spingi con tutto il piede.'],
    ['Talloni che si staccano.', 'Movimento troppo corto.'],
    'Alternativa allo squat quando il rack è occupato.', C),
  E('squat_corpo', 'Squat a corpo libero', 'quadricipiti', ['glutei'], 'corpo', 'squat',
    ['Piedi larghezza spalle, braccia avanti.', 'Scendi portando le anche indietro.', 'Risali deciso.'],
    ['Ginocchia verso l\'interno.', 'Talloni sollevati.'],
    'Ottimo per riscaldamento e circuiti.'),

  // FEMORALI
  E('stacco_rumeno_bil', 'Stacco rumeno con bilanciere', 'femorali', ['glutei', 'dorso'], 'bilanciere', 'hinge',
    ['In piedi, bilanciere davanti alle cosce.', 'Ginocchia morbide, porta le anche indietro scivolando lungo le gambe.', 'Scendi finché senti tirare i femorali, poi risali spingendo le anche avanti.'],
    ['Piegare troppo le ginocchia.', 'Schiena curva.'],
    'Pensa a "chiudere una porta col sedere".', C),
  E('stacco_rumeno_man', 'Stacco rumeno con manubri', 'femorali', ['glutei', 'dorso'], 'manubri', 'hinge',
    ['Manubri davanti alle cosce.', 'Anche indietro, schiena neutra, manubri vicini alle gambe.', 'Risali contraendo i glutei.'],
    ['Schiena curva.', 'Manubri lontani dalle gambe.'],
    'Ottima versione per chi inizia.', C),
  E('leg_curl', 'Leg curl sdraiato', 'femorali', ['polpacci'], 'macchinari', 'curl_gambe',
    ['Pancia in giù, rullo sopra i talloni.', 'Piega le gambe portando i talloni verso i glutei.', 'Scendi lento.'],
    ['Sollevare il bacino.', 'Scendere di colpo.'],
    'Controlla bene la discesa: lì lavora tanto.'),
  E('leg_curl_seduto', 'Leg curl seduto', 'femorali', [], 'macchinari', 'curl_gambe',
    ['Seduto, rullo sotto i polpacci, blocca le cosce.', 'Piega le gambe verso il basso.', 'Torna lento.'],
    ['Scivolare in avanti sul sedile.'],
    'Spesso più comodo della versione sdraiata.'),
  E('good_morning', 'Good morning', 'femorali', ['glutei', 'dorso'], 'bilanciere', 'hinge',
    ['Bilanciere sui trapezi, ginocchia morbide.', 'Piega il busto in avanti portando le anche indietro.', 'Risali a schiena neutra.'],
    ['Carico eccessivo.', 'Schiena curva.'],
    'Usa carichi leggeri: è un esercizio di controllo.', C),

  // GLUTEI
  E('hip_thrust_bil', 'Hip thrust con bilanciere', 'glutei', ['femorali'], 'bilanciere', 'hip_thrust',
    ['Schiena alta appoggiata alla panca, bilanciere sul bacino (con imbottitura).', 'Piedi a terra, spingi le anche verso l\'alto.', 'Stringi i glutei in alto, scendi controllato.'],
    ['Inarcare la schiena in alto.', 'Piedi troppo lontani.'],
    'Il miglior esercizio per i glutei.', C),
  E('hip_thrust_man', 'Hip thrust con manubrio', 'glutei', ['femorali'], 'manubri', 'hip_thrust',
    ['Schiena alta sulla panca, manubrio sul bacino.', 'Spingi in alto e stringi i glutei.', 'Scendi controllato.'],
    ['Spingere con la schiena.'],
    'Versione semplice da preparare.', C),
  E('glute_machine', 'Slanci ai cavi / glute machine', 'glutei', ['femorali'], 'macchinari', 'slanci',
    ['Busto stabile, spingi la gamba indietro.', 'Stringi il gluteo in fondo.', 'Torna controllato.'],
    ['Inarcare la schiena.', 'Slancio.'],
    'Movimento piccolo e controllato.'),
  E('abductor', 'Abductor machine', 'glutei', [], 'macchinari', 'abduzione',
    ['Seduto, cuscinetti all\'esterno delle ginocchia.', 'Apri le gambe e stringi.', 'Torna lento.'],
    ['Chiudere di scatto.'],
    'Busto leggermente in avanti per lavorare di più il gluteo.'),
  E('ponte_glutei', 'Ponte glutei', 'glutei', ['femorali'], 'corpo', 'hip_thrust',
    ['Sdraiato, ginocchia piegate, piedi a terra.', 'Solleva il bacino stringendo i glutei.', 'Scendi lento.'],
    ['Spingere con la schiena.'],
    'Ottimo riscaldamento prima di squat e stacchi.'),

  // POLPACCI
  E('calf_piedi', 'Calf raise in piedi (macchina)', 'polpacci', [], 'macchinari', 'calf',
    ['Spalle sotto i cuscini, avampiedi sul bordo.', 'Sali sulle punte il più possibile.', 'Scendi allungando bene.'],
    ['Movimento troppo veloce.', 'Piegare le ginocchia.'],
    'Fai una pausa di un secondo in alto e in basso.'),
  E('calf_seduto', 'Calf raise seduto', 'polpacci', [], 'macchinari', 'calf',
    ['Seduto, ginocchia sotto il cuscino.', 'Sali sulle punte.', 'Scendi lento.'],
    ['Rimbalzare.'],
    'Lavora il soleo, il muscolo sotto il gastrocnemio.'),
  E('calf_man', 'Calf raise con manubri', 'polpacci', [], 'manubri', 'calf',
    ['Manubri ai fianchi, avampiedi su un rialzo.', 'Sali sulle punte.', 'Scendi allungando.'],
    ['Movimento corto.'],
    'Puoi farlo anche su una gamba sola.'),
  E('calf_bil', 'Calf raise con bilanciere', 'polpacci', [], 'bilanciere', 'calf',
    ['Bilanciere sui trapezi, avampiedi su un rialzo.', 'Sali sulle punte.', 'Scendi lento.'],
    ['Perdere l\'equilibrio per la fretta.'],
    'Meglio al multipower se c\'è.'),

  // CONDIZIONAMENTO (circuiti)
  E('burpees', 'Burpees', 'quadricipiti', ['petto', 'addome'], 'corpo', 'condizionamento',
    ['Da in piedi scendi a terra con le mani.', 'Porta i piedi indietro in plank, fai un piegamento.', 'Riporta i piedi avanti e salta.'],
    ['Schiena che cede nel plank.'],
    'Vai al tuo ritmo, ma senza fermarti.', T),
  E('jumping_jack', 'Jumping jack', 'polpacci', ['spalle'], 'corpo', 'condizionamento',
    ['Salta aprendo gambe e braccia.', 'Salta richiudendo.'],
    ['Atterrare sui talloni.'],
    'Ottimo per riscaldarsi e alzare il battito.', T),
  E('mountain_climber', 'Mountain climber', 'addome', ['spalle', 'quadricipiti'], 'corpo', 'condizionamento',
    ['Posizione di plank a braccia tese.', 'Porta alternativamente le ginocchia al petto, veloce.'],
    ['Bacino troppo alto.'],
    'Mani sotto le spalle per tutto il tempo.', T),
  E('swing_man', 'Swing con manubrio', 'glutei', ['femorali', 'dorso'], 'manubri', 'hinge',
    ['Manubrio tenuto con due mani tra le gambe.', 'Spingi le anche avanti con forza facendo salire il manubrio all\'altezza del petto.', 'Lascialo ridiscendere tra le gambe e ripeti.'],
    ['Alzare con le braccia.', 'Schiena curva.'],
    'La forza viene dai glutei, non dalle braccia.', T)
];

const EX = {};
EXERCISES.forEach(e => { EX[e.id] = e; });

/* ===== Obiettivi (si possono combinare) =====
   schema per ruolo: [serie, rip. min, rip. max, recupero s]
   main = esercizio principale multiarticolare, sec = complementare, acc = isolamento, core = addome */
const GOALS = {
  massa: { n: 'Massa muscolare', desc: 'Muscoli più grandi', protein: 2.0, kcal: 300,
    scheme: { main: [4, 6, 8, 120], sec: [3, 8, 10, 90], acc: [3, 10, 15, 60], core: [3, 12, 15, 45] } },
  forza: { n: 'Forza', desc: 'Sollevare di più', protein: 1.8, kcal: 200,
    scheme: { main: [5, 3, 5, 180], sec: [4, 5, 7, 150], acc: [3, 8, 12, 90], core: [3, 10, 15, 60] } },
  tonificazione: { n: 'Tonificazione', desc: 'Muscoli definiti e resistenti', protein: 1.8, kcal: 0,
    scheme: { main: [3, 10, 12, 75], sec: [3, 12, 12, 60], acc: [3, 12, 15, 45], core: [3, 15, 20, 40] } },
  dimagrimento: { n: 'Dimagrimento', desc: 'Bruciare grassi, recuperi brevi', protein: 2.2, kcal: -400,
    scheme: { main: [3, 10, 12, 60], sec: [3, 12, 15, 45], acc: [3, 15, 20, 30], core: [3, 15, 20, 30] } },
  benessere: { n: 'Salute e benessere', desc: 'Stare in forma, postura, energia', protein: 1.6, kcal: 0,
    scheme: { main: [3, 8, 12, 90], sec: [3, 10, 12, 75], acc: [2, 12, 15, 60], core: [3, 12, 15, 45] } }
};
const LEVELS = {
  principiante: { n: 'Principiante', setsAdj: -1, perBig: 1, perSmall: 1, desc: 'Meno di 6 mesi', rir: '2–3' },
  intermedio: { n: 'Intermedio', setsAdj: 0, perBig: 2, perSmall: 1, desc: 'Da 6 mesi a 2 anni', rir: '1–2' },
  avanzato: { n: 'Avanzato', setsAdj: 0, perBig: 3, perSmall: 2, desc: 'Più di 2 anni', rir: '0–1' }
};
const ROLE_N = { main: 'Principale', sec: 'Complementare', acc: 'Isolamento', core: 'Core' };

function goalsOf(p) {
  p = p || (typeof S !== 'undefined' ? S.profile : {});
  const g = (p.goals && p.goals.length ? p.goals : [p.goal || 'massa']).filter(k => GOALS[k]);
  return g.length ? g : ['massa'];
}
function goalLabel(p) { return goalsOf(p).map(k => GOALS[k].n).join(' + '); }

function defaultRole(exId) {
  const e = EX[exId]; if (!e) return 'acc';
  if (e.m === 'addome' || e.pat === 'condizionamento') return 'core';
  return e.comp ? 'sec' : 'acc';
}

/* Prescrizione: combina gli obiettivi scelti (media) e adatta al livello */
function prescribe(exId, role) {
  const p = typeof S !== 'undefined' ? S.profile : {}, goals = goalsOf(p), lv = LEVELS[p.level] || LEVELS.intermedio;
  role = role || defaultRole(exId);
  const avg = i => goals.reduce((a, g) => a + GOALS[g].scheme[role][i], 0) / goals.length;
  let sets = Math.round(avg(0)), rmin = Math.round(avg(1)), rmax = Math.round(avg(2)), rest = Math.round(avg(3) / 15) * 15;
  sets = Math.max(2, sets + lv.setsAdj + (p.level === 'avanzato' && role === 'main' ? 1 : 0));
  if (p.level === 'principiante' && role === 'main') { rmin += 2; rmax += 2; } // tecnica prima del carico
  const NICE = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25], snap = v => NICE.reduce((b, x) => Math.abs(x - v) < Math.abs(b - v) ? x : b, NICE[0]);
  rmin = snap(rmin); rmax = snap(rmax);
  if (rmax < rmin) rmax = rmin;
  const e = EX[exId];
  if (e && e.m === 'polpacci') { rmin = Math.max(rmin, 10); rmax = Math.max(rmax, 15); rest = Math.min(rest, 60); }
  if (e && e.type === 'time') return { ex: exId, role, sets, secs: role === 'core' ? 40 : 45, rest: Math.min(rest, 60) };
  return { ex: exId, role, sets, rmin, rmax, rest };
}

/* nota del trainer per ogni esercizio della scheda */
function trainerNote(item) {
  const lv = LEVELS[(typeof S !== 'undefined' && S.profile.level) || 'intermedio'] || LEVELS.intermedio;
  const e = EX[item.ex] || {};
  const role = item.role || defaultRole(item.ex);
  if (e.type === 'time') return 'Qualità prima della durata: corpo in linea e respirazione regolare.';
  if (role === 'main') return 'Esercizio principale: tecnica perfetta, lascia ' + lv.rir + ' ripetizioni di scorta. Discesa lenta (3 s), salita decisa.';
  if (role === 'sec') return 'Complementare: carico impegnativo, ' + lv.rir + ' ripetizioni di scorta. Controlla tutta l\'escursione.';
  if (role === 'core') return 'Movimento lento e controllato, espira nella contrazione.';
  return 'Isolamento: carico moderato, arriva vicino al cedimento con contrazione di 1 s.';
}

/* ===== Schede preimpostate da personal trainer =====
   ogni slot: [ruolo, esercizio, alternativa per principianti] */
const PRESET_SPLITS = {
  fullA: { n: 'Full body A', focus: 'Squat e panca', note: 'Tutto il corpo con priorità a gambe e petto. Inizia dai multiarticolari quando sei fresco, chiudi con braccia e addome.',
    slots: [['main', 'squat_bil', 'leg_press'], ['sec', 'panca_piana_bil', 'chest_press'], ['sec', 'lat_machine'], ['sec', 'stacco_rumeno_man'], ['acc', 'alzate_laterali'], ['acc', 'pushdown'], ['core', 'plank']] },
  fullB: { n: 'Full body B', focus: 'Stacco e spalle', note: 'Catena posteriore e spinta verticale. Completa la A: in due sedute alleni ogni muscolo da angolazioni diverse.',
    slots: [['main', 'stacco_rumeno_bil', 'stacco_rumeno_man'], ['sec', 'lento_man', 'shoulder_press_mac'], ['sec', 'rematore_man', 'row_machine'], ['sec', 'affondi_man', 'leg_press'], ['acc', 'croci_cavi', 'pec_deck'], ['acc', 'curl_man'], ['core', 'crunch_cavi', 'crunch_macchina']] },
  fullC: { n: 'Full body C', focus: 'Glutei e petto alto', note: 'Glutei, petto alto e dorso in orizzontale. Con A e B copre tutti gli schemi di movimento.',
    slots: [['main', 'hip_thrust_bil', 'hip_thrust_man'], ['sec', 'panca_inclinata_man'], ['sec', 'pulley'], ['sec', 'goblet_squat'], ['acc', 'leg_curl'], ['acc', 'face_pull'], ['acc', 'curl_martello'], ['core', 'leg_raise']] },
  upperA: { n: 'Parte alta A', focus: 'Forza: panca e rematore', note: 'Spinta e tirata orizzontale in equilibrio (stesso numero di serie) per spalle sane e postura dritta.',
    slots: [['main', 'panca_piana_bil', 'chest_press'], ['main', 'rematore_bil', 'row_machine'], ['sec', 'lento_man', 'shoulder_press_mac'], ['sec', 'lat_machine'], ['acc', 'alzate_laterali'], ['acc', 'curl_bil', 'curl_man'], ['acc', 'pushdown']] },
  lowerA: { n: 'Parte bassa A', focus: 'Squat', note: 'Quadricipiti dominanti. Riscaldati bene anche e caviglie prima dello squat.',
    slots: [['main', 'squat_bil', 'leg_press'], ['sec', 'stacco_rumeno_bil', 'stacco_rumeno_man'], ['sec', 'affondi_man', 'step_up'], ['acc', 'leg_curl'], ['acc', 'calf_piedi'], ['core', 'plank']] },
  upperB: { n: 'Parte alta B', focus: 'Volume: inclinata e trazioni', note: 'Angoli diversi rispetto alla A: petto alto e tirata verticale. Più ripetizioni, recuperi più brevi.',
    slots: [['main', 'panca_inclinata_man'], ['main', 'trazioni', 'lat_machine'], ['sec', 'pulley'], ['sec', 'dip', 'dip_machine'], ['acc', 'face_pull'], ['acc', 'curl_martello'], ['acc', 'estensioni_man']] },
  lowerB: { n: 'Parte bassa B', focus: 'Glutei e femorali', note: 'Catena posteriore dominante: glutei e femorali. Ottima per la schiena e la postura.',
    slots: [['main', 'hip_thrust_bil', 'hip_thrust_man'], ['sec', 'bulgarian_man', 'leg_press'], ['sec', 'leg_extension'], ['acc', 'leg_curl_seduto'], ['acc', 'calf_seduto'], ['core', 'crunch_cavi', 'crunch_macchina']] },
  push: { n: 'Spinta', focus: 'Petto, spalle, tricipiti', note: 'Prima i movimenti pesanti di spinta, poi isolamento di spalle laterali e tricipiti.',
    slots: [['main', 'panca_piana_bil', 'chest_press'], ['sec', 'lento_man', 'shoulder_press_mac'], ['sec', 'panca_inclinata_man'], ['acc', 'alzate_laterali'], ['acc', 'croci_cavi', 'pec_deck'], ['acc', 'pushdown'], ['acc', 'estensioni_man']] },
  pull: { n: 'Tirata', focus: 'Dorso e bicipiti', note: 'Dorso in verticale e in orizzontale, deltoidi posteriori per la postura, poi bicipiti.',
    slots: [['main', 'stacco_bil', 'row_machine'], ['sec', 'lat_machine'], ['sec', 'rematore_man'], ['sec', 'pulley'], ['acc', 'face_pull'], ['acc', 'curl_bil', 'curl_man'], ['acc', 'curl_martello']] },
  legs: { n: 'Gambe', focus: 'Gambe complete', note: 'Quadricipiti, femorali, glutei e polpacci. Gli esercizi più pesanti all\'inizio.',
    slots: [['main', 'squat_bil', 'leg_press'], ['sec', 'stacco_rumeno_bil', 'stacco_rumeno_man'], ['sec', 'leg_press', 'goblet_squat'], ['acc', 'leg_extension'], ['acc', 'leg_curl'], ['acc', 'calf_piedi'], ['core', 'crunch_macchina']] }
};
function splitItems(key, level) {
  const beg = level === 'principiante';
  return PRESET_SPLITS[key].slots.map(([role, id, alt]) => prescribe(beg && alt ? alt : id, role));
}
function splitForDays(n, level) {
  if (n <= 1) return ['fullA'];
  if (n === 2) return ['fullA', 'fullB'];
  if (n === 3) return level === 'avanzato' ? ['push', 'pull', 'legs'] : ['fullA', 'fullB', 'fullC'];
  if (n === 4) return ['upperA', 'lowerA', 'upperB', 'lowerB'];
  if (n === 5) return ['upperA', 'lowerA', 'push', 'pull', 'legs'];
  return ['push', 'pull', 'legs', 'push', 'pull', 'legs'].slice(0, n);
}

/* ===== Gruppi muscolari consigliati ===== */
const PAIRS = {
  petto: ['tricipiti', 'spalle'], dorso: ['bicipiti', 'spalle'], spalle: ['petto', 'tricipiti'], bicipiti: ['dorso'],
  tricipiti: ['petto', 'spalle'], quadricipiti: ['femorali', 'glutei', 'polpacci'], femorali: ['glutei', 'quadricipiti'],
  glutei: ['femorali', 'quadricipiti'], polpacci: ['quadricipiti', 'femorali'], addome: ['dorso', 'glutei']
};
const PAIR_WHY = {
  petto: 'i tricipiti e le spalle lavorano già in tutte le spinte', dorso: 'i bicipiti lavorano già in tutte le tirate',
  spalle: 'spinte di petto e spalle condividono i muscoli', bicipiti: 'si completano con le tirate del dorso',
  tricipiti: 'si allenano bene dopo le spinte', quadricipiti: 'gambe complete in una sola seduta',
  femorali: 'catena posteriore completa', glutei: 'catena posteriore completa', polpacci: 'chiudi la seduta gambe',
  addome: 'il core stabilizza dorso e gambe'
};
const DAY_GROUPS = [
  { k: 'spinta', n: 'Spinta', m: ['petto', 'spalle', 'tricipiti'] },
  { k: 'tirata', n: 'Tirata', m: ['dorso', 'bicipiti'] },
  { k: 'gambe', n: 'Gambe', m: ['quadricipiti', 'femorali', 'glutei', 'polpacci'] },
  { k: 'alta', n: 'Parte alta', m: ['petto', 'dorso', 'spalle', 'bicipiti', 'tricipiti'] },
  { k: 'tutto', n: 'Tutto il corpo', m: ['petto', 'dorso', 'spalle', 'quadricipiti', 'femorali', 'addome'] }
];

/* Circuiti preimpostati da circa un'ora.
   Stazione: {ex, reps} oppure {ex, secs}. work = secondi stimati per stazione. */
const PRESET_CIRCUITS = [
  { key: 'c_manubri', n: 'Circuito total body manubri', desc: 'Tutto il corpo con soli manubri. 10 stazioni, 4 giri.',
    rounds: 4, work: 45, restEx: 15, restRound: 120, warm: 8, cool: 5,
    st: [{ ex: 'goblet_squat', reps: 12 }, { ex: 'panca_piana_man', reps: 12 }, { ex: 'rematore_man', reps: 12 }, { ex: 'affondi_man', reps: 10 }, { ex: 'lento_man', reps: 12 }, { ex: 'stacco_rumeno_man', reps: 12 }, { ex: 'curl_martello', reps: 12 }, { ex: 'estensioni_man', reps: 12 }, { ex: 'russian_twist', reps: 20 }, { ex: 'mountain_climber', secs: 40 }] },
  { key: 'c_macchinari', n: 'Circuito macchinari', desc: 'Giro completo delle macchine, sicuro e scorrevole. 10 stazioni, 4 giri.',
    rounds: 4, work: 45, restEx: 15, restRound: 120, warm: 8, cool: 5,
    st: [{ ex: 'leg_press', reps: 15 }, { ex: 'chest_press', reps: 12 }, { ex: 'lat_machine', reps: 12 }, { ex: 'leg_curl', reps: 12 }, { ex: 'shoulder_press_mac', reps: 12 }, { ex: 'pulley', reps: 12 }, { ex: 'leg_extension', reps: 15 }, { ex: 'pushdown', reps: 15 }, { ex: 'curl_cavi', reps: 15 }, { ex: 'crunch_macchina', reps: 15 }] },
  { key: 'c_bilanciere', n: 'Circuito bilanciere forza-resistenza', desc: 'Grandi esercizi col bilanciere, ritmo sostenuto. 8 stazioni, 4 giri.',
    rounds: 4, work: 50, restEx: 25, restRound: 150, warm: 10, cool: 5,
    st: [{ ex: 'squat_bil', reps: 10 }, { ex: 'panca_piana_bil', reps: 10 }, { ex: 'rematore_bil', reps: 10 }, { ex: 'stacco_rumeno_bil', reps: 10 }, { ex: 'military_bil', reps: 10 }, { ex: 'curl_bil', reps: 12 }, { ex: 'french_press', reps: 12 }, { ex: 'plank', secs: 45 }] },
  { key: 'c_bruciagrassi', n: 'Circuito brucia grassi misto', desc: 'Pesi e corpo libero alternati, battito sempre alto. 9 stazioni, 5 giri.',
    rounds: 5, work: 40, restEx: 20, restRound: 90, warm: 6, cool: 5,
    st: [{ ex: 'jumping_jack', secs: 40 }, { ex: 'goblet_squat', reps: 15 }, { ex: 'piegamenti', reps: 12 }, { ex: 'rematore_man', reps: 12 }, { ex: 'burpees', secs: 30 }, { ex: 'affondi_man', reps: 10 }, { ex: 'swing_man', secs: 40 }, { ex: 'mountain_climber', secs: 40 }, { ex: 'plank', secs: 40 }] },
  { key: 'c_gambe', n: 'Circuito gambe e glutei', desc: 'Gambe e glutei completi tra bilanciere, manubri e macchine. 8 stazioni, 4 giri.',
    rounds: 4, work: 50, restEx: 20, restRound: 150, warm: 8, cool: 6,
    st: [{ ex: 'squat_bil', reps: 12 }, { ex: 'hip_thrust_bil', reps: 12 }, { ex: 'affondi_man', reps: 10 }, { ex: 'leg_curl', reps: 12 }, { ex: 'leg_extension', reps: 15 }, { ex: 'abductor', reps: 20 }, { ex: 'calf_piedi', reps: 15 }, { ex: 'ponte_glutei', reps: 20 }] },
  { key: 'c_alta', n: 'Circuito parte alta', desc: 'Petto, dorso, spalle e braccia. 9 stazioni, 4 giri.',
    rounds: 4, work: 45, restEx: 20, restRound: 120, warm: 8, cool: 5,
    st: [{ ex: 'panca_inclinata_man', reps: 12 }, { ex: 'lat_machine', reps: 12 }, { ex: 'alzate_laterali', reps: 15 }, { ex: 'rematore_man', reps: 12 }, { ex: 'chest_press', reps: 12 }, { ex: 'face_pull', reps: 15 }, { ex: 'curl_man', reps: 12 }, { ex: 'pushdown', reps: 15 }, { ex: 'crunch_cavi', reps: 15 }] }
];

/* Durata stimata di un circuito, in minuti */
function circuitMinutes(c) {
  const per = c.st.reduce((a, s) => a + (s.secs || c.work) + c.restEx, 0);
  return Math.round((c.rounds * per + (c.rounds - 1) * c.restRound) / 60 + (c.warm || 0) + (c.cool || 0));
}

const WARMUP_TEXT = 'Riscaldamento: 5 minuti di cardio leggero (cyclette o tapis roulant), poi rotazioni di spalle, anche e caviglie e qualche ripetizione leggera del primo esercizio.';
const COOLDOWN_TEXT = 'Defaticamento: 3–5 minuti di cammino lento e allungamento dei muscoli lavorati, 20–30 secondi per posizione.';

const ACCENTS = { arancio: '#ff6b2c', verde: '#22c55e', blu: '#3b82f6', viola: '#a855f7', rosso: '#ef4444', giallo: '#eab308', ciano: '#06b6d4', rosa: '#ec4899' };
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const WEEKDAYS_LONG = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
