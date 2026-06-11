# NumerTel MCP Server

Check Polish phone numbers from any AI assistant (Claude, Cursor, or any MCP
client): who called, is it spam or a scam, is this really a bank's number.

Backed by [NumerTel.pl](https://numertel.pl) — a database of 130M Polish
numbers built on official UKE numbering ranges, user reports, the state DNO
registry and CERT Polska's public Warning List.

Listed in the official MCP registry as
[`pl.numertel/numertel`](https://registry.modelcontextprotocol.io/v0/servers?search=numertel).

## Tools

| Tool | What it does |
| --- | --- |
| `check_phone_number` | Looks up a Polish number: operator (UKE range), risk label from user reports, UKE **DNO registry** status (an *incoming* call from a DNO number is spoofed by definition), verified official-hotline whitelist, report counts. |
| `pogoda_spamowa` | Current phone-abuse indicators for Poland: new scam domains on CERT Polska's Warning List (today / 7 days / 30 days) and the DNO registry size. Open data, CC-BY. |

Only public data is returned — never opinion contents, never personal data.

## Option 1 (recommended): remote server, zero install

Add the URL as an MCP server in your client:

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

Transport: streamable HTTP (JSON-RPC 2.0). Limit: 30 requests/day/IP.

## Option 2: local stdio server (single file, zero dependencies)

For clients that only support stdio. Download
[`numertel-mcp.mjs`](https://numertel.pl/numertel-mcp.mjs) (also in this repo)
and point your client at it:

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

## Try asking your assistant

- "Who called me from 500 100 200?"
- "Is +48 22 598 40 44 really my bank, or a scam?"
- "How bad is phone phishing in Poland today?"

## REST API

The same data is available over plain REST — see the
[developer docs](https://numertel.pl/dla-deweloperow) (Polish).
`GET https://numertel.pl/api/v1/check/{number}` (20 req/day/IP without a key)
and `GET https://numertel.pl/api/v1/spam-weather` (no limit, CC-BY).

Higher limits / API keys: kontakt@numertel.pl

## Attribution

When presenting results publicly, attribution "dane: numertel.pl" with a link
is required. Aggregate datasets are CC-BY 4.0.

## License

MIT (this client and manifest). The NumerTel.pl service itself is a separate,
proprietary product.
