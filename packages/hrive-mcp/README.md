# @outborn/hrive-mcp

Model Context Protocol server for Hrive HRIS. It uses `@outborn/hrive-sdk` and Hrive's existing `/api/v1` Bearer-token authorization.

## Install

```bash
npm config set @outborn:registry https://registry.outborn.co
npm add -g @outborn/hrive-mcp
```

## Configure

```bash
export HRIVE_BASE_URL=https://people.outborn.co
export HRIVE_TOKEN='<Hrive JWT>'
hrive-mcp
```

The server is **read-only by default**. To expose mutating tools, explicitly opt in:

```bash
export HRIVE_MCP_ALLOW_WRITES=true
```

Enabling the tools does not bypass Hrive permissions. Every request is still authorized by the Hrive API using the configured Bearer token.

## MCP client configuration

```json
{
  "mcpServers": {
    "hrive": {
      "command": "hrive-mcp",
      "env": {
        "HRIVE_BASE_URL": "https://people.outborn.co",
        "HRIVE_TOKEN": "${HRIVE_TOKEN}"
      }
    }
  }
}
```

## Tools

The package exposes focused tools for health, applicants, positions, users, recruitment stages, and notifications, plus a generic `hrive_api_get` tool for other Hrive V1 resources. `hrive_api_mutate` and create tools are guarded by `HRIVE_MCP_ALLOW_WRITES`.

Do not embed a long-lived user password in MCP configuration. Supply an Hrive token through your secret manager or runtime environment and rotate it according to your organization policy.
