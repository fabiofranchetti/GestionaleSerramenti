# 0002 — Sincronizzazione: Google Drive dell'utente

## Stato
Proposta

## Data
2026-09-13

## Contesto
`04-dati-sync.md` lascia aperta la scelta del backend, con questi criteri:
costo ricorrente, semplicità, controllo del dato, possibilità di backup
autonomo. Il committente ha chiarito un vincolo che restringe la scelta:
**l'app finale deve essere installabile in modo assolutamente indipendente
da Claude** (un APK, o pubblicata sul Play Store), e la sincronizzazione
deve appoggiarsi a un cloud gratuito che l'utente già usa — es. Google
Drive — non a un servizio dedicato con canone.

Questo supera il banco di prova costruito nella sessione precedente (che
usava l'archivio dati della piattaforma Claude): quel meccanismo era
esplicitamente etichettato come non definitivo proprio perché legava il
funzionamento a Claude, in contrasto con questo vincolo. È stato rimosso.

## Decisione
Sincronizzare con il **Google Drive personale dell'utente** (quello che
già possiede, gratuito nella quota base), non un backend dedicato:
- Accesso via **Google Identity Services** (login Google lato browser,
  nessun server nostro nel mezzo) con permesso limitato allo scope
  `drive.file`: l'app vede e scrive **solo i file che crea lei**, mai il
  resto del Drive dell'utente.
- Un rilievo diventa una cartella `Rilievi Serramenti/<nome cantiere>/`
  con un file `rilievo-<codice>.json` (dati strutturati) e una
  sottocartella `foto/` (le foto viaggiano separate dai dati, come già
  previsto in `04-dati-sync.md`).
- La "Vista ufficio" legge direttamente da Drive: utile perché l'utente è
  unico (`00-visione.md`) e useresti probabilmente lo stesso account
  Google su telefono e computer — Drive fa già da tramite.
- Serve un **Client ID Google (OAuth)**, gratuito, che il committente crea
  una volta sola sulla propria Google Cloud Console e incolla nelle
  Impostazioni dell'app (vedi sotto "Cosa serve dal committente"). Senza,
  l'app resta comunque utilizzabile offline: la sincronizzazione si
  limita a segnalarsi "non configurata".

## Alternative considerate
- **Archivio della piattaforma Claude** (banco di prova precedente):
  scartato. Funzionava solo aprendo il link dentro Claude, in contrasto
  diretto con "assolutamente indipendente da Claude".
- **Backend dedicato (Firebase, Supabase, server proprio)**: scartato per
  ora. Comporta un costo ricorrente (anche se piccolo) e una scelta di
  fornitore che il committente non ha chiesto; Google Drive è gratuito
  nella quota che l'utente ha già e non richiede di imparare un servizio
  nuovo per consultare i file (sono file normali, visibili anche da
  Drive stesso).
- **Dropbox o altri cloud generici**: stessa logica di Google Drive
  sarebbe applicabile, ma Google è stato indicato esplicitamente come
  esempio dal committente.

## Conseguenze
- Più facile: nessun canone, nessun server da mantenere; l'utente vede i
  propri file anche aprendo Drive direttamente (rispetta "se il servizio
  chiude, l'archivio resta" — qui il "servizio" è Google Drive stesso,
  non una dipendenza nostra).
- Più facile: si sposa bene con l'obiettivo di pubblicare come APK/Play
  Store, perché non c'è nulla di specifico alla piattaforma Claude nel
  codice dell'app (`app/`).
- Più difficile: **il committente deve completare un passaggio tecnico
  una tantum** (creare il Client ID su Google Cloud Console) prima che la
  sincronizzazione funzioni davvero — non è qualcosa che si può inventare
  o bypassare, perché richiede il suo account Google. Istruzioni in
  `STATO.md`.
- Più difficile: un token di accesso Google dura circa un'ora; l'app
  richiede una nuova autorizzazione quando scade (gestito, ma va provato
  con l'uso reale prolungato in cantiere).
- Resta aperta: la scelta fra APK "wrapper" della stessa app web (via
  Trusted Web Activity — nessuna riscrittura, stesso codice) oppure
  un'app nativa vera e propria. La prima strada è compatibile con tutto
  il lavoro fatto finora; da confermare quando si arriva a quel punto.
- Resta aperta: `06-operativo.md` non ha ancora deciso Android/iOS in
  modo definitivo — parlare di APK e Play Store punta verso Android, ma
  non è stato dichiarato in modo esplicito come scelta finale.
