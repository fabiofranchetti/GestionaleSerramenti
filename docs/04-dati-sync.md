# 04 — Dati e sincronizzazione

Questo è il fronte dove falliscono la maggior parte delle app di campo. Merita
attenzione sproporzionata rispetto alla sua visibilità.

## Principi

1. **Il dispositivo è la fonte di verità** finché il dato non è confermato
   altrove. Nessuna cancellazione locale automatica.
2. **Scrittura sempre locale, sincronizzazione opportunistica.** L'utente non
   deve mai aspettare la rete.
3. **Nessuna perdita silenziosa.** In caso di conflitto si conservano entrambe
   le versioni e si chiede, non si sovrascrive.
4. **Le foto viaggiano separate dai dati** e più lentamente: un rilievo è
   consultabile in ufficio anche se le foto stanno ancora salendo.

## Decisioni aperte

- `[DA DECIDERE]` **Piattaforma**: app web installabile (PWA) vs app nativa.
  Vedi `decisioni/0001` quando sarà scritta.
- `[DA DECIDERE]` **Backend**: servizio gestito (es. database cloud con sync)
  vs sincronizzazione su file. Criteri: costo ricorrente, semplicità, controllo
  del dato, possibilità di backup autonomo.
- `[DA DECIDERE]` **Identificatori**: generati sul dispositivo (necessario per
  creare Posizioni offline) — quasi certamente UUID.
- `[DA DECIDERE]` Storage foto: dimensione di compressione, se conservare
  l'originale, quanto spazio serve per anno.

## Requisiti non negoziabili

- Funzionamento completo a rete assente, per l'intera durata di un rilievo.
- Sincronizzazione automatica al ritorno della rete, senza azione dell'utente.
- Stato di sincronizzazione visibile ("tutto sincronizzato" / "3 elementi in coda").
- **Backup esportabile dall'utente**, indipendente dal fornitore del servizio.
  Se domani il servizio chiude, l'archivio resta.
- Storico non distruttivo: modificare una misura non deve cancellare la precedente
  senza traccia. `[DA DECIDERE]` quanto storico conservare.
