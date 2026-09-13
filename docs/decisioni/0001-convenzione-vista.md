# 0001 — Convenzione di vista per il senso di apertura

## Stato
Accettata

## Data
2026-09-12

## Contesto
`01-dominio.md` segnalava come `[DA DECIDERE]` se il senso di apertura delle
ante si indica visto dall'interno o dall'esterno. Il documento la segnala
come "la fonte di errore più costosa del mestiere": un'inversione qui
significa un serramento ordinato con l'apertura sbagliata.

## Decisione
Il senso di apertura si indica **sempre visto dall'interno**. Non è una
preferenza per Cantiere né per Posizione: è un'unica convenzione valida per
tutti i rilievi, senza eccezioni e senza interruttore in UI.

## Alternative considerate
- Interruttore per Cantiere (impostato una volta nei default) — scartato:
  aggiunge uno stato da controllare per ogni Cantiere senza un reale
  bisogno, dato che la convenzione è sempre la stessa.
- Interruttore per Posizione — scartato: è la fonte d'errore che la
  convenzione doveva eliminare, non introdurre come opzione ricorrente.

## Conseguenze
- La UI mostra la convenzione come testo fisso ("Vista: dall'interno") in
  ogni schermata di rilievo, mai come controllo modificabile.
- Se in futuro emergesse un caso reale che richiede l'altra vista, va
  discusso come eccezione esplicita, non riaperto come opzione generale.
