# 0001 — Piattaforma dell'app di campo

## Stato
Proposta

## Data
2026-09-13

## Contesto
`04-dati-sync.md` lascia aperta la scelta fra app web installabile (PWA) e
app nativa. Serve una decisione prima di scrivere il primo prototipo perché
cambiarla dopo significa riscrivere l'interfaccia.

Vincoli che contano per questa scelta:
- Un solo sviluppatore (Claude Code) e un solo utilizzatore finale.
- Bisogna vedere un prototipo funzionante il prima possibile, su un device
  reale, senza passare da store o build nativi.
- Offline first è un vincolo non negoziabile: qualunque piattaforma deve
  garantire scrittura locale senza rete.
- Nessuna decisione definitiva su tablet/telefono, Android/iOS (`06-operativo.md`,
  ancora `[DA DECIDERE]`): la piattaforma scelta deve funzionare su entrambi.

## Decisione
Prototipo come **PWA** (HTML/CSS/JS, nessun framework, nessun build step):
si apre da browser, salva i dati in locale con IndexedDB, non dipende dalla
rete per funzionare.

## Alternative considerate
- **App nativa (Android/iOS)**: scartata per il prototipo. Richiede build,
  firma, eventuale account sviluppatore, e non si può iterare in un browser
  in pochi minuti. Da rivalutare più avanti se emergono esigenze che il web
  non copre (es. accesso Bluetooth al distanziometro laser).
- **App web con backend/server**: scartata per ora. Introdurrebbe una
  dipendenza di rete proprio nella fase in cui va validato il modello dati,
  in contrasto con "offline first" e con `[DA DECIDERE]` sul backend
  (ancora aperto in `04-dati-sync.md`).

## Conseguenze
- Più facile: provare subito il prototipo su telefono o tablet aprendo un
  link o un file, senza installazione da store.
- Più facile: nessun costo ricorrente per ora (nessun servizio cloud).
- Più difficile: funzioni che richiedono accesso hardware avanzato (es.
  Bluetooth per il distanziometro laser) sono più limitate sul web che in
  nativo — restano `[DA VERIFICARE]` come già indicato in `03-app-campo.md`.
- Resta aperta e non affrontata da questa decisione: la scelta del backend
  di sincronizzazione (`04-dati-sync.md`), che riguarda cosa succede quando
  il rilievo lascia il dispositivo, non se il dispositivo funziona offline.
- Il prototipo attuale non ha ancora service worker per l'installazione
  offline vera e propria: funziona offline nell'uso (i dati sono locali),
  ma il primo caricamento della pagina richiede una connessione. Va
  aggiunto prima del collaudo sul campo (`06-operativo.md`).
