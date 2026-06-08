# EngineView

A multi-user dashboard for [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/).
Cloudflare gives you a powerful time-series store but no UI and no way to save
queries. EngineView lets people sign up, connect their own Cloudflare account,
run SQL against their datasets, save the queries they care about, and (soon)
chart them on dashboards.

Each user brings their own Cloudflare account. API tokens are encrypted at rest
and only ever decrypted on the server to run a query, so a token is never sent
to the browser or shared between users.

## Status

Early. Multi-user auth and per-user Cloudflare connections are in place. The
query runner, charts, and multi-panel dashboards are being built next.

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3) for the app and server API
- [better-auth](https://better-auth.com) for email and password accounts
- [Postgres](https://www.postgresql.org) via [Drizzle ORM](https://orm.drizzle.team)

## How it works

- Users sign up and log in (better-auth, signed session cookies).
- Each user adds one or more Cloudflare connections (account id + API token).
  The token is encrypted with AES-256-GCM before it is stored.
- A query is sent to the server, which decrypts the relevant token, calls the
  Analytics Engine SQL API, and returns the rows. The token never leaves the
  server.
- Saved queries and dashboards are stored in Postgres, scoped to each user.

## Setup

Prerequisites: Node 20+, a Postgres database, and a Cloudflare account using
Analytics Engine.

```bash
npm install

# 1. Configure the environment
cp .env.example .env
#    Set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL and ENCRYPTION_KEY.
#    Generate secrets with: openssl rand -hex 32

# 2. Apply the database schema
npm run db:migrate

# 3. Run locally
npm run dev
```

A local Postgres is easy to start with Docker:

```bash
docker run -d --name engineview-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=engineview -p 5432:5432 postgres:16
```

On macOS, if `npm run dev` fails with a `vite-node` socket error (`EINVAL`),
your `$TMPDIR` path is too long for a unix socket. Run it with a short temp dir:
`TMPDIR=/tmp npm run dev`.

## License

MIT. See [LICENSE](./LICENSE).
