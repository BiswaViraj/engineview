-- Saved queries. v2 will add dashboards and panels that reference these.
CREATE TABLE IF NOT EXISTS queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sql TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
