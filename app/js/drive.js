// Sincronizzazione con Google Drive dell'utente — docs/decisioni/0002.
//
// Scelta deliberata: Drive personale del serramentista (gratuito, quota che
// ha già), non un servizio dedicato a pagamento. Usa lo scope
// "drive.file": l'app vede SOLO i file che crea lei, mai il resto del
// Drive dell'utente. Nessun server nostro nel mezzo — il browser parla
// direttamente con le API di Google.
//
// Per funzionare serve un Client ID Google (OAuth), che l'utente crea una
// volta sola sulla Google Cloud Console (gratuito) e incolla nelle
// Impostazioni dell'app. Senza Client ID, queste funzioni restano inerti e
// il resto dell'app continua a funzionare offline come sempre.

const CARTELLA_RADICE = "Rilievi Serramenti";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

let accessToken = null;
let gisPromise = null;
let tokenClient = null;

export function getClientId() {
  return localStorage.getItem("googleClientId") || "";
}
export function setClientId(id) {
  localStorage.setItem("googleClientId", (id || "").trim());
}
export function isConnesso() {
  return !!accessToken;
}
export function disconnetti() {
  accessToken = null;
}

function caricaGis() {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Impossibile contattare Google (serve una connessione a Internet)."));
    document.head.appendChild(s);
  });
  return gisPromise;
}

export async function connetti() {
  const clientId = getClientId();
  if (!clientId) throw new Error("Configura prima il Client ID di Google, nelle Impostazioni.");
  await caricaGis();
  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) return reject(new Error("Accesso a Google negato: " + resp.error));
        accessToken = resp.access_token;
        resolve(accessToken);
      },
      error_callback: (err) => reject(new Error("Accesso a Google non riuscito: " + (err.type || err.message || "errore sconosciuto"))),
    });
    tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
  });
}

async function conToken() {
  if (accessToken) return accessToken;
  return connetti();
}

async function driveFetch(path, opts = {}) {
  const token = await conToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    accessToken = null;
    throw new Error("Sessione Google scaduta: premi di nuovo “Connetti Google Drive”.");
  }
  if (!res.ok) throw new Error(`Google Drive ha risposto con errore ${res.status}.`);
  return res;
}

function escapeQ(s) {
  return String(s).replace(/'/g, "\\'");
}

async function trovaOCreaCartella(nome, parentId) {
  const filtriParent = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
  const q = `name='${escapeQ(nome)}' and mimeType='application/vnd.google-apps.folder' and trashed=false${filtriParent}`;
  const res = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await res.json();
  if (data.files && data.files.length) return data.files[0].id;
  const createRes = await driveFetch("files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome, mimeType: "application/vnd.google-apps.folder", parents: parentId ? [parentId] : undefined }),
  });
  return (await createRes.json()).id;
}

async function trovaFile(nome, parentId) {
  const q = `name='${escapeQ(nome)}' and trashed=false and '${parentId}' in parents`;
  const res = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await res.json();
  return data.files && data.files[0] ? data.files[0].id : null;
}

async function caricaFile(nome, parentId, contenuto, mimeType, fileIdEsistente) {
  const metadata = { name: nome, mimeType };
  if (!fileIdEsistente) metadata.parents = [parentId];
  const boundary = "rilievo_" + Math.random().toString(16).slice(2);
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const bodyStart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const bodyEnd = `\r\n--${boundary}--`;
  const contentBlob = contenuto instanceof Blob ? contenuto : new Blob([contenuto], { type: mimeType });
  const multipart = new Blob([metaPart, bodyStart, contentBlob, bodyEnd]);
  const url = fileIdEsistente
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileIdEsistente}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  const token = await conToken();
  const res = await fetch(url, {
    method: fileIdEsistente ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  if (!res.ok) throw new Error(`Caricamento su Drive non riuscito (${res.status}).`);
  return res.json();
}

// Invia un Cantiere e le sue Posizioni (con le foto non ancora inviate) su
// Drive, in una cartella dedicata al cantiere. Ritorna le Posizioni con i
// riferimenti Drive aggiornati (da salvare anche in locale, per non
// ricaricare due volte la stessa foto).
export async function sincronizzaCantiereSuDrive(cantiere, posizioni) {
  const radiceId = await trovaOCreaCartella(CARTELLA_RADICE);
  const nomeCartella = (cantiere.nome || cantiere.codice || cantiere.id).trim();
  const cartellaCantiereId = await trovaOCreaCartella(nomeCartella, radiceId);
  const cartellaFotoId = await trovaOCreaCartella("foto", cartellaCantiereId);

  for (const p of posizioni) {
    for (const f of p.foto) {
      if (!f.driveFileId) {
        const nomeFile = `${p.codice || p.id}-${f.id}.jpg`;
        const risultato = await caricaFile(nomeFile, cartellaFotoId, f.blob, f.blob.type || "image/jpeg");
        f.driveFileId = risultato.id;
      }
    }
  }

  const payload = {
    esportatoIl: new Date().toISOString(),
    cantiere,
    posizioni: posizioni.map(({ foto, ...resto }) => ({
      ...resto,
      foto: foto.map((f) => ({ id: f.id, driveFileId: f.driveFileId, didascalia: f.didascalia || "" })),
    })),
  };
  const nomeJson = `rilievo-${cantiere.codice || cantiere.id}.json`;
  const idEsistente = await trovaFile(nomeJson, cartellaCantiereId);
  await caricaFile(nomeJson, cartellaCantiereId, JSON.stringify(payload, null, 2), "application/json", idEsistente);

  return posizioni;
}

// Legge dall'archivio Drive tutti i rilievi inviati (per la Vista ufficio).
export async function leggiArchivioDaDrive() {
  const radiceId = await trovaOCreaCartella(CARTELLA_RADICE);
  const cartelleRes = await driveFetch(
    `files?q=${encodeURIComponent(`'${radiceId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)`
  );
  const cartelle = (await cartelleRes.json()).files || [];

  const risultati = [];
  for (const cart of cartelle) {
    const fileRes = await driveFetch(
      `files?q=${encodeURIComponent(`'${cart.id}' in parents and name contains 'rilievo-' and trashed=false`)}&fields=files(id,name)`
    );
    const files = (await fileRes.json()).files || [];
    for (const f of files) {
      const contenutoRes = await driveFetch(`files/${f.id}?alt=media`);
      risultati.push(await contenutoRes.json());
    }
  }
  return risultati;
}

export async function scaricaFotoDaDrive(driveFileId) {
  const res = await driveFetch(`files/${driveFileId}?alt=media`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
