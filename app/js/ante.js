// Composizione dello schema di apertura. Lo schema si compone, non si disegna
// a mano (docs/00-visione.md, docs/03-app-campo.md).
// Elenco tipi come da docs/01-dominio.md — non aggiungere voci senza
// aggiornare prima il dominio.

export const TIPI_ANTA = [
  { v: "fissa", label: "Fissa" },
  { v: "battente_dx", label: "Battente DX" },
  { v: "battente_sx", label: "Battente SX" },
  { v: "antaribalta_dx", label: "Anta-ribalta DX" },
  { v: "antaribalta_sx", label: "Anta-ribalta SX" },
  { v: "vasistas", label: "Vasistas" },
  { v: "scorrevole_dx", label: "Scorrevole DX" },
  { v: "scorrevole_sx", label: "Scorrevole SX" },
];

export const TIPO_ANTA_LABEL = Object.fromEntries(TIPI_ANTA.map((t) => [t.v, t.label]));

// Configurazioni ricorrenti: un tap per le composizioni più frequenti
// (docs/03-app-campo.md). Libreria minima di partenza, da far crescere con l'uso.
export const PRESET_ANTE = [
  { label: "Monoanta DX", ante: ["battente_dx"] },
  { label: "Monoanta SX", ante: ["battente_sx"] },
  { label: "Fissa (1 anta)", ante: ["fissa"] },
  { label: "2 ante (DX+SX)", ante: ["battente_dx", "battente_sx"] },
  { label: "2 ante, ribalta SX", ante: ["battente_dx", "antaribalta_sx"] },
  { label: "Portafinestra 2 ante", ante: ["battente_dx", "battente_sx"] },
  { label: "Vasistas (1 anta)", ante: ["vasistas"] },
];

export function svgAnta(tipo) {
  const arrow = (d) => `<path d="${d}" stroke="#111" stroke-width="3" fill="none" marker-end="url(#arrow)"/>`;
  let inner = `<rect x="6" y="6" width="88" height="78" fill="none" stroke="#111" stroke-width="3"/>`;
  switch (tipo) {
    case "fissa":
      inner += `<line x1="6" y1="6" x2="94" y2="84" stroke="#999" stroke-width="2"/><line x1="94" y1="6" x2="6" y2="84" stroke="#999" stroke-width="2"/>`;
      break;
    case "battente_dx":
      inner += arrow("M 12 12 L 88 45 L 12 78");
      break;
    case "battente_sx":
      inner += arrow("M 88 12 L 12 45 L 88 78");
      break;
    case "antaribalta_dx":
      inner += arrow("M 12 12 L 88 45 L 12 78") + arrow("M 20 80 L 50 60 L 80 80");
      break;
    case "antaribalta_sx":
      inner += arrow("M 88 12 L 12 45 L 88 78") + arrow("M 20 80 L 50 60 L 80 80");
      break;
    case "vasistas":
      inner += arrow("M 20 80 L 50 55 L 80 80");
      break;
    case "scorrevole_dx":
      inner += `<line x1="45" y1="6" x2="45" y2="84" stroke="#999" stroke-width="2" stroke-dasharray="4 3"/>` + arrow("M 20 45 L 75 45");
      break;
    case "scorrevole_sx":
      inner += `<line x1="55" y1="6" x2="55" y2="84" stroke="#999" stroke-width="2" stroke-dasharray="4 3"/>` + arrow("M 80 45 L 25 45");
      break;
    default:
      break;
  }
  return `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#111"/></marker></defs>
    ${inner}
  </svg>`;
}
