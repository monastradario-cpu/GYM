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
1. Obiettivo: massa, forza, tonificazione, dimagrimento.
2. Livello: principiante, intermedio, avanzato.
3. Giorni di allenamento (lun…dom) → l'app crea le schede preimpostate per quei giorni.
4. Peso corporeo attuale.
5. Promemoria: allenamento (ora), acqua (intervallo e fascia oraria), pesata (giorno e ora).

## Home
- **Allenamento di oggi**: scheda assegnata al giorno, tasto grande "Inizia".
- **Allenamento vuoto**.
- **Crea con l'allenatore**.
- **Riepilogo settimana**: allenamenti fatti, peso più recente, bicchieri d'acqua oggi (+1 con un tocco).

## Schede e circuiti
- Schede preimpostate generate in base a giorni, obiettivo e livello:
  2–3 giorni Full body A/B, 4 giorni Upper/Lower A/B, 5–6 giorni Push/Pull/Legs.
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

## Allenatore
- Scegli i gruppi muscolari e l'attrezzo (manubri, macchinari, bilanciere).
- Propone gli esercizi con serie, ripetizioni e recupero adattati a obiettivo e livello.
- Per ogni esercizio: come eseguirlo, errori da evitare, alternative.
- Dalla proposta: inizia subito o salva come scheda.
- AI facoltativa (impostazioni): Gemini predefinito (piano gratuito), oppure Claude o OpenAI con la propria chiave. Senza chiave l'app funziona al completo con i consigli integrati.

## Libreria esercizi
- Filtri per muscolo e attrezzo, ricerca.
- Scheda esercizio: figura del corpo con muscoli principali e secondari evidenziati, esecuzione, errori, consiglio, alternative, link a video di esempio (YouTube), storico e record.

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
