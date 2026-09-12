# Stato del progetto

Aggiornato: 2026-09-12

## Dove siamo
Fase di impostazione. Documentazione dei sei fronti creata. **Nessun codice
scritto**, per scelta.

## Deciso finora
- Il focus è il rilievo, non il preventivo.
- Prodotti principali: finestre e portefinestre. Il resto via campi liberi.
- Oggi i dati restano sul foglio → il valore primario è creare un archivio.
- Lo schema di apertura si compone (ante + tipi), non si disegna a mano.
- Offline first come vincolo non negoziabile.
- Convenzione di vista: sempre dall'interno, fissa, nessun interruttore in UI
  (`docs/decisioni/0001-convenzione-vista.md`). Non è un default di Cantiere.
- Numerazione Posizioni: codici liberi e sempre modificabili, nessuna
  rinumerazione automatica (`03-app-campo.md`).
- Misure: nessun avanzamento automatico fra i campi; tipo di misura senza
  default, scelta esplicita ogni volta.
- Nota vocale: registrazione audio separata dalle note scritte, non trascritta.

## Prossimo passo (uno solo)
**Validare il modello dati su carta.** Prendere tre rilievi veri già fatti e
riscriverli usando le entità e i campi di `docs/01-dominio.md`.
Se ci stanno senza forzature, il modello regge. Se no, si corregge PRIMA di
scrivere codice.

## Domande aperte per il committente
1. Elenco reale dei tipi di posa praticati. (`02-regole-mestiere.md`)
2. Soglie di tolleranza per i controlli C1, C2, C3. (`02-regole-mestiere.md`)
3. Errori ricorrenti realmente capitati negli anni. (`02-regole-mestiere.md`)
4. Quale distanziometro laser possiede. (`03-app-campo.md`)
5. Tablet o telefono, quale sistema operativo. (`06-operativo.md`)
6. Quale software di preventivazione usa, e se importa dati. (`05-ufficio.md`)

## Non ancora affrontato
- Scelta della piattaforma (PWA vs nativa) → serve una decisione in `docs/decisioni/`.
- Scelta del backend.
- Qualsiasi aspetto estetico.
