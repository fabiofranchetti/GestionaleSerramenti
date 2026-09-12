# 00 — Visione

## Il problema

Oggi il rilievo si svolge così: in cantiere si annota a mano su un foglio
(misure, bozza della finestra, senso di apertura, tipo, numero ante). In ufficio
i dati **spesso restano sul foglio**. Quando servono si ricopiano a mano, e in
alcuni casi non vengono mai digitalizzati.

Conseguenze:
- nessun archivio consultabile dei lavori passati;
- rischio di errore nella ricopiatura;
- fogli che si perdono, si bagnano, diventano illeggibili;
- ritorni in cantiere per un dato mancante.

## L'utente

Un solo utilizzatore principale (il titolare). In cantiere a volte è solo, a
volte in due. Il caso "da solo" è quello da ottimizzare, perché è il più scomodo:
una mano regge il tablet, l'altra il metro.

## Criterio di successo

> Torno dal cantiere e non devo riscrivere niente a mano. Al massimo copio-incollo.

Criterio secondario, altrettanto importante:

> Fra due anni ritrovo in dieci secondi le misure di un cantiere che non ricordo.

## Cosa NON facciamo (almeno all'inizio)

- Motore di preventivi e listini prezzi.
- Generazione di ordini ai fornitori.
- Gestione commesse, scadenze, fatturazione.
- Multi-utente con permessi, ruoli, team.
- Disegno libero a mano: gli schemi si compongono, non si disegnano.
- Integrazione automatica col software di preventivazione esistente
  (rimandata: prima si consolida il rilievo).

## Ambito prodotti

Focus primario: **finestre e portefinestre**. Tutto il resto (oscuranti,
zanzariere, porte, scorrevoli) si registra come prodotto accessorio con campi
liberi, senza modellazione dedicata in questa fase.

## Rischi principali

1. **Modello dati sbagliato** scoperto dopo aver costruito l'interfaccia.
   Mitigazione: validare il modello su tre rilievi veri già fatti, su carta,
   prima di scrivere codice.
2. **App più lenta della matita.** Mitigazione: prototipo grezzo portato in
   cantiere entro poche settimane, prima di curare l'estetica.
3. **Perdita di dati** per bug di sincronizzazione. Mitigazione: il dispositivo
   è la fonte di verità finché il dato non è confermato altrove; nessuna
   cancellazione locale automatica.
