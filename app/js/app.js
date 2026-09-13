import { db, uuid, nowIso } from "./db.js";
import { calcolaControlli, trovaDuplicatiSospetti, isCompleta, livelloClasse } from "./checks.js";
import { TIPI_ANTA, TIPO_ANTA_LABEL, PRESET_ANTE, svgAnta } from "./ante.js";
import {
  getClientId, setClientId, isConnesso, disconnetti, connetti,
  sincronizzaCantiereSuDrive, leggiArchivioDaDrive, scaricaFotoDaDrive,
} from "./drive.js";

const root = document.getElementById("app");

// ---------- helper DOM ----------
function h(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  return e;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}

let saveTimer = null;
function debounceSave(fn) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(fn, 300);
}

// ---------- modelli vuoti ----------
function nuovoCantiere() {
  return {
    id: uuid(),
    codice: "",
    nome: "",
    cliente: { nome: "", telefono: "", email: "" },
    indirizzo: "",
    referente: { nome: "", telefono: "" },
    dataRilievo: new Date().toISOString().slice(0, 10),
    noteAccesso: "",
    stato: "bozza",
    defaults: { materiale: "", colore: "", tipoPosa: "", vetro: "", convenzioneVista: "" },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function nuovaPosizione(cantiere, codiceSuggerito) {
  return {
    id: uuid(),
    cantiereId: cantiere.id,
    codice: codiceSuggerito || "",
    piano: "",
    ambiente: "",
    descrizione: "",
    misure: {
      larghezzaAlto: "", larghezzaCentro: "", larghezzaBasso: "",
      altezzaSx: "", altezzaCentro: "", altezzaDx: "",
      diagonale1: "", diagonale2: "",
      spessoreMuro: "", altezzaDavanzale: "", sporgenzaDavanzale: "",
      tipoMisura: "",
    },
    tipoPosa: cantiere.defaults.tipoPosa || "",
    foto: [],
    note: "",
    prodotti: [nuovoProdotto(cantiere)],
    sync: { stato: "locale", il: null },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function nuovoProdotto(cantiere) {
  return {
    id: uuid(),
    tipologia: "finestra",
    materiale: cantiere ? cantiere.defaults.materiale : "",
    coloreInterno: cantiere ? cantiere.defaults.colore : "",
    coloreEsterno: cantiere ? cantiere.defaults.colore : "",
    numeroAnte: "",
    ante: [],
    traverso: { presente: false, altezza: "" },
    vetro: cantiere ? cantiere.defaults.vetro : "",
    accessori: "",
    campiLiberi: "",
    note: "",
  };
}

// ---------- router ----------
async function route() {
  const hash = location.hash.slice(1) || "/";
  const parts = hash.split("/").filter(Boolean);
  clear(root);
  try {
    if (parts.length === 0) {
      await screenElencoCantieri();
    } else if (parts[0] === "ufficio") {
      await screenUfficio();
    } else if (parts[0] === "cantiere" && parts[1] === "nuovo") {
      const c = nuovoCantiere();
      await db.put("cantieri", c);
      location.hash = `#/cantiere/${c.id}`;
    } else if (parts[0] === "cantiere" && parts[1] && !parts[2]) {
      await screenCantiere(parts[1]);
    } else if (parts[0] === "cantiere" && parts[2] === "posizione" && parts[3] === "nuovo") {
      const cantiere = await db.get("cantieri", parts[1]);
      const esistenti = await db.getAllByIndex("posizioni", "cantiereId", cantiere.id);
      const codice = "P" + (esistenti.length + 1);
      const p = nuovaPosizione(cantiere, codice);
      await db.put("posizioni", p);
      location.hash = `#/cantiere/${cantiere.id}/posizione/${p.id}`;
    } else if (parts[0] === "cantiere" && parts[2] === "posizione" && parts[3]) {
      await screenPosizione(parts[1], parts[3]);
    } else {
      root.appendChild(h("div", { class: "empty-state" }, "Pagina non trovata."));
    }
  } catch (err) {
    console.error(err);
    root.appendChild(h("div", { class: "bloccante" }, "Errore: " + err.message));
  }
}

window.addEventListener("hashchange", route);

// ---------- topbar ----------
function topbar(titolo, backHash) {
  return h(
    "div", { class: "topbar" },
    backHash ? h("button", { onclick: () => (location.hash = backHash) }, "←") : null,
    h("h1", {}, titolo)
  );
}

// ---------- schermata: elenco cantieri ----------
async function screenElencoCantieri() {
  root.appendChild(topbar("Rilievi", null));
  const cantieri = (await db.getAll("cantieri")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  root.appendChild(
    h("div", { class: "row", style: "margin-bottom:14px;" },
      h("button", { class: "primary", style: "flex:2;", onclick: () => (location.hash = "#/cantiere/nuovo") }, "+ Nuovo cantiere"),
      h("button", { style: "flex:1;", onclick: () => (location.hash = "#/ufficio") }, "☁️ Vista ufficio")
    )
  );

  root.appendChild(await renderImpostazioni());

  if (cantieri.length === 0) {
    root.appendChild(h("div", { class: "empty-state" }, "Nessun cantiere ancora. Crea il primo rilievo."));
    return;
  }

  for (const c of cantieri) {
    const posizioni = await db.getAllByIndex("posizioni", "cantiereId", c.id);
    const complete = posizioni.filter(isCompleta).length;
    root.appendChild(
      h(
        "div", { class: "card tappable", onclick: () => (location.hash = `#/cantiere/${c.id}`) },
        h("div", { class: "row between" },
          h("div", { class: "list-item-title" }, c.nome || "(senza nome)"),
          h("span", { class: "stato-pill" }, c.stato)
        ),
        h("div", { class: "list-item-sub" }, c.indirizzo || "—"),
        h("div", { class: "list-item-sub" }, c.dataRilievo || ""),
        h("div", { class: "completezza" }, posizioni.length ? `${complete}/${posizioni.length} Posizioni complete` : "Nessuna Posizione")
      )
    );
  }
}

async function renderImpostazioni() {
  const clientIdAttuale = getClientId();
  const dettagli = h("details", { class: "card" },
    h("summary", { style: "font-weight:700;cursor:pointer;" }, "⚙️ Impostazioni: sincronizzazione con Google Drive")
  );
  const corpo = h("div", { style: "margin-top:10px;" },
    h("div", { class: "list-item-sub" },
      "Serve un Client ID Google (gratuito, si crea una volta sola sulla Google Cloud Console). Vedi docs/decisioni/0002-sincronizzazione-google-drive.md per i passaggi."
    ),
    h("div", { class: "field" },
      h("label", {}, "Client ID Google"),
      h("input", { type: "text", value: clientIdAttuale, id: "input-client-id" })
    ),
    h("div", { class: "row" },
      h("button", { class: "primary", onclick: () => {
        const val = document.getElementById("input-client-id").value;
        setClientId(val);
        disconnetti();
        alert("Client ID salvato.");
      } }, "Salva"),
      h("button", { onclick: () => { disconnetti(); alert("Disconnesso da Google Drive su questa sessione."); } }, "Disconnetti")
    )
  );
  dettagli.appendChild(corpo);
  return dettagli;
}

// ---------- schermata: cantiere ----------
async function screenCantiere(id) {
  const cantiere = await db.get("cantieri", id);
  if (!cantiere) {
    root.appendChild(topbar("Cantiere non trovato", "#/"));
    return;
  }

  root.appendChild(topbar(cantiere.nome || "Nuovo cantiere", "#/"));

  const form = h("div", { class: "stack" });
  root.appendChild(form);

  function field(label, path, opts = {}) {
    const value = getPath(cantiere, path) ?? "";
    const input = h("input", {
      type: opts.type || "text",
      value,
      "data-path": path,
    });
    return h("div", { class: "field" }, h("label", {}, label), input);
  }

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Cantiere"),
      field("Nome / riferimento breve", "nome"),
      field("Indirizzo", "indirizzo"),
      field("Data rilievo", "dataRilievo", { type: "date" }),
      h("div", { class: "field" },
        h("label", {}, "Stato"),
        h("select", { "data-path": "stato", "data-select": "stato" },
          ...["bozza", "rilevato", "verificato", "archiviato"].map((s) =>
            h("option", { value: s, selected: cantiere.stato === s || null }, s)
          )
        )
      )
    )
  );

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Cliente"),
      field("Nome cliente", "cliente.nome"),
      field("Telefono", "cliente.telefono", { type: "tel" }),
      field("Email", "cliente.email", { type: "email" })
    )
  );

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Referente in cantiere"),
      field("Nome", "referente.nome"),
      field("Telefono", "referente.telefono", { type: "tel" })
    )
  );

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Note accesso"),
      h("textarea", { "data-path": "noteAccesso" }, cantiere.noteAccesso || "")
    )
  );

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Default per le nuove Posizioni"),
      field("Materiale", "defaults.materiale"),
      field("Colore", "defaults.colore"),
      field("Tipo di posa", "defaults.tipoPosa"),
      field("Vetro", "defaults.vetro"),
      h("div", { class: "field" },
        h("label", {}, "Convenzione di vista (aperture viste da…)"),
        h("select", { "data-path": "defaults.convenzioneVista" },
          h("option", { value: "", selected: !cantiere.defaults.convenzioneVista || null }, "— da scegliere —"),
          h("option", { value: "interno", selected: cantiere.defaults.convenzioneVista === "interno" || null }, "Dall'interno"),
          h("option", { value: "esterno", selected: cantiere.defaults.convenzioneVista === "esterno" || null }, "Dall'esterno")
        ),
        !cantiere.defaults.convenzioneVista
          ? h("div", { class: "avviso" }, "Non ancora scelta. Va fissata prima di rilevare le aperture: è la fonte di errore più costosa del mestiere.")
          : null
      )
    )
  );

  form.addEventListener("input", (e) => {
    const path = e.target.dataset.path;
    if (!path) return;
    setPath(cantiere, path, e.target.value);
    cantiere.updatedAt = nowIso();
    debounceSave(async () => {
      await db.put("cantieri", cantiere);
      if (path === "nome") document.querySelector(".topbar h1").textContent = cantiere.nome || "Nuovo cantiere";
    });
  });

  form.addEventListener("change", async (e) => {
    if (e.target.dataset.path === "stato" && e.target.value === "rilevato") {
      const posizioni = await db.getAllByIndex("posizioni", "cantiereId", cantiere.id);
      const incomplete = posizioni.filter((p) => !isCompleta(p));
      if (incomplete.length > 0) {
        alert(
          "Non si può passare a \"rilevato\": " + incomplete.length +
          " Posizione/i hanno controlli bloccanti non superati (" +
          incomplete.map((p) => p.codice).join(", ") + ")."
        );
        e.target.value = cantiere.stato;
        return;
      }
    }
    setPath(cantiere, e.target.dataset.path, e.target.value);
    cantiere.updatedAt = nowIso();
    await db.put("cantieri", cantiere);
  });

  // Sincronizzazione con Google Drive (vedi js/drive.js e docs/decisioni/0002)
  const syncBox = h("div", {});
  root.appendChild(syncBox);
  await renderSyncBox(syncBox, cantiere);

  // Posizioni
  const tutteLePosizioni = await db.getAllByIndex("posizioni", "cantiereId", cantiere.id);
  const completeCount = tutteLePosizioni.filter(isCompleta).length;
  root.appendChild(
    h("div", { class: "completezza", style: "margin-bottom:8px;" },
      tutteLePosizioni.length
        ? `${completeCount}/${tutteLePosizioni.length} Posizioni complete`
        : "Nessuna Posizione ancora"
    )
  );
  const posBox = h("div", {});
  root.appendChild(h("h2", {}, "Posizioni"));
  root.appendChild(posBox);
  await renderElencoPosizioni(posBox, cantiere);

  root.appendChild(
    h("div", { class: "footer-actions" },
      h("button", { class: "primary", onclick: () => (location.hash = `#/cantiere/${cantiere.id}/posizione/nuovo`) }, "+ Nuova Posizione"),
      h("button", { onclick: () => esportaBackup(cantiere.id) }, "Esporta backup")
    )
  );
}

