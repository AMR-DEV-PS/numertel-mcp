#!/usr/bin/env node
// NumerTel MCP server (stdio proxy) — daje asystentom AI narzedzia i prompty
// serwisu NumerTel.pl. Zero zaleznosci. Od v1.1 plik jest cienkim proxy do
// zdalnego serwera (https://numertel.pl/api/mcp), wiec lokalna kopia nigdy sie
// nie starzeje: nowe narzedzia i prompty pojawiaja sie automatycznie.
//
// Konfiguracja (np. Claude Desktop / klienty stdio-only):
//   { "mcpServers": { "numertel": { "command": "node", "args": ["/sciezka/numertel-mcp.mjs"],
//       "env": { "NUMERTEL_API_KEY": "(opcjonalnie, wyzszy limit)" } } } }
// Wymaga Node 18+.

const BASE = process.env.NUMERTEL_BASE ?? "https://numertel.pl";
const KEY = process.env.NUMERTEL_API_KEY ?? "";

const FORWARD = new Set(["tools/list", "tools/call", "prompts/list", "prompts/get", "ping"]);

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function replyError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

async function forward(msg) {
  const headers = { "Content-Type": "application/json", "User-Agent": "numertel-mcp-stdio/1.2" };
  if (KEY) headers["Authorization"] = `Bearer ${KEY}`;
  const res = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify(msg),
  });
  const data = await res.json();
  process.stdout.write(JSON.stringify(data) + "\n");
}

async function handle(msg) {
  const { id, method, params } = msg;
  try {
    if (method === "initialize") {
      reply(id, {
        protocolVersion: params?.protocolVersion ?? "2025-11-25",
        capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
        serverInfo: { name: "numertel", version: "1.2.0" },
        instructions:
          "NumerTel.pl: sprawdzanie polskich numerów telefonów (spam, oszustwa, wykaz DNO UKE, Biała Lista infolinii) i wskaźniki nadużyć w Polsce.",
      });
    } else if (method === "notifications/initialized" || method === "notifications/cancelled") {
      // notyfikacje — bez odpowiedzi
    } else if (FORWARD.has(method)) {
      await forward(msg);
    } else if (id !== undefined) {
      replyError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    if (id !== undefined) replyError(id, -32603, `Błąd połączenia z numertel.pl: ${e.message}`);
  }
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
