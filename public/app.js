// Minimal client for EngineView. Plain JS, no build step, deliberately small so it
// is easy to replace with a real framework. The password is kept in sessionStorage
// and sent as a bearer token on each API call.

const app = document.getElementById("app");
const token = () => sessionStorage.getItem("ev_pw") || "";

const api = (path, opts = {}) =>
  fetch(path, {
    ...opts,
    headers: { "content-type": "application/json", authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function renderLogin(message = "") {
  app.innerHTML = "";
  const form = el(`
    <form class="row">
      <input type="password" id="pw" placeholder="Dashboard password" />
      <button type="submit">Sign in</button>
      <span class="muted">${message}</span>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = form.querySelector("#pw").value;
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem("ev_pw", password);
      renderDashboard();
    } else {
      renderLogin("Wrong password.");
    }
  });
  app.appendChild(form);
}

function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return el(`<p class="muted">No rows.</p>`);
  const cols = Object.keys(rows[0]);
  const head = cols.map((c) => `<th>${c}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`)
    .join("");
  return el(`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
}

async function renderDashboard() {
  app.innerHTML = "";
  const ui = el(`
    <div style="display:grid; gap:16px;">
      <textarea id="sql" placeholder="SELECT blob2 AS referrer, SUM(_sample_interval) AS views FROM your_dataset WHERE timestamp > now() - INTERVAL '7' DAY GROUP BY referrer ORDER BY views DESC"></textarea>
      <div class="row">
        <button id="run">Run</button>
        <input id="name" placeholder="Save as..." />
        <button id="save" class="ghost">Save query</button>
      </div>
      <div id="result"></div>
      <div class="saved"><h3>Saved queries</h3><div id="list" class="muted">Loading...</div></div>
    </div>
  `);
  app.appendChild(ui);

  const sql = ui.querySelector("#sql");
  const result = ui.querySelector("#result");

  ui.querySelector("#run").addEventListener("click", async () => {
    result.innerHTML = "Running...";
    const res = await api("/api/query", { method: "POST", body: JSON.stringify({ sql: sql.value }) });
    if (res.status === 401) return renderLogin("Session expired.");
    const data = await res.json();
    result.innerHTML = "";
    result.appendChild(res.ok && data?.data ? renderTable(data.data) : el(`<pre class="muted">${JSON.stringify(data, null, 2)}</pre>`));
  });

  ui.querySelector("#save").addEventListener("click", async () => {
    const name = ui.querySelector("#name").value.trim();
    if (!name) return;
    await api("/api/queries", { method: "POST", body: JSON.stringify({ name, sql: sql.value }) });
    ui.querySelector("#name").value = "";
    loadSaved();
  });

  async function loadSaved() {
    const list = ui.querySelector("#list");
    const res = await api("/api/queries");
    if (res.status === 401) return renderLogin("Session expired.");
    const rows = await res.json();
    list.innerHTML = "";
    if (!rows.length) return (list.textContent = "None yet.");
    rows.forEach((row) => {
      const item = el(`<div class="row"><a>${row.name}</a> <button class="ghost" data-id="${row.id}">delete</button></div>`);
      item.querySelector("a").addEventListener("click", () => (sql.value = row.sql));
      item.querySelector("button").addEventListener("click", async () => {
        await api(`/api/queries/${row.id}`, { method: "DELETE" });
        loadSaved();
      });
      list.appendChild(item);
    });
  }
  loadSaved();
}

if (token()) renderDashboard();
else renderLogin();