async function renderSyncBox(container, cantiere) {
  clear(container);
  const clientId = getClientId();
  if (!clientId) {
    container.appendChild(
      h("div", { class: "banner" }, "☁️ Google Drive non configurato: imposta il Client ID nelle Impostazioni (home) per inviare i rilievi.")
    );
    return;
  }

  const posizioni = await db.getAllByIndex("posizioni", "cantiereId", cantiere.id);
  const sincronizzate = posizioni.filter((p) => p.sync && p.sync.stato === "sincronizzato").length;

  const stato = h("div", { class: "banner" },
    isConnesso()
      ? `☁️ Google Drive: ${sincronizzate}/${posizioni.length} Posizioni inviate.`
      : "☁️ Non ancora connesso a Google Drive."
  );
  const btn = h("button", { class: "primary", style: "width:100%;margin-bottom:12px;" },
    isConnesso() ? "Invia tutto su Google Drive" : "Connetti Google Drive e invia"
  );
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Invio in corso…";
    try {
      if (!isConnesso()) await connetti();
      const posizioniAggiornate = await sincronizzaCantiereSuDrive(cantiere, posizioni);
      for (const p of posizioniAggiornate) {
        p.sync = { stato: "sincronizzato", il: nowIso() };
        await db.put("posizioni", p);
      }
    } catch (err) {
      alert("Invio non riuscito: " + err.message);
    }
    await renderSyncBox(container, cantiere);
  });

  container.appendChild(stato);
  container.appendChild(btn);
}

