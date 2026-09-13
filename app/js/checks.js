// Controlli di coerenza — docs/02-regole-mestiere.md.
// Importante: C1, C2, C3 hanno soglia "[DA DECIDERE]" nel documento di dominio.
// Non la inventiamo: mostriamo lo scarto misurato e lo segnaliamo come "da
// valutare", senza decidere noi cosa è accettabile.

function num(v) {
  return v === "" || v === null || v === undefined ? null : Number(v);
}

function scarto(a, b, c) {
  const vals = [a, b, c].filter((v) => v !== null && !Number.isNaN(v));
  if (vals.length < 2) return null;
  return Math.max(...vals) - Math.min(...vals);
}

export function calcolaControlli(posizione) {
  const m = posizione.misure || {};
  const out = [];

  const la = num(m.larghezzaAlto), lc = num(m.larghezzaCentro), lb = num(m.larghezzaBasso);
  const sL = scarto(la, lc, lb);
  if (sL !== null) {
    out.push({ code: "C1", livello: "avviso", messaggio: `Scarto fra le tre larghezze: ${sL} mm (soglia non ancora definita dal committente).` });
  }

  const asx = num(m.altezzaSx), ac = num(m.altezzaCentro), adx = num(m.altezzaDx);
  const sA = scarto(asx, ac, adx);
  if (sA !== null) {
    out.push({ code: "C2", livello: "avviso", messaggio: `Scarto fra le tre altezze: ${sA} mm (soglia non ancora definita dal committente).` });
  }

  const d1 = num(m.diagonale1), d2 = num(m.diagonale2);
  if (d1 !== null && d2 !== null) {
    const diff = Math.abs(d1 - d2);
    if (diff > 0) {
      out.push({ code: "C3", livello: "avviso", messaggio: `Differenza fra le diagonali (fuori squadro): ${diff} mm (soglia non ancora definita dal committente).` });
    }
  } else {
    out.push({ code: "C4", livello: "avviso", messaggio: "Diagonali mancanti." });
  }

  if (num(m.spessoreMuro) === null) {
    out.push({ code: "C5", livello: "avviso", messaggio: "Spessore muro mancante." });
  }

  if (!posizione.foto || posizione.foto.length === 0) {
    out.push({ code: "C6", livello: "avviso-forte", messaggio: "Nessuna foto sulla Posizione." });
  }

  if (!m.tipoMisura) {
    out.push({ code: "C7", livello: "bloccante", messaggio: "Tipo di misura non indicato (luce muro / architettonica). Blocca lo stato \"rilevato\"." });
  }

  const prodotti = posizione.prodotti || [];
  for (const p of prodotti) {
    const nAnte = (p.ante || []).length;
    if (p.numeroAnte !== null && p.numeroAnte !== undefined && p.numeroAnte !== "" && Number(p.numeroAnte) !== nAnte) {
      out.push({ code: "C8", livello: "bloccante", messaggio: `Numero ante incoerente con lo schema composto (dichiarate ${p.numeroAnte}, composte ${nAnte}) su prodotto "${p.tipologia || "senza nome"}".` });
    }
  }

  const fuoriIntervallo = [];
  ["larghezzaAlto", "larghezzaCentro", "larghezzaBasso", "altezzaSx", "altezzaCentro", "altezzaDx", "diagonale1", "diagonale2"].forEach((k) => {
    const v = num(m[k]);
    if (v !== null && (v < 200 || v > 4000)) fuoriIntervallo.push(`${k}: ${v} mm`);
  });
  if (fuoriIntervallo.length) {
    out.push({ code: "C9", livello: "conferma", messaggio: `Misura fuori intervallo plausibile (<200 o >4000 mm): ${fuoriIntervallo.join(", ")}.` });
  }

  return out;
}

// C10 è un controllo sul Cantiere (confronto fra Posizioni), non sulla singola Posizione.
export function trovaDuplicatiSospetti(posizioni) {
  const key = (p) => {
    const m = p.misure || {};
    return ["larghezzaAlto", "larghezzaCentro", "larghezzaBasso", "altezzaSx", "altezzaCentro", "altezzaDx"]
      .map((k) => m[k] ?? "")
      .join("|");
  };
  const groups = new Map();
  for (const p of posizioni) {
    const k = key(p);
    if (!k.replace(/\|/g, "")) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  const out = [];
  for (const [, group] of groups) {
    if (group.length > 1) {
      out.push({ code: "C10", livello: "segnalazione", posizioni: group.map((p) => p.codice) });
    }
  }
  return out;
}

export function isCompleta(posizione) {
  const controlli = calcolaControlli(posizione);
  return !controlli.some((c) => c.livello === "bloccante");
}

export function livelloClasse(livello) {
  if (livello === "bloccante") return "bloccante";
  if (livello === "avviso-forte") return "bloccante";
  if (livello === "conferma") return "avviso";
  return "avviso";
}
