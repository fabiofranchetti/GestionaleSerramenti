# 03 — App di campo

## Vincoli d'uso

- Spesso **una mano sola** (l'altra regge il metro o il laser).
- Luce diretta, polvere, guanti, ginocchia per terra.
- **Nessuna rete.** Ogni schermata deve funzionare offline.
- Interruzioni continue: l'app deve poter essere chiusa e ripresa senza perdere nulla.

## Metrica di riferimento

**Tap per Posizione completa.** Da misurare su un caso reale e da tenere sotto
controllo a ogni modifica. Se sale, si è sbagliato qualcosa.

## Flusso principale

1. **Apri o crea Cantiere** → si impostano una volta i default (materiale,
   colore, tipo posa, vetro).
2. **Nuova Posizione** → si scrive subito l'ambiente (riferimento libero, es.
   "cucina", "camera 1") per ritrovarla facilmente; eredita poi i default di
   Cantiere. Il codice (P1, P2…) è proposto in automatico ma resta modificabile.
3. **Misure**: tastierino numerico grande, **nessun avanzamento automatico**
   fra i campi — si passa a mano da uno all'altro; unità fissa in mm. Il tipo
   di misura (luce muro / luce architettonica / altro) non ha un default:
   va scelto ogni volta, perché dipende dal cantiere.
4. **Schema**: si sceglie il numero di ante, poi per ogni anta il tipo. L'app
   disegna lo schema. Prima però si offrono le **configurazioni ricorrenti**
   (monoanta DX, due ante con ribalta a SX, portafinestra 2 ante…): un tap solo.
5. **Foto**: scatto rapido, più foto per Posizione, nessuna attesa di upload.
6. **Note** testuali e/o vocali.
7. **Salva** → l'app segnala eventuali controlli non superati.

## Funzioni che fanno la differenza

- **Duplica Posizione.** In una palazzina è la maggior parte del lavoro:
  "P3 = come P2 ma 30 cm più stretta".
- **Configurazioni ricorrenti** come libreria personale, alimentata dall'uso.
- **Nota vocale** come registrazione audio allegata alla Posizione, separata
  dalle note scritte — non trascritta in testo. Una dettatura vera e propria
  (voce → testo), anche per le misure, resta un'ipotesi da valutare a parte.
- **Distanziometro laser Bluetooth**: la misura entra nel campo attivo premendo
  il tasto sullo strumento. `[DA VERIFICARE]` quale modello possiede il
  committente e se espone un protocollo utilizzabile. Da progettare come
  funzione opzionale, mai come dipendenza.
- **Indicatore di completezza** per Cantiere: "3 Posizioni su 12 incomplete",
  visibile prima di lasciare il posto.

## Casi limite da gestire

- App chiusa dal sistema a metà inserimento → ripresa senza perdita.
- Batteria scarica → l'app non deve fare lavoro inutile in background.
- Foto scattate ma spazio disco pieno.
- Stessa Posizione modificata da due dispositivi (raro ma possibile).
- Rilievo iniziato nel cantiere sbagliato → spostare una Posizione da un
  Cantiere a un altro deve essere possibile.
- Numerazione: codici liberi. L'app propone il prossimo numero libero, ma il
  codice resta sempre modificabile a mano (es. inserire "P4bis" fra P4 e P5).
  Nessuna rinumerazione automatica delle altre Posizioni.

## Estetica

Viene **dopo**. Il primo prototipo può essere brutto, purché veloce e portabile
in cantiere. Regole minime: caratteri grandi, contrasto alto, aree di tocco
ampie, nessun elemento critico vicino ai bordi dove si tiene il tablet.
