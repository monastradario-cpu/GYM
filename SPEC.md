# GYM — Specifica

App Android personale per allenarsi in palestra. Uso di una sola persona, dati sul telefono.

## Consegna
- APK Android generato da GitHub Actions (repo `monastradario-cpu/GYM`), pubblicato come Release.
- App completa in una volta: l'utente la prova e riferisce cosa non va.
- APK firmato sempre con la stessa chiave, così gli aggiornamenti si installano sopra senza perdere i dati.

## Tecnologia
- Guscio Android nativo (Kotlin, minSdk 26) con WebView che carica l'interfaccia dagli asset (offline).
- Ponte nativo per: salvataggio file di backup, notifiche/promemoria, fine recupero con vibrazione anche a schermo spento, schermo acceso, apertura link esterni (video), foto da fotocamera o galleria.
- Dati in locale (localStorage + IndexedDB per le foto).

## Primo avvio — configurazione guidata
1. Obiettivi (scelta multipla, combinati dal trainer): massa, forza, tonificazione, dimagrimento, salute e benessere.
2. Livello: principiante, intermedio, avanzato.
3. Giorni di allenamento (lun…dom) → l'app crea le schede preimpostate per quei giorni.
4. Peso, sesso, età, altezza (per calorie e proteine).
5. Promemoria: allenamento (ora), acqua (intervallo e fascia oraria), pesata (giorno e ora).

## Home
- **Allenamento di oggi**: scheda assegnata al giorno, tasto grande "Inizia".
- **Allenamento vuoto**.
- **Crea con l'allenatore**.
- **Riepilogo settimana**: allenamenti fatti, peso più recente, bicchieri d'acqua oggi (+1 con un tocco).

## Schede e circuiti (impostate come un personal trainer)
- Schede preimpostate in base a giorni, obiettivi e livello:
  1–2 giorni Full body, 3 giorni Full body A/B/C (avanzato: Spinta/Tirata/Gambe), 4 giorni Parte alta/bassa A/B, 5 giorni Alta/Bassa + Spinta/Tirata/Gambe, 6 giorni Spinta/Tirata/Gambe ×2.
- Ogni esercizio ha un ruolo (principale, complementare, isolamento, core) con serie, ripetizioni e recupero propri; gli obiettivi multipli vengono combinati.
- Principianti: versioni ai macchinari degli esercizi tecnici e ripetizioni più alte sui principali.
- Nota del trainer per ogni scheda e per ogni esercizio (ripetizioni di scorta, ritmo).
- **Circuiti preimpostati da circa un'ora** (riscaldamento e defaticamento inclusi):
  Total body manubri, Macchinari, Bilanciere forza‑resistenza, Brucia grassi misto, Gambe e glutei, Parte alta.
- Creazione e modifica libera: nome, giorni, esercizi, serie, ripetizioni min–max, recupero; per i circuiti giri, lavoro in secondi o ripetizioni, pausa tra stazioni e tra giri.

## Durante l'allenamento
- Per ogni esercizio: righe serie con kg e ripetizioni, spunta "fatta".
- Si vedono i carichi dell'ultima volta.
- Il timer di recupero parte da solo alla spunta della serie; a fine recupero suono + vibrazione (notifica se lo schermo è spento).
- Consiglio di progressione (aumentare carico / ripetizioni / restare).
- Riscaldamento suggerito: serie leggere calcolate sul carico di lavoro.
- Calcolatore dischi per il bilanciere.
- Esercizio alternativo se l'attrezzo è occupato.
- Aggiunta esercizi e cardio.
- Circuiti in modalità guidata: stazione corrente grande, conto alla rovescia, pause automatiche, giri.

## Coach (allenamento + alimentazione)
- "Il trainer consiglia oggi": gruppo muscolare suggerito in base a recupero (48 h muscoli grandi, 36 h piccoli) e volume della settimana.
- Scelta dei muscoli con abbinamenti consigliati (es. petto → tricipiti, spalle) e avviso per i muscoli ancora in recupero.
- Allenamento libero: all'inizio propone i gruppi da allenare; nella scelta esercizi suggerisce gli abbinamenti.
- Alimentazione: calorie (Mifflin-St Jeor + attività + obiettivi), proteine, carboidrati, grassi, acqua; pasti 2–3 ore prima, spuntino 30–60 minuti prima, recupero entro 2 ore dopo, giorni di riposo; consigli per obiettivo.
- Home: consiglio del giorno, pasto pre/post allenamento, mobilità nei giorni di riposo, settimana di scarico ogni 6 settimane.

