# 02 — Regole di mestiere

Qui vive la conoscenza del serramentista. È il file che il committente deve
poter correggere senza toccare codice.

**Nota di ambito:** poiché la misura di costruzione la calcola un software
esterno o si fa a mano, questo file è soprattutto un elenco di **controlli di
coerenza**, non di formule.

## Principio guida

In cantiere si registra il **grezzo misurato**. Non si arrotonda, non si
sottrae il gioco di posa, non si "aggiusta". L'interpretazione avviene dopo.

## Controlli di coerenza (eseguiti sul dispositivo, subito)

Ogni controllo produce un avviso **mentre si è ancora in cantiere**. Nessun
controllo blocca il salvataggio: al massimo segna la Posizione come incompleta.

| # | Controllo | Soglia | Livello |
|---|---|---|---|
| C1 | Scarto fra le tre larghezze | `[DA DECIDERE]` mm | avviso |
| C2 | Scarto fra le tre altezze | `[DA DECIDERE]` mm | avviso |
| C3 | Differenza fra le diagonali (fuori squadro) | `[DA DECIDERE]` mm | avviso |
| C4 | Diagonali mancanti | — | avviso |
| C5 | Spessore muro mancante | — | avviso |
| C6 | Nessuna foto sulla Posizione | — | avviso forte |
| C7 | Tipo di misura non indicato (luce muro / architettonica) | — | bloccante per stato `rilevato` |
| C8 | Numero ante incoerente con lo schema composto | — | bloccante |
| C9 | Misura fuori intervallo plausibile | < 200 mm o > 4000 mm | conferma esplicita |
| C10 | Due Posizioni con misure identiche nello stesso cantiere | — | segnalazione (probabile duplicato involontario o legittimo) |

## Cosa serve sempre, senza eccezioni

Il minimo indispensabile perché una Posizione non costringa a tornare in cantiere:

1. larghezza e altezza (almeno in tre punti ciascuna);
2. tipo di misura rilevata;
3. spessore muro;
4. almeno una foto del vano;
5. schema di apertura composto;
6. altezza davanzale, per le finestre.

## Tipi di posa

`[DA COMPLETARE]` Elencare i tipi realmente praticati e, per ciascuno, quali
misure aggiuntive richiedono (es. presenza di cappotto → spessore isolante;
mantenimento telaio → misure del telaio esistente, battuta, spessore).

## Errori ricorrenti da prevenire

`[DA COMPILARE dal committente]` Questa sezione va riempita ripensando agli
errori realmente successi negli anni. Ogni errore ricorrente dovrebbe diventare
un controllo automatico.

Candidati tipici:
- senso di apertura invertito per confusione fra vista interna ed esterna;
- misura presa sull'intonaco invece che sul grezzo;
- dimenticanza del cassonetto o della guida tapparella che riduce l'altezza utile;
- ostacoli non rilevati (tubi, termosifoni, ante che sbattono su un muro).
