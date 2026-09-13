# Stato del progetto

Aggiornato: 2026-09-13

## Dove siamo
Primo prototipo funzionante in `app/` (PWA, HTML/CSS/JS senza framework né
build step — vedi `docs/decisioni/0001-piattaforma.md`). Copre il flusso
principale: Cantiere → Posizione (misure, tipo di posa, foto, note, schema
di apertura composto, prodotti multipli) → controlli di coerenza →
salvataggio locale (IndexedDB, nessuna rete richiesta per l'uso).

Provato con test automatici in browser (Playwright): creazione cantiere e
posizione, inserimento misure, preset di schema apertura, aggiunta/rimozione
foto e prodotti, duplica Posizione, export backup JSON, blocco del passaggio
a stato "rilevato" con controlli non superati. **Non ancora provato su un
device reale in cantiere** — resta da fare per il collaudo di
`06-operativo.md`.

## Deciso finora
- Il focus è il rilievo, non il preventivo.
- Prodotti principali: finestre e portefinestre. Il resto via campi liberi.
- Oggi i dati restano sul foglio → il valore primario è creare un archivio.
- Lo schema di apertura si compone (ante + tipi), non si disegna a mano.
- Offline first come vincolo non negoziabile.
- Piattaforma del prototipo: PWA senza backend (`docs/decisioni/0001`).

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
- Scelta del backend / sincronizzazione fra dispositivi (`04-dati-sync.md`).
- Service worker per installazione e caricamento realmente offline al primo
  avvio (oggi il primo caricamento richiede rete, l'uso dopo no).
- Qualsiasi aspetto estetico.
- Accesso al distanziometro laser Bluetooth.
