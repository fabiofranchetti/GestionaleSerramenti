// Archivio locale (IndexedDB). Scrittura sempre locale, mai dipendente dalla rete.
// Vedi docs/04-dati-sync.md: il dispositivo è la fonte di verità.

const DB_NAME = "rilievo-serramenti";
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cantieri")) {
        db.createObjectStore("cantieri", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("posizioni")) {
        const store = db.createObjectStore("posizioni", { keyPath: "id" });
        store.createIndex("cantiereId", "cantiereId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const db = {
  async put(storeName, obj) {
    const store = await tx(storeName, "readwrite");
    await wrap(store.put(obj));
    return obj;
  },
  async get(storeName, id) {
    const store = await tx(storeName, "readonly");
    return wrap(store.get(id));
  },
  async getAll(storeName) {
    const store = await tx(storeName, "readonly");
    return wrap(store.getAll());
  },
  async getAllByIndex(storeName, indexName, value) {
    const store = await tx(storeName, "readonly");
    return wrap(store.index(indexName).getAll(value));
  },
  async delete(storeName, id) {
    const store = await tx(storeName, "readwrite");
    return wrap(store.delete(id));
  },
};

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

export function nowIso() {
  return new Date().toISOString();
}