async function renderElencoPosizioni(container, cantiere) {
  clear(container);
  const posizioni = (await db.getAllByIndex("posizioni", "cantiereId", cantiere.id))
    .sort((a, b) => a.codice.localeCompare(b.codice, undefined, { numeric: true }));

  if (posizioni.length === 0) {
    container.appendChild(h("div", { class: "empty-state" }, "Nessuna Posizione ancora."));
    return;
  }

  const duplicati = trovaDuplicatiSospetti(posizioni);
  if (duplicati.length) {
    for (const d of duplicati) {
      container.appendChild(h("div", { class: "avviso" }, `C10 — misure identiche fra ${d.posizioni.join(", ")}: probabile duplicato involontario (o legittimo).`));
    }
  }

  for (const p of posizioni) {
    const controlli = calcolaControlli(p);
    const completa = isCompleta(p);
    container.appendChild(
      h("div", { class: "card tappable", onclick: () => (location.hash = `#/cantiere/${cantiere.id}/posizione/${p.id}`) },
        h("div", { class: "row between" },
          h("div", { class: "list-item-title" }, p.codice || "(senza codice)"),
          h("span", { class: "stato-pill", style: completa ? "" : "background:#fee2e2;border-color:#991b1b;color:#991b1b;" }, completa ? "completa" : "incompleta")
        ),
        h("div", { class: "list-item-sub" }, [p.piano, p.ambiente].filter(Boolean).join(" — ") || "—"),
        h("div", { class: "list-item-sub" }, p.sync && p.sync.stato === "sincronizzato" ? "☁️ inviata all'ufficio" : "non ancora inviata"),
        controlli.length ? h("div", { class: "list-item-sub" }, `${controlli.length} controllo/i da rivedere`) : null,
        h("div", { class: "row", style: "margin-top:6px;" },
          h("button", { onclick: (e) => { e.stopPropagation(); duplicaPosizione(cantiere, p); } }, "Duplica")
        )
      )
    );
  }
}

