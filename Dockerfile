FROM node:20-alpine
WORKDIR /app
COPY numertel-mcp.mjs ./
# NumerTel MCP server (stdio, zero dependencies). Glama/clients run it over stdio.
ENTRYPOINT ["node", "numertel-mcp.mjs"]