## Allenatore
- Passo 3: **durata** (30, 45, 60, 75, 90 minuti, riscaldamento compreso): gli esercizi vengono scelti per stare nel tempo.
- **Tre opzioni** per ogni richiesta, con quella consigliata in base agli obiettivi: Classico (serie e recuperi pieni), Superserie (coppie di muscoli opposti senza pausa, timer solo dopo la coppia), Circuito (stazioni a giri, guidato).
- "Nuova scheda" propone anche di crearla con il trainer.
- Scegli i gruppi muscolari e l'attrezzo (manubri, macchinari, bilanciere).
- Propone gli esercizi con serie, ripetizioni e recupero adattati a obiettivo e livello.
- Per ogni esercizio: come eseguirlo, errori da evitare, alternative.
- Dalla proposta: inizia subito o salva come scheda.
- AI facoltativa (impostazioni): Gemini predefinito (piano gratuito), oppure Claude o OpenAI con la propria chiave. Collegamento guidato: passi per ottenere la chiave, pulsante Incolla (pulisce spazi e testo in più, controlla che inizi con AIza), prova automatica, messaggi d'errore in italiano, modello di riserva se quello predefinito non è disponibile, chiave separata per ogni servizio. Senza chiave l'app funziona al completo con i consigli integrati.

## Libreria esercizi
- Filtri per muscolo e attrezzo, ricerca.
- Scheda esercizio: **animazione creata nell'app** al rallentatore (manichino con postura corretta, muscoli evidenziati, fasi con indicazioni e respirazione, velocità molto lento/lento/normale), figura anatomica con muscoli principali e secondari, esecuzione, errori, consiglio, alternative, link facoltativo a YouTube, storico e record.

## Cardio
- Tipo (tapis roulant, cyclette, ellittica, vogatore, corsa, altro), tempo, distanza (km), livello/inclinazione.

## Progressi
- Grafico per esercizio (carico massimo e massimale stimato) e record personali.
- Calendario allenamenti con serie di giorni/settimane consecutive.
- Riepilogo settimanale: allenamenti, volume, tempo, serie per muscolo.
- Mappa muscoli: figura colorata in base alle serie degli ultimi 7 giorni.
- Peso corporeo con grafico.
- Foto progressi datate, salvate sul telefono.
- Storico cardio.

## Promemoria
- Giorni di allenamento all'ora scelta (con il nome della scheda del giorno).
- Acqua a intervalli nella fascia oraria scelta; contatore bicchieri.
- Pesata nel giorno e all'ora scelti.

## Aggiornamento dall'app (sempre presente)
- All'apertura l'app controlla l'ultima Release su GitHub e, se c'è una versione nuova, lo segnala.
- In Impostazioni → Aggiornamenti: "Controlla aggiornamenti", poi "Scarica e installa" con barra di avanzamento.
- Il numero di versione cresce a ogni build (numero della build di GitHub Actions); l'APK è firmato sempre con la stessa chiave, quindi si installa sopra mantenendo i dati.

## Impostazioni
- Tema chiaro / scuro / di sistema, colore principale a scelta.
- Unità: kg e km.
- Profilo (obiettivo, livello, giorni, obiettivo acqua).
- Schermo sempre acceso durante l'allenamento (opzione).
- AI: servizio, chiave, modello.
- Backup: esporta / importa file (foto incluse a scelta), azzera dati.

## Conta calorie (sezione Calorie)
- Diario giornaliero per colazione, pranzo, cena e spuntini; anello con kcal rimaste rispetto al fabbisogno; barre di proteine, carboidrati e grassi; stima delle calorie bruciate in palestra; giorni precedenti consultabili.
- Aggiunta alimenti: scansione codice a barre (scanner Google, nessun permesso fotocamera) con valori da Open Food Facts; codice scritto a mano; ricerca online su Open Food Facts; 57 alimenti comuni offline; recenti; inserimento manuale.
- Foto del cibo o dell'etichetta: il coach AI (Gemini gratuito, oppure Claude/OpenAI) riconosce l'alimento e stima valori per 100 g e grammi; tutto modificabile prima di salvare.
- Quantità in grammi con porzioni rapide; calcolo immediato di kcal e macronutrienti.

## Circuito in corso (stile tabella)
- Ogni stazione è una scheda con una riga per giro (precedente, kg, ripetizioni/secondi, ✓), prossima serie evidenziata, pausa automatica tra stazioni e tra giri, stazioni a tempo con conto alla rovescia nella riga.

