# Stato del progetto

Aggiornato: 2026-09-13

## Dove siamo
Primo prototipo funzionante in `app/` (PWA, HTML/CSS/JS senza framework né
build step — vedi `docs/decisioni/0001-piattaforma.md`). Copre il flusso
principale: Cantiere → Posizione (misure, tipo di posa, foto, note, schema
di apertura composto, prodotti multipli) → controlli di coerenza →
salvataggio locale (IndexedDB, nessuna rete richiesta per l'uso).

Provato con test automatici in browser (Playwright), incluso un finto
rilievo con misure verosimili (cucina, soggiorno, camera — luci muro,
diagonali, spessore muro, davanzale, note plausibili): creazione cantiere e
posizione, inserimento misure, preset di schema apertura, aggiunta/rimozione
foto e prodotti, duplica Posizione, export backup JSON, blocco del passaggio
a stato "rilevato" con controlli non superati. **Non ancora provato su un
device reale in cantiere** — resta da fare per il collaudo di
`06-operativo.md`.

**Sincronizzazione con Google Drive** (`app/js/drive.js`,
`docs/decisioni/0002-sincronizzazione-google-drive.md`): dal Cantiere, il
pulsante "Invia tutto su Google Drive" manda le Posizioni (misure, schema,
prodotti) e le foto in una cartella `Rilievi Serramenti/` sul Drive
dell'utente; la schermata "Vista ufficio" li rilegge da lì. Ho sostituito
così il banco di prova della sessione precedente, che si appoggiava
all'archivio di Claude — scartato perché in contrasto con "l'app deve
essere installabile in modo indipendente da Claude".

**Prima di poter provare davvero l'invio, manca un passaggio tuo, una
tantum** (nessuno può farlo al posto tuo: serve il tuo account Google):
1. Vai su [Google Cloud Console](https://console.cloud.google.com/), crea
   un progetto (gratuito).
2. In "API e servizi" → "Libreria", attiva la **Google Drive API**.
3. In "API e servizi" → "Schermata consenso OAuth", crea una schermata di
   tipo "Esterno" (bastano i dati minimi: nome app, la tua email) e
   aggiungi te stesso come "utente di test" — così non serve la revisione
   di Google finché l'app resta a uso personale.
4. In "API e servizi" → "Credenziali" → "Crea credenziali" → "ID client
   OAuth", tipo applicazione **Web**. In "Origini JavaScript autorizzate"
   metti l'indirizzo da cui aprirai l'app (es. l'indirizzo di GitHub
   Pages, quando lo attiviamo, o `http://localhost` per una prova locale).
5. Copia il "Client ID" che Google ti dà e incollalo nell'app, in
   "Impostazioni: sincronizzazione con Google Drive" (nella schermata
   iniziale).

**Resta anche da decidere dove sarà raggiungibile l'app per queste prove**
(oggi gira solo in locale sul mio ambiente): la strada più semplice e
gratuita è attivare **GitHub Pages** su questo repository, così l'app ha
un indirizzo web stabile, tuo, indipendente da Claude — te lo propongo,
va attivato una volta nelle impostazioni del repository.

Non ho potuto provare io stesso l'invio/ricezione reale end-to-end: serve
un Client ID vero e un indirizzo web reale, che non ho. L'ho verificato
solo per la parte che potevo controllare: con Drive non configurato o non
raggiungibile, l'app lo segnala chiaramente e continua a funzionare in
locale senza rompersi.

## Deciso finora
- Il focus è il rilievo, non il preventivo.
- Prodotti principali: finestre e portefinestre. Il resto via campi liberi.
- Oggi i dati restano sul foglio → il valore primario è creare un archivio.
- Lo schema di apertura si compone (ante + tipi), non si disegna a mano.
- Offline first come vincolo non negoziabile.
- Piattaforma: PWA (`docs/decisioni/0001`), pensata per essere impacchettata
  come APK/Play Store più avanti, senza riscrivere il codice.
- Sincronizzazione: Google Drive dell'utente, non un servizio dedicato
  (`docs/decisioni/0002`).

## Scelte del prototipo non ancora validate dal committente
Per poter costruire qualcosa di provabile, il prototipo fa scelte su alcuni
punti lasciati aperti nei documenti. Vanno confermate o corrette, non sono
decisioni definitive:
- **Convenzione di vista**: implementata come campo obbligatorio per
  Cantiere (non un valore fisso di sistema). Va scelta esplicitamente prima
  di rilevare le aperture; l'app lo segnala se manca.
- **Soglie C1/C2/C3**: non implementate come pass/fail. Il prototipo mostra
  lo scarto misurato e dice esplicitamente "soglia non ancora definita".
- **Tipi di posa**: campo libero (testo), non un elenco chiuso — l'elenco
  reale resta da compilare.
- **Numerazione Posizioni**: codici liberi assegnati dall'utente, nessuna
  rinumerazione automatica (era già una proposta in `03-app-campo.md`).
- **Duplica Posizione**: copia tutti i campi tranne foto, note e codice
  (che restano da assegnare) — assunzione ragionevole ma non confermata.
- **Backup**: l'export JSON non include le foto (dimensione/formato di
  storage foto restano `[DA DECIDERE]` in `04-dati-sync.md`).

## Prossimo passo (uno solo)
**Portare il prototipo in un vero rilievo di prova** e confrontarlo con
carta e penna su un cantiere reale (non serve ancora il collaudo completo
di 5 cantieri di `06-operativo.md`, basta un primo giro). Annotare dove
rallenta o dove manca un dato registrabile. In parallelo resta valida
l'idea originale di validare il modello dati sui tre rilievi già fatti,
se non è ancora stata fatta.

## Domande aperte per il committente
1. Le aperture si indicano viste da dentro o da fuori? (`01-dominio.md`) —
   nel prototipo è un campo da scegliere per cantiere, non ancora una
   convenzione fissa di sistema.
2. Elenco reale dei tipi di posa praticati. (`02-regole-mestiere.md`)
3. Soglie di tolleranza per i controlli C1, C2, C3. (`02-regole-mestiere.md`)
4. Errori ricorrenti realmente capitati negli anni. (`02-regole-mestiere.md`)
5. Quale distanziometro laser possiede. (`03-app-campo.md`)
6. Tablet o telefono, quale sistema operativo. (`06-operativo.md`)
7. Quale software di preventivazione usa, e se importa dati. (`05-ufficio.md`)

## Non ancora affrontato
- Attivare un indirizzo web reale per l'app (proposta: GitHub Pages) — serve
  anche per provare Google Drive (vedi sopra).
- Creare il Client ID Google (passaggio del committente, vedi sopra).
- Impacchettare l'app come APK (es. Trusted Web Activity) per il Play Store.
- Service worker per installazione e caricamento realmente offline al primo
  avvio (oggi il primo caricamento richiede rete, l'uso dopo no).
- Qualsiasi aspetto estetico.
- Accesso al distanziometro laser Bluetooth.
