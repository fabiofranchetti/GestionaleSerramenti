// Sincronizzazione opportunistica con un archivio condiviso (docs/04-dati-sync.md:
// "scrittura sempre locale, sincronizzazione opportunistica").
//
// IMPORTANTE — questo NON è la decisione di backend prevista in
// docs/04-dati-sync.md (ancora "[DA DECIDERE]"). È un banco di prova per
// dimostrare il concetto di invio dati all'ufficio, che funziona solo
// quando la pagina gira come Artifact pubblicato (non da file locale, non
// da un hosting qualsiasi come sarebbe l'app reale). Vedi STATO.md.
//
// Il modulo non fa nulla se l'ambiente non espone window.claude: l'app
// resta utilizzabile offline esattamente come prima.

let cloudPromise = null;

export function getCloud() {
  if (!window.claude || typeof window.claude.use !== "function") {
    return Promise.resolve(null);
  }
  if (!cloudPromise) {
    cloudPromise = Promise.all([window.claude.use("db"), window.claude.use("assets")]).then(
      ([dbCap, assetsCap]) => (dbCap ? { db: dbCap, assets: assetsCap } : null)
    );
  }
  return cloudPromise;
}

function cantiereDoc(cantiere) {
  return {
    codice: cantiere.codice || "",
    nome: cantiere.nome || "",
    cliente: cantiere.cliente,
    indirizzo: cantiere.indirizzo || "",
    referente: cantiere.referente,
    dataRilievo: cantiere.dataRilievo || "",
    noteAccesso: cantiere.noteAccesso || "",
    stato: cantiere.stato,
    defaults: cantiere.defaults,
    aggiornatoIl: new Date().toISOString(),
  };
}

export async function sincronizzaCantiere(cantiere) {
  const cloud = await getCloud();
  if (!cloud) return { ok: false, motivo: "non-disponibile" };
  await cloud.db.doc("cantieri/" + cantiere.id).set(cantiereDoc(cantiere));
  return { ok: true };
}

// Sincronizza una Posizione: carica le foto non ancora inviate come asset
// (le foto viaggiano separate dai dati, docs/04-dati-sync.md) e scrive il
// documento condiviso. Ritorna l'array foto aggiornato (con assetId/url) da
// salvare anche in locale, per non ricaricare le stesse foto due volte.
export async function sincronizzaPosizione(posizione, cloud) {
  const fotoSync = [];
  for (const f of posizione.foto) {
    if (!f.assetId && cloud.assets) {
      const res = await cloud.assets.upload(f.blob, { type: f.blob.type || "image/jpeg" });
      f.assetId = res.id;
      f.assetUrl = res.url;
    }
    fotoSync.push({ id: f.id, assetId: f.assetId || null, url: f.assetUrl || null, didascalia: f.didascalia || "" });
  }

  const prodottiSync = posizione.prodotti.map((p) => ({ ...p }));

  await cloud.db.doc("posizioni/" + posizione.id).set({
    cantiereId: posizione.cantiereId,
    codice: posizione.codice || "",
    piano: posizione.piano || "",
    ambiente: posizione.ambiente || "",
    descrizione: posizione.descrizione || "",
    misure: posizione.misure,
    tipoPosa: posizione.tipoPosa || "",
    note: posizione.note || "",
    foto: fotoSync,
    prodotti: prodottiSync,
    aggiornatoIl: new Date().toISOString(),
  });

  return posizione.foto;
}

export async function leggiArchivioUfficio() {
  const cloud = await getCloud();
  if (!cloud) return null;
  const [cantieriSnap, posizioniSnap] = await Promise.all([
    cloud.db.collection("cantieri").get(),
    cloud.db.collection("posizioni").get(),
  ]);
  const cantieri = cantieriSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const posizioni = posizioniSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { cantieri, posizioni };
}