## Storico progressioni (Progressi → Andamento)
- Per ogni esercizio: sedute recenti con miglior serie, variazione (+kg, +rip) e massimale stimato; stato complessivo (in progressione, stabile, in calo).
- Consiglio "Prossima volta" con doppia progressione: +1 ripetizione per serie fino al massimo del range, poi aumento di carico (2 kg manubri, 2,5–5 kg bilanciere, 5–10 kg macchine); range dell'obiettivo diverso da quello usato → carico adattato; stallo da 3 sedute → cambio di stimolo; forza in calo per due sedute → settimana di scarico (−10%).
- Gli obiettivi serie per serie vengono precompilati nell'allenamento.

## Piano dimagrimento (basato sugli studi)
- Si attiva con l'obiettivo Dimagrimento: ritmo 0,25/0,5/0,75/1% del peso a settimana (predefinito 0,5%; 0,25% se c'è anche massa/forza), deficit = peso × ritmo × 7700/7, massimo 25% del consumo e mai sotto il metabolismo a riposo.
- Proteine 2,2 g/kg; grassi 25–30% (minimo 0,6 g/kg); carboidrati il resto (low-carb: 100 g).
- Diete: mediterranea ipocalorica, alta proteina, pochi carboidrati, digiuno 16:8; esempio di giornata scalato sulle calorie, copiabile nel diario.
- Controllo settimanale sulla media del peso: correzione ±150 kcal.
- Fonti: ISSN 2017, Helms 2014, DIETFITS 2018, Liu 2022, PREDIMED-Plus.

## Trainer basato sugli studi (Coach → Su cosa si basa)
- Frequenza: ogni muscolo almeno 2 volte a settimana (ACSM 2026); 3 giorni avanzato = Parte alta/Parte bassa/Full body.
- Volume: obiettivo ~10 serie settimanali per muscolo, conteggio frazionario (secondari 0,5) — ACSM 2026, Pelland 2024.
- Carichi: forza 3×4–6 sui principali (~80% 1RM, ACSM 2026); massa/tonificazione/dimagrimento 8–20 ripetizioni (Schoenfeld 2017).
- Ripetizioni di scorta per ruolo e obiettivo: crescita 0–2, forza 2–4 (Robinson 2024); cedimento non obbligatorio.
- Recupero minimo 60 s fuori dai circuiti, 2–3 min sui principali (Singer 2024).
- Doppia progressione (Plotkin 2022). Scarico ogni 4–8 settimane o su richiesta: serie dimezzate per 7 giorni, stessi carichi, lontano dal cedimento (Bell 2023).
- Cardio: 150–300 min/settimana (OMS 2020), mostrato in home; nei giorni di gambe bici/ellittica (Schumann 2022).
- Figura del corpo: disegno originale in stile tavola anatomica a china, muscoli colorati quando selezionati o allenati.

## Allenamento v4 (layout scelto: A + C)
- Lista essenziale: nome, recupero, intervallo di ripetizioni in due riquadri (min–max, ricalcola gli obiettivi), obiettivo di oggi, tabella serie, "+ Aggiungi serie". Consiglio del trainer, riscaldamento, nota, "Occupato?", dischi, sposta/rimuovi nel menu ⋯.
- Modalità "Una serie alla volta": numeri grandi con + e −, "Serie fatta", ultima volta e obiettivo, pallini delle serie, elenco esercizi per saltare.

## Casa e lavoro
- Routine pronte con guida automatica a tempo: Casa 10 (total body, cardio), Casa 20, Ufficio 2/3/3/5 min, Mobilità 7 min, Stretching 5 min. Nuovi esercizi con animazioni.
- Stelle: ogni routine completata = 1 stella, obiettivo giornaliero = numero di promemoria (3 o 4). Card in Home e in Schede › Casa e lavoro.
- Promemoria pause attive nei giorni e nell'orario di lavoro, 3–4 al giorno (nativo, tipo "breaks").
- Basi: Klika & Jordan 2013 (30 s/10 s), meta-analisi BJSM 2025 sugli exercise snacks, Duran/Diaz MSSE 2023 (spezzare la seduta), Coombes Phys Ther 2018 (collo negli impiegati).

