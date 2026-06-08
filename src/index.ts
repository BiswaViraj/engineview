// EngineView Worker.
//
// Holds the Cloudflare API token as a secret, forwards SQL to the Analytics
// Engine SQL API, and stores saved queries in D1. The dashboard is gated by a
// single shared password. The token is never sent to the browser.

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  CF_ACCOUNT_ID: string;
  AE_DATASET: string;
  CF_API_TOKEN: string;
  DASHBOARD_PASSWORD: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

// The SPA sends the password as a bearer token. Over HTTPS this is fine for a
// single-owner dashboard; harden to signed cookies/sessions if you expose it more.
function authed(req: Request, env: Env): boolean {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  return Boolean(env.DASHBOARD_PASSWORD) && token === env.DASHBOARD_PASSWORD;
}

async function runQuery(sql: string, env: Env): Promise<Response> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${env.CF_API_TOKEN}` },
      body: sql,
    },
  );
  const body = await res.json().catch(() => null);
  return json(body, res.ok ? 200 : res.status);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Login: the client posts the password and stores it on success.
    if (url.pathname === "/api/login" && req.method === "POST") {
      const { password } = await req.json<{ password?: string }>().catch(() => ({}));
      return password && password === env.DASHBOARD_PASSWORD
        ? json({ ok: true })
        : json({ ok: false }, 401);
    }

    if (url.pathname.startsWith("/api/")) {
      if (!authed(req, env)) return json({ error: "unauthorized" }, 401);

      if (url.pathname === "/api/query" && req.method === "POST") {
        const { sql } = await req.json<{ sql?: string }>().catch(() => ({}));
        if (!sql) return json({ error: "missing sql" }, 400);
        return runQuery(sql, env);
      }

      if (url.pathname === "/api/queries") {
        if (req.method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT id, name, sql, created_at FROM queries ORDER BY created_at DESC",
          ).all();
          return json(results);
        }
        if (req.method === "POST") {
          const { name, sql } = await req.json<{ name?: string; sql?: string }>().catch(() => ({}));
          if (!name || !sql) return json({ error: "name and sql are required" }, 400);
          const row = await env.DB.prepare(
            "INSERT INTO queries (name, sql) VALUES (?, ?) RETURNING id, name, sql, created_at",
          )
            .bind(name, sql)
            .first();
          return json(row, 201);
        }
      }

      const deleteMatch = url.pathname.match(/^\/api\/queries\/(\d+)$/);
      if (deleteMatch && req.method === "DELETE") {
        await env.DB.prepare("DELETE FROM queries WHERE id = ?").bind(Number(deleteMatch[1])).run();
        return json({ ok: true });
      }

      return json({ error: "not found" }, 404);
    }

    // Everything else is the static UI.
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