async function duplicaPosizione(cantiere, posizione) {
  const esistenti = await db.getAllByIndex("posizioni", "cantiereId", cantiere.id);
  const clone = JSON.parse(JSON.stringify(posizione));
  clone.id = uuid();
  clone.codice = "";
  clone.foto = [];
  clone.note = "";
  clone.prodotti = clone.prodotti.map((p) => ({ ...p, id: uuid() }));
  clone.sync = { stato: "locale", il: null };
  clone.createdAt = nowIso();
  clone.updatedAt = nowIso();
  await db.put("posizioni", clone);
  location.hash = `#/cantiere/${cantiere.id}/posizione/${clone.id}`;
}

async function esportaBackup(cantiereId) {
  const cantiere = await db.get("cantieri", cantiereId);
  const posizioni = await db.getAllByIndex("posizioni", "cantiereId", cantiereId);
  // Le foto (Blob) non sono incluse in questo export: dimensione e formato del
  // backup foto sono ancora "[DA DECIDERE]" in docs/04-dati-sync.md.
  const posizioniSenzaFoto = posizioni.map(({ foto, ...resto }) => ({ ...resto, numeroFoto: (foto || []).length }));
  const payload = { esportatoIl: nowIso(), cantiere, posizioni: posizioniSenzaFoto };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: `rilievo-${cantiere.codice || cantiere.id}.json` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ---------- schermata: ufficio (dati letti dall'archivio condiviso) ----------
async function screenUfficio() {
  root.appendChild(topbar("Vista ufficio", "#/"));
  root.appendChild(
    h("div", { class: "banner" }, "Questi dati vengono letti da Google Drive, non dal dispositivo: rappresentano cosa vede l'ufficio dopo che il rilievo è stato inviato dal cantiere.")
  );

  const clientId = getClientId();
  if (!clientId) {
    root.appendChild(
      h("div", { class: "bloccante" }, "Google Drive non configurato: imposta il Client ID nelle Impostazioni (home).")
    );
    return;
  }

  const btn = h("button", { class: "primary", style: "width:100%;margin-bottom:12px;" }, isConnesso() ? "Aggiorna dati da Drive" : "Connetti Google Drive");
  const risultati = h("div", {});
  root.appendChild(btn);
  root.appendChild(risultati);

  async function carica() {
    clear(risultati);
    risultati.appendChild(h("div", { class: "list-item-sub" }, "Lettura da Google Drive…"));
    let archivio;
    try {
      if (!isConnesso()) await connetti();
      archivio = await leggiArchivioDaDrive();
    } catch (err) {
      clear(risultati);
      risultati.appendChild(h("div", { class: "bloccante" }, "Lettura non riuscita: " + err.message));
      return;
    }
    clear(risultati);

    if (archivio.length === 0) {
      risultati.appendChild(h("div", { class: "empty-state" }, "Nessun rilievo ancora inviato. Vai in un Cantiere e premi “Invia tutto su Google Drive”."));
      return;
    }

    for (const rilievo of archivio) {
      const c = rilievo.cantiere;
      const posizioniCantiere = rilievo.posizioni || [];
      risultati.appendChild(
        h("div", { class: "card" },
          h("div", { class: "row between" },
            h("div", { class: "list-item-title" }, c.nome || "(senza nome)"),
            h("span", { class: "stato-pill" }, c.stato)
          ),
          h("div", { class: "list-item-sub" }, c.indirizzo || "—"),
          h("div", { class: "list-item-sub" }, [c.cliente?.nome, c.cliente?.telefono].filter(Boolean).join(" — ")),
          h("div", { class: "list-item-sub" }, `${posizioniCantiere.length} Posizione/i ricevute — inviato il ${new Date(rilievo.esportatoIl).toLocaleString("it-IT")}`)
        )
      );
      for (const p of posizioniCantiere) {
        const m = p.misure || {};
        const fotoGrid = h("div", { class: "foto-grid" });
        const card = h("div", { class: "card", style: "margin-left:18px;" },
          h("div", { class: "list-item-title" }, p.codice || "(senza codice)"),
          h("div", { class: "list-item-sub" }, [p.piano, p.ambiente].filter(Boolean).join(" — ") || "—"),
          h("div", { class: "list-item-sub" }, `Larghezza: ${[m.larghezzaAlto, m.larghezzaCentro, m.larghezzaBasso].filter((v) => v !== "" && v != null).join("/")} mm — Altezza: ${[m.altezzaSx, m.altezzaCentro, m.altezzaDx].filter((v) => v !== "" && v != null).join("/")} mm`),
          p.foto && p.foto.length ? fotoGrid : h("div", { class: "list-item-sub" }, "Nessuna foto ricevuta"),
          p.note ? h("div", { class: "list-item-sub" }, "Note: " + p.note) : null
        );
        risultati.appendChild(card);
        for (const f of p.foto || []) {
          if (!f.driveFileId) continue;
          const thumb = h("div", { class: "foto-thumb" }, h("div", { class: "list-item-sub" }, "…"));
          fotoGrid.appendChild(thumb);
          scaricaFotoDaDrive(f.driveFileId).then((url) => {
            clear(thumb);
            thumb.appendChild(h("img", { src: url }));
          }).catch(() => { clear(thumb); thumb.appendChild(h("div", { class: "list-item-sub" }, "?")); });
        }
      }
    }
  }

  btn.addEventListener("click", carica);
  await carica();
}

// ---------- schermata: posizione ----------
async function screenPosizione(cantiereId, posizioneId) {
  const cantiere = await db.get("cantieri", cantiereId);
  const posizione = await db.get("posizioni", posizioneId);
  if (!cantiere || !posizione) {
    root.appendChild(topbar("Posizione non trovata", `#/cantiere/${cantiereId}`));
    return;
  }
  if (!posizione.prodotti || posizione.prodotti.length === 0) posizione.prodotti = [nuovoProdotto(cantiere)];

  root.appendChild(topbar(`Posizione ${posizione.codice || ""}`, `#/cantiere/${cantiereId}`));

  root.appendChild(
    h("div", { class: "banner" },
      "Convenzione di vista: " +
      (cantiere.defaults.convenzioneVista
        ? (cantiere.defaults.convenzioneVista === "interno" ? "dall'interno" : "dall'esterno")
        : "NON ANCORA SCELTA — impostala nel Cantiere prima di indicare le aperture")
    )
  );

  const checksBox = h("div", {});
  root.appendChild(checksBox);

  function renderChecksBox() {
    clear(checksBox);
    const controlli = calcolaControlli(posizione);
    if (controlli.length === 0) {
      checksBox.appendChild(h("div", { class: "ok-msg" }, "Nessun controllo in sospeso."));
      return;
    }
    for (const c of controlli) {
      checksBox.appendChild(h("div", { class: livelloClasse(c.livello) }, `${c.code} — ${c.messaggio}`));
    }
  }
  renderChecksBox();

  const form = h("div", { class: "stack" });
  root.appendChild(form);

  function field(label, path, opts = {}) {
    const value = getPath(posizione, path) ?? "";
    const attrs = { type: opts.type || "text", value, "data-path": path };
    return h("div", { class: opts.gridCell ? "" : "field" }, h("label", {}, label), h("input", attrs));
  }

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Posizione"),
      h("div", { class: "grid2" },
        field("Codice", "codice"),
        field("Piano", "piano")
      ),
      field("Ambiente", "ambiente"),
      field("Descrizione libera", "descrizione")
    )
  );

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Misure grezze (mm)"),
      h("div", { class: "field" },
        h("label", {}, "Tipo di misura rilevata"),
        h("select", { "data-path": "misure.tipoMisura" },
          h("option", { value: "", selected: !posizione.misure.tipoMisura || null }, "— seleziona —"),
          h("option", { value: "luce_muro", selected: posizione.misure.tipoMisura === "luce_muro" || null }, "Luce muro"),
          h("option", { value: "luce_architettonica", selected: posizione.misure.tipoMisura === "luce_architettonica" || null }, "Luce architettonica"),
          h("option", { value: "altro", selected: posizione.misure.tipoMisura === "altro" || null }, "Altro")
        )
      ),
      h("h3", {}, "Larghezza"),
      h("div", { class: "grid3" },
        field("Alto", "misure.larghezzaAlto", { type: "number" }),
        field("Centro", "misure.larghezzaCentro", { type: "number" }),
        field("Basso", "misure.larghezzaBasso", { type: "number" })
      ),
      h("h3", {}, "Altezza"),
      h("div", { class: "grid3" },
        field("SX", "misure.altezzaSx", { type: "number" }),
        field("Centro", "misure.altezzaCentro", { type: "number" }),
        field("DX", "misure.altezzaDx", { type: "number" })
      ),
      h("h3", {}, "Diagonali"),
      h("div", { class: "grid2" },
        field("Diagonale 1", "misure.diagonale1", { type: "number" }),
        field("Diagonale 2", "misure.diagonale2", { type: "number" })
      ),
      h("div", { class: "grid2" },
        field("Spessore muro", "misure.spessoreMuro", { type: "number" }),
        field("Altezza davanzale", "misure.altezzaDavanzale", { type: "number" })
      ),
      field("Sporgenza davanzale", "misure.sporgenzaDavanzale", { type: "number" })
    )
  );

  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Posa"),
      field("Tipo di posa", "tipoPosa")
    )
  );

  // Foto
  const fotoFieldset = h("fieldset", {},
    h("legend", {}, "Foto"),
  );
  const fotoGrid = h("div", { class: "foto-grid" });
  fotoFieldset.appendChild(fotoGrid);
  const fotoInput = h("input", {
    type: "file", accept: "image/*", capture: "environment", multiple: true, style: "display:none",
    onchange: async (e) => {
      for (const file of e.target.files) {
        posizione.foto.push({ id: uuid(), blob: file, didascalia: "" });
      }
      posizione.updatedAt = nowIso();
      await db.put("posizioni", posizione);
      renderFotoGrid();
      renderChecksBox();
      e.target.value = "";
    },
  });
  fotoFieldset.appendChild(fotoInput);
  fotoFieldset.appendChild(h("button", { onclick: () => fotoInput.click() }, "📷 Scatta / aggiungi foto"));
  form.appendChild(fotoFieldset);

  function renderFotoGrid() {
    clear(fotoGrid);
    for (const f of posizione.foto) {
      const url = URL.createObjectURL(f.blob);
      fotoGrid.appendChild(
        h("div", { class: "foto-thumb" },
          h("img", { src: url }),
          h("button", { class: "rm", onclick: async () => {
            posizione.foto = posizione.foto.filter((x) => x.id !== f.id);
            await db.put("posizioni", posizione);
            renderFotoGrid();
            renderChecksBox();
          } }, "✕")
        )
      );
    }
  }
  renderFotoGrid();

  // Note
  form.appendChild(
    h("fieldset", {},
      h("legend", {}, "Note"),
      h("textarea", { "data-path": "note" }, posizione.note || "")
    )
  );

  // Prodotti
  const prodottiBox = h("div", {});
  form.appendChild(h("h2", {}, "Prodotti"));
  form.appendChild(prodottiBox);
  form.appendChild(
    h("button", {
      onclick: async () => {
        posizione.prodotti.push(nuovoProdotto(cantiere));
        await db.put("posizioni", posizione);
        renderProdotti();
      },
    }, "+ Aggiungi prodotto (es. zanzariera, oscurante)")
  );

  function renderProdotti() {
    clear(prodottiBox);
    posizione.prodotti.forEach((prodotto, idx) => {
      prodottiBox.appendChild(prodottoFieldset(prodotto, idx));
    });
  }

  function prodottoFieldset(prodotto, idx) {
    const base = `prodotti.${idx}`;
    function pf(label, path, opts = {}) {
      const value = getPath(posizione, `${base}.${path}`) ?? "";
      return h("div", { class: "field" }, h("label", {}, label), h("input", { type: opts.type || "text", value, "data-path": `${base}.${path}` }));
    }

    const fs = h("fieldset", {},
      h("legend", {}, `Prodotto ${idx + 1}`),
      h("div", { class: "field" },
        h("label", {}, "Tipologia"),
        h("select", { "data-path": `${base}.tipologia` },
          ...["finestra", "portafinestra", "zanzariera", "oscurante", "altro"].map((t) =>
            h("option", { value: t, selected: prodotto.tipologia === t || null }, t)
          )
        )
      ),
      h("div", { class: "grid2" }, pf("Materiale", "materiale"), pf("Vetro", "vetro")),
      h("div", { class: "grid2" }, pf("Colore interno", "coloreInterno"), pf("Colore esterno", "coloreEsterno")),
      pf("Numero ante dichiarato", "numeroAnte", { type: "number" }),
      anteEditor(prodotto, idx),
      h("div", { class: "field" },
        h("label", {}, h("input", { type: "checkbox", style: "width:auto;min-height:auto;display:inline-block;margin-right:6px;", checked: prodotto.traverso.presente || null, onchange: async (e) => {
          prodotto.traverso.presente = e.target.checked;
          await db.put("posizioni", posizione);
        } }), "Traverso / sopraluce presente")
      ),
      pf("Altezza traverso/sopraluce", "traverso.altezza", { type: "number" }),
      pf("Accessori (maniglia, cerniere a vista, soglia…)", "accessori"),
      h("div", { class: "field" },
        h("label", {}, "Campi liberi (una riga per voce, es. \"tapparella: manuale\")"),
        h("textarea", { "data-path": `${base}.campiLiberi` }, prodotto.campiLiberi || "")
      ),
      h("div", { class: "field" },
        h("label", {}, "Note prodotto"),
        h("textarea", { "data-path": `${base}.note` }, prodotto.note || "")
      ),
      posizione.prodotti.length > 1
        ? h("button", { class: "danger", onclick: async () => {
            posizione.prodotti.splice(idx, 1);
            await db.put("posizioni", posizione);
            renderProdotti();
            renderChecksBox();
          } }, "Rimuovi prodotto")
        : null
    );
    return fs;
  }

  function anteEditor(prodotto, idx) {
    const wrap = h("div", {});
    const slots = h("div", { class: "anta-editor" });

    function renderSlots() {
      clear(slots);
      prodotto.ante.forEach((anta, i) => {
        const select = h("select", {
          onchange: async (e) => {
            prodotto.ante[i].tipo = e.target.value;
            await db.put("posizioni", posizione);
            renderSlots();
          },
        }, ...TIPI_ANTA.map((t) => h("option", { value: t.v, selected: anta.tipo === t.v || null }, t.label)));
        slots.appendChild(
          h("div", { class: "anta-slot" },
            h("div", { html: svgAnta(anta.tipo) }),
            select,
            h("button", { onclick: async () => {
              prodotto.ante.splice(i, 1);
              await db.put("posizioni", posizione);
              renderSlots();
              renderChecksBox();
            } }, "− anta")
          )
        );
      });
    }
    renderSlots();

    const presets = h("div", { class: "presets" },
      ...PRESET_ANTE.map((p) =>
        h("button", {
          onclick: async () => {
            prodotto.ante = p.ante.map((tipo) => ({ tipo }));
            prodotto.numeroAnte = prodotto.ante.length;
            await db.put("posizioni", posizione);
            renderSlots();
            renderProdotti();
            renderChecksBox();
          },
        }, p.label)
      )
    );

    wrap.appendChild(h("h3", {}, "Schema apertura"));
    wrap.appendChild(h("div", { class: "list-item-sub" }, "Configurazioni ricorrenti (un tap):"));
    wrap.appendChild(presets);
    wrap.appendChild(slots);
    wrap.appendChild(
      h("button", {
        onclick: async () => {
          prodotto.ante.push({ tipo: "fissa" });
          await db.put("posizioni", posizione);
          renderSlots();
        },
      }, "+ anta")
    );
    return wrap;
  }

  renderProdotti();

  // delega input/change per tutto il form
  form.addEventListener("input", (e) => {
    const path = e.target.dataset.path;
    if (!path || e.target.type === "checkbox") return;
    const value = e.target.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
    setPath(posizione, path, value);
    posizione.updatedAt = nowIso();
    debounceSave(async () => {
      await db.put("posizioni", posizione);
      if (path === "codice") document.querySelector(".topbar h1").textContent = `Posizione ${posizione.codice}`;
    });
  });

  form.addEventListener("change", async (e) => {
    const path = e.target.dataset.path;
    if (path) {
      const value = e.target.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
      setPath(posizione, path, value);
      posizione.updatedAt = nowIso();
      await db.put("posizioni", posizione);
    }
    renderChecksBox();
  });

  root.appendChild(
    h("div", { class: "footer-actions" },
      h("button", { class: "primary", onclick: async () => {
        const controlli = calcolaControlli(posizione);
        const c9 = controlli.find((c) => c.code === "C9");
        if (c9 && !confirm(c9.messaggio + "\n\nConfermi comunque il salvataggio?")) return;
        await db.put("posizioni", posizione);
        location.hash = `#/cantiere/${cantiereId}`;
      } }, "Salva e torna al cantiere")
    )
  );
}

// avvio
route();
