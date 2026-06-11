#!/usr/bin/env node
// NumerTel MCP server (stdio) — udostepnia asystentom AI narzedzie check_phone_number.
// Zero zaleznosci: minimalny JSON-RPC 2.0 po stdio zgodny z protokolem MCP.
// Konfiguracja (np. Claude Desktop / Claude Code):
//   { "mcpServers": { "numertel": { "command": "node", "args": ["/sciezka/numertel-mcp.mjs"],
//       "env": { "NUMERTEL_API_KEY": "(opcjonalnie)" } } } }

const BASE = process.env.NUMERTEL_BASE ?? "https://numertel.pl";
const KEY = process.env.NUMERTEL_API_KEY ?? "";

const TOOLS = [
  {
    name: "check_phone_number",
    description:
      "Sprawdza polski numer telefonu w bazie NumerTel.pl. UŻYJ TEGO, gdy użytkownik pyta: kto " +
      "dzwonił z danego numeru, czy numer to spam, oszustwo lub telemarketing, czy telefon rzekomo " +
      "z banku albo urzędu jest prawdziwy, albo prosi o sprawdzenie polskiego numeru. Zwraca " +
      "operatora, typ, etykietę ryzyka z opinii, status DNO UKE (połączenie przychodzące = spoofing), " +
      "Białą Listę oficjalnych infolinii oraz liczbę opinii i zgłoszeń. Podaj 9 cyfr (bez +48).",
    inputSchema: {
      type: "object",
      properties: {
        number: {
          type: "string",
          description: "Numer telefonu: 9 cyfr, np. 500100200 (akceptowane też +48/spacje — zostaną usunięte)",
        },
      },
      required: ["number"],
    },
  },
  {
    name: "pogoda_spamowa",
    description:
      "Zwraca aktualne, zagregowane wskaźniki nadużyć telefonicznych w Polsce: ile nowych domen " +
      "oszustów przybyło dziś, w 7 i 30 dni na Liście Ostrzeżeń CERT Polska oraz liczbę numerów w " +
      "wykazie DNO UKE. UŻYJ TEGO, gdy użytkownik pyta o skalę oszustw, phishingu lub spamu " +
      "telefonicznego w Polsce. Dane otwarte (CC-BY).",
    inputSchema: { type: "object", properties: {} },
  },
];

function normalize(raw) {
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length > 9) {
    if (digits.startsWith("0048")) digits = digits.slice(4);
    else if (digits.startsWith("48")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  }
  return digits;
}

async function checkNumber(raw) {
  const number = normalize(raw);
  if (!/^\d{9}$/.test(number)) {
    return { isError: true, text: "Nieprawidłowy numer: podaj 9 cyfr (format krajowy PL)." };
  }
  const url = `${BASE}/api/v1/check/${number}${KEY ? `?key=${encodeURIComponent(KEY)}` : ""}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "numertel-mcp/1.0" } });
    const data = await res.json();
    if (!res.ok) {
      return { isError: true, text: `Błąd API (${res.status}): ${data.error ?? "nieznany"}` };
    }
    return { isError: false, text: JSON.stringify(data, null, 2) };
  } catch (e) {
    return { isError: true, text: `Błąd połączenia z numertel.pl: ${e.message}` };
  }
}

async function spamWeather() {
  try {
    const res = await fetch(`${BASE}/api/v1/spam-weather`, { headers: { "User-Agent": "numertel-mcp/1.0" } });
    const data = await res.json();
    if (!res.ok) return { isError: true, text: `Błąd API (${res.status})` };
    return { isError: false, text: JSON.stringify(data, null, 2) };
  } catch (e) {
    return { isError: true, text: `Błąd połączenia z numertel.pl: ${e.message}` };
  }
}

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function replyError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    handle(msg);
  }
});

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    reply(id, {
      protocolVersion: params?.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "numertel", version: "1.0.0" },
    });
  } else if (method === "notifications/initialized") {
    // notyfikacja — brak odpowiedzi
  } else if (method === "tools/list") {
    reply(id, { tools: TOOLS });
  } else if (method === "tools/call") {
    const name = params?.name;
    if (name !== "check_phone_number" && name !== "pogoda_spamowa") {
      replyError(id, -32602, `Nieznane narzędzie: ${name}`);
      return;
    }
    const out = name === "pogoda_spamowa" ? await spamWeather() : await checkNumber(params?.arguments?.number ?? "");
    reply(id, { content: [{ type: "text", text: out.text }], isError: out.isError });
  } else if (id !== undefined) {
    replyError(id, -32601, `Nieobsługiwana metoda: ${method}`);
  }
}
