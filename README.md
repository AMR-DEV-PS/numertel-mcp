![NumerTel MCP Server](assets/banner.png)

# NumerTel MCP Server

Check **Polish phone numbers** from any AI assistant: who called, is it spam or
a scam, is this really a bank's number — plus live phone-abuse stats for Poland.

Backed by [NumerTel.pl](https://numertel.pl): 130M numbers built on official
UKE numbering ranges, user reports, the state **DNO registry** and CERT
Polska's public Warning List.

[![License: MIT](https://img.shields.io/badge/license-MIT-0CCC68)](LICENSE)
[![Website](https://img.shields.io/badge/website-numertel.pl-0F172A)](https://numertel.pl/dla-deweloperow)
[![MCP Registry](https://img.shields.io/badge/MCP_registry-pl.numertel%2Fnumertel-blue)](https://registry.modelcontextprotocol.io/v0/servers?search=numertel)

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=numertel&config=eyJ1cmwiOiJodHRwczovL251bWVydGVsLnBsL2FwaS9tY3AifQ==)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=numertel&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fnumertel.pl%2Fapi%2Fmcp%22%7D)

## Remote server (recommended)

One endpoint, zero install:

```
https://numertel.pl/api/mcp
```

Generic config that works in most MCP clients:

```json
{
  "mcpServers": {
    "numertel": {
      "type": "http",
      "url": "https://numertel.pl/api/mcp"
    }
  }
}
```

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add --transport http numertel https://numertel.pl/api/mcp
```
</details>

<details>
<summary><b>Cursor</b></summary>

Use the install button above, or add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "numertel": { "url": "https://numertel.pl/api/mcp" }
  }
}
```
</details>

<details>
<summary><b>VS Code</b></summary>

Use the install button above, or add to `mcp.json`:

```json
{
  "servers": {
    "numertel": { "type": "http", "url": "https://numertel.pl/api/mcp" }
  }
}
```
</details>

<details>
<summary><b>Claude Desktop (or any client without native streamable HTTP)</b></summary>

```json
{
  "mcpServers": {
    "numertel": {
      "command": "npx",
      "args": ["mcp-remote", "https://numertel.pl/api/mcp"]
    }
  }
}
```
</details>

Transport: streamable HTTP (JSON-RPC 2.0). Limit: 30 requests/day/IP.

## Try asking your assistant

- "Who called me from 500 100 200?"
- "Is +48 22 598 40 44 really my bank, or a scam?"
- "How bad is phone phishing in Poland today?"

## Tools

- **check_phone_number** — looks up a Polish number. Returns operator (original
  UKE range, with an MNP note), risk label from user reports, UKE **DNO
  registry** status (an *incoming* call from a DNO number is spoofed by
  definition), verified official-hotline whitelist entry and report counts.
  Inputs: `number` (string, 9 digits; `+48` and spaces are stripped).
  Read-only.
- **pogoda_spamowa** — current phone-abuse indicators for Poland: new scam
  domains on CERT Polska's Warning List (today / 7 / 30 days) and the DNO
  registry size. No inputs. Read-only, open data (CC-BY).

Example response (shortened):

```json
{
  "number": "225984044",
  "operator": "Strefa Warszawa",
  "spam_label": "dno_spoofing",
  "is_dno": true,
  "dno_note": "Numer służy wyłącznie do odbierania połączeń (wykaz DNO UKE)...",
  "url": "https://numertel.pl/numer/225984044"
}
```

## Local stdio server (single file, zero dependencies)

For clients that only support stdio. Requires Node 18+. Download
[`numertel-mcp.mjs`](https://numertel.pl/numertel-mcp.mjs) (also in this repo):

```json
{
  "mcpServers": {
    "numertel": {
      "command": "node",
      "args": ["/path/to/numertel-mcp.mjs"],
      "env": { "NUMERTEL_API_KEY": "(optional, for higher limits)" }
    }
  }
}
```

## REST API

The same data over plain REST — see the
[developer docs](https://numertel.pl/dla-deweloperow) (Polish):
`GET https://numertel.pl/api/v1/check/{number}` (20 req/day/IP without a key)
and `GET https://numertel.pl/api/v1/spam-weather` (no limit, CC-BY).
Higher limits / API keys: kontakt@numertel.pl

## Troubleshooting

- **Client doesn't support remote MCP servers** — use the `mcp-remote` bridge
  (see Claude Desktop above) or the local stdio file.
- **HTTP 429** — the free daily limit was reached; try tomorrow or ask for a key.
- **"Numer spoza znanych zakresów" (404)** — the number is outside Polish
  numbering ranges; pass 9 digits in national format.

## Privacy

The server is read-only and returns only data already public on
numertel.pl number pages — never opinion contents, never personal data.
Queries are not logged beyond anonymous daily rate-limit counters.
Attribution "dane: numertel.pl" with a link is required when presenting
results publicly; aggregate datasets are CC-BY 4.0.

## License

MIT (this client and manifest). The NumerTel.pl service itself is a separate,
proprietary product.
