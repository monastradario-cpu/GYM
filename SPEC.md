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
