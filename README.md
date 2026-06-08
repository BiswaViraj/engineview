# EngineView

A self-hosted dashboard for [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/).
Cloudflare gives you a powerful time-series store but no UI and no way to save
queries. EngineView is a small app you deploy on your own Cloudflare account to
run SQL against your datasets, save the queries you care about, and (soon) chart
them.

It is self-hosted by design: your Cloudflare API token stays a server-side secret
on your own Worker and is never exposed to the browser or sent to anyone else.

## Status

Early. v1 is a query runner with saved queries and a results table. Charts and
multi-panel dashboards are planned.

## How it works

- A Cloudflare Worker serves the UI and a tiny API.
- `POST /api/query` forwards your SQL to the Analytics Engine SQL API using the
  Worker's secret token and returns the rows. The token never leaves the Worker.
- Saved queries live in a D1 database.
- The dashboard is gated by a single password (it is your own private data).

## Setup

Prerequisites: a Cloudflare account using Analytics Engine, Node 20+, and the
Wrangler CLI.

```bash
npm install

# 1. Create the D1 database and apply the schema
npx wrangler d1 create engineview         # copy the database_id into wrangler.jsonc
npm run db:migrate

# 2. Set your account id and dataset in wrangler.jsonc (vars), then set secrets
npx wrangler secret put CF_API_TOKEN      # token scoped to "Account Analytics: Read"
npx wrangler secret put DASHBOARD_PASSWORD

# 3. Run locally (copy .dev.vars.example to .dev.vars and fill it in first)
npm run dev

# 4. Deploy to your account
npm run deploy
```

## License

MIT. See [LICENSE](./LICENSE).
