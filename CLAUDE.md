# Progetto: app di rilievo per serramentista

## Cos'è
App mobile per registrare in cantiere i rilievi di serramenti (misure, schemi di
apertura, foto, note) e ritrovarli in ufficio in forma strutturata e ricercabile.

Il committente è un serramentista che oggi lavora a mano su carta. I fogli
restano l'unico archivio: **questo progetto crea un archivio che oggi non esiste**.

## Regole sempre valide

- **L'obiettivo è il rilievo.** Non costruiamo un motore di preventivi. Il
  preventivo lo fa un software esterno o si fa a mano.
- **Offline first.** L'app deve funzionare senza rete, in scantinato, sempre.
  Nessuna funzione può dipendere dalla connessione nel momento del rilievo.
- **Il dato grezzo non si interpreta sul campo.** Si registra quello che si
  misura. I calcoli derivati si fanno dopo, in ufficio.
- **Se è più lento della matita, ha fallito.** Ogni scelta di UI si valuta in
  numero di tap e in usabilità con una mano sola, al sole, con le dita sporche.
- **Niente dato perso.** Meglio un campo libero riempito male che un dato che
  non si riesce a registrare.
- Terminologia: si usa SEMPRE il vocabolario di `docs/01-dominio.md`.
  Se serve un termine nuovo, si aggiunge lì prima di usarlo nel codice.
- Lingua: documentazione, UI e nomi di dominio in italiano. Codice in inglese
  dove è convenzione (parole chiave, librerie), nomi di entità in italiano.

## Indice documentazione

Aprire solo il file che serve al task in corso.

| File | Contenuto |
|---|---|
| `docs/00-visione.md` | Problema, utente, criteri di successo, cosa NON facciamo |
| `docs/01-dominio.md` | Glossario, entità, campi, stati. **Contratto fra tutti i fronti** |
| `docs/02-regole-mestiere.md` | Come si misura, controlli di coerenza, tolleranze |
| `docs/03-app-campo.md` | Schermate, flussi, casi limite dell'app mobile |
| `docs/04-dati-sync.md` | Schema dati, storage foto, strategia offline/sync |
| `docs/05-ufficio.md` | Consultazione, ricerca storica, PDF, export |
| `docs/06-operativo.md` | Device, backup, privacy, collaudo sul campo |
| `docs/decisioni/` | Una decisione architetturale per file, numerata, col perché |
| `STATO.md` | Dove siamo, cosa manca, prossimo passo |

## Procedura di lavoro

1. A inizio sessione: leggere `STATO.md` e il documento del fronte su cui si lavora.
2. Se una scelta è irreversibile o costosa da cambiare, scrivere un file in
   `docs/decisioni/` PRIMA di implementarla.
3. A fine sessione: aggiornare `STATO.md`. Sempre.
4. I `[DA DECIDERE]` nei documenti sono domande aperte per il committente,
   non vanno risolte inventando: vanno chieste.