## Versione 1.0.19
- Esercizi in corso in stile "registro" (scelto dall'utente): miniatura, nome, Recupero/Ripetizioni/Nota, tabella Serie·Precedente·kg·Ripetizioni·✓ con righe verdi, Aggiungi serie; in fondo Aggiungi esercizio, Impostazioni, Abbandona.
- Ripetizioni fisse o a intervallo: quando aggiungi un esercizio, durante l'allenamento e nelle schede.
- Fine allenamento: avviso durata insolita (≥ 4 h) e schermata Salva allenamento (titolo, durata, foto, descrizione, data).
- Circuito in lista; omino v2 (Vettoriale/Anatomico/Linee/Classico); pagina esercizio con animazione + schede Esecuzione/Muscoli/Errori/I miei dati.
- 718 esercizi (elenco da free-exercise-db, pubblico dominio), muscolo Avambracci, attrezzi Cavi, Kettlebell, Elastici, Smith, EZ.
- Alimentazione: avvisi sui macro, preferenze, piano pasti 7 giorni (3/4/5 pasti), 36 ricette, lista spesa, integratori basati sugli studi.
- Palestra: programma a cicli (5 settimane, deciso dal trainer), massimali e tabella %, misure corporee con grasso % US Navy, statistiche avanzate.

## Versione 1.0.20
- Acqua in litri: obiettivo automatico (35 ml/kg, +0,5 L nei giorni di allenamento) o manuale; Home con −250 / +250 ml / +500 ml e barra di avanzamento.
- Omino "realistico" (figura grigia sfumata, muscoli lavorati in rosso, pantaloncini neri) come stile predefinito delle animazioni; stili precedenti ancora selezionabili.
- Figura anatomica: nuovi stili realistico (predefinito), moderno, chiaro, morbido.
- Impostazioni → "Immagini negli esercizi": omino animato, disegni o mappa muscolare.
- Disegni degli esercizi di Everkinetic (245 esercizi, posizione iniziale e finale con dissolvenza), licenza CC BY-SA 4.0, credito in Impostazioni e nella scheda esercizio.

## Percorso su misura (dalla 1.0.22)
- Questionario iniziale (anche per chi ha già l'app, dalla Home): sesso e tipo di fisico scelto toccando una figura anatomica (magro, normopeso, skinny fat, atletico, sovrappeso, obesità), età, altezza, peso, esperienza; lavoro, passi, sonno, stress; giorni di pesi e altre attività (yoga, pilates, camminate); palestra o casa e minuti per seduta; dolori per zona; obiettivi (consigliati dal fisico); traguardi misurabili (peso, forza su un esercizio, girovita, costanza) con previsione.
- Calorie con livello di attività PAL (FAO/OMS/UNU) da lavoro, passi, allenamenti e attività.
- Schede adattate: esercizi esclusi per i dolori con alternative, attrezzi di casa, niente salti con BMI ≥ 30, durata nei minuti scelti, dopo i 50 anni equilibrio e potenza, con sonno scarso o stress alto meno serie nella prima fase.
- Percorso di 12 settimane in 3 fasi da 4 (Base, Sviluppo, Intensificazione; 3 di carico + 1 di scarico) con controllo di fine fase che ricalcola e rigenera le schede.
- Check-in prima di ogni seduta (sonno, energia, dolori): seduta più leggera e sostituzioni per i dolori di oggi.
- Prime 2 sedute di taratura dei carichi (nessun test iniziale).
- Foto vere di inizio e fine (free-exercise-db, pubblico dominio) per 689 esercizi, figura anatomica con i muscoli accanto; figure generate di notte solo per gli esercizi senza foto.
- Stile unico: figura anatomica realistica (tolti gli altri stili di figura e omino). Coach unico.

## Funzionale, mobilità e schede che crescono (ottobre 2026)
- Niente schede pronte: le schede nascono solo dal questionario del percorso (pesi nei giorni scelti, funzionale e mobilità nei giorni liberi). Quelle create dall'utente restano sempre.
- Funzionale: circuito a tempo con guida automatica (accosciata, spinta, anche, tirata, una gamba, trasporto, anti-rotazione, potenza, fiato se l'obiettivo è dimagrire/tonificare), adattato a livello, luogo, dolori, età e peso (ACSM, Garber 2011).
- Mobilità: prima movimenti dinamici, poi posizioni (30 s per lato, 45 s simmetriche, 60 s per lato dopo i 65 anni), 1–2 volte a settimana, circa 20 minuti; personalizzata per lavoro seduto, mal di schiena, età e dolori (ACSM 2011, Behm 2016).
- Traguardi raggiunti: nuovo traguardo (peso, forza +5%, girovita, costanza +12 settimane), livello principiante → intermedio, schede rigenerate con varianti dei complementari, +1 serie sui principali dal secondo traguardo, funzionale e mobilità più impegnativi.
