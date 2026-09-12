# 01 — Dominio

**Questo file è il contratto fra tutti i fronti.** Nomi, campi e stati definiti
qui valgono per UI, database, export e conversazione. Non si introducono
sinonimi.

## Glossario

| Termine | Significato |
|---|---|
| **Cantiere** | Il luogo/lavoro oggetto del rilievo. Contiene una o più Posizioni. |
| **Posizione** | Un singolo foro/vano da servire. Identificata da un codice (P1, P2…). È l'unità di rilievo. |
| **Prodotto** | Ciò che va installato in una Posizione. Una Posizione può averne più d'uno (serramento + zanzariera + oscurante). |
| **Luce muro** | Misura netta del foro grezzo, muratura contro muratura. |
| **Luce architettonica** | Misura netta a finito, contromazzette/intonaco inclusi. |
| **Misura di costruzione** | Misura effettiva del serramento da ordinare. **Non si calcola in cantiere.** |
| **Anta** | Elemento apribile o fisso del serramento. |
| **Senso di apertura** | Come e da che lato si apre un'anta, visto da un lato convenzionale (vedi sotto). |
| **Schema** | Rappresentazione grafica della composizione delle ante, generata dai dati, non disegnata a mano. |

## Convenzione di vista

Le aperture si indicano **sempre viste dall'interno**. Fissato una volta per
tutte (vedi `decisioni/0001-convenzione-vista.md`) e scritto nella UI in ogni
schermata, perché è la fonte di errore più costosa del mestiere.

## Entità

### Cantiere
- `codice` (generato, univoco)
- `nome` / riferimento breve
- `cliente` (nome, telefono, email)
- `indirizzo`
- `referente in cantiere` (nome, telefono)
- `data rilievo`
- `note accesso` (ponteggio, ascensore, parcheggio, orari, chiavi)
- `stato` (vedi ciclo di vita)
- `default di cantiere`: materiale, colore, tipo posa, vetro, convenzione vista.
  Servono a pre-compilare ogni nuova Posizione.

### Posizione
- `codice` (P1, P2, … modificabile)
- `piano`
- `ambiente` (cucina, bagno, camera 1…)
- `descrizione libera`
- **Misure grezze** (in mm):
  - `larghezza_alto`, `larghezza_centro`, `larghezza_basso`
  - `altezza_sx`, `altezza_centro`, `altezza_dx`
  - `diagonale_1`, `diagonale_2`
  - `spessore_muro`
  - `altezza_davanzale`, `sporgenza_davanzale`
  - `tipo_misura` (luce muro / luce architettonica / altro)
- `tipo_posa` (in luce, a cappotto, su telaio esistente, sostituzione con
  mantenimento telaio, …) `[DA COMPLETARE con l'elenco reale]`
- `foto[]` (almeno una, con didascalia opzionale)
- `note`
- `completa` (booleano derivato dai controlli di coerenza)

### Prodotto (n per Posizione)
- `tipologia` (finestra, portafinestra, accessorio…)
- `materiale`, `colore_interno`, `colore_esterno`
- `numero_ante`
- `ante[]`: per ciascuna → `tipo` fra:
  - `fissa`
  - `battente_dx`, `battente_sx`
  - `antaribalta_dx`, `antaribalta_sx`
  - `vasistas`
  - `scorrevole_dx`, `scorrevole_sx`
  - `[DA COMPLETARE se ne servono altri]`
- `traverso` / `sopraluce` (sì/no, altezza)
- `vetro`
- `accessori` (maniglia, cerniere a vista, soglia…)
- `campi_liberi` (chiave-valore, per tutto ciò che non è modellato)
- `note`

> **Perché i campi liberi.** Alcuni prodotti si gestiscono a mano, fuori da
> qualsiasi software. Il rilievo deve poterli registrare comunque, senza
> attendere una modifica dello schema.

## Ciclo di vita di un Cantiere

`bozza` → `rilevato` → `verificato` → `archiviato`

- **bozza**: in corso, sul dispositivo.
- **rilevato**: tutte le Posizioni hanno i controlli di coerenza superati.
- **verificato**: riletto in ufficio, pronto per essere usato.
- **archiviato**: lavoro chiuso, resta consultabile per ricerca storica.

Nessuno stato comporta cancellazione di dati.
