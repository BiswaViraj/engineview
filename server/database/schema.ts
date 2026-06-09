import { pgTable, text, boolean, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";

// --- better-auth core tables ---------------------------------------------
// Field (property) names must match better-auth's model fields so the Drizzle
// adapter can map them.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- EngineView app tables ------------------------------------------------

// A user's connection to one Cloudflare account. The API token is stored
// encrypted at rest and only ever decrypted server-side to run a query.
export const cloudflareConnection = pgTable("cloudflare_connection", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  accountId: text("account_id").notNull(),
  apiTokenEncrypted: text("api_token_encrypted").notNull(),
  defaultDataset: text("default_dataset"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const savedQuery = pgTable("saved_query", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  connectionId: uuid("connection_id").references(() => cloudflareConnection.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  sql: text("sql").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dashboard = pgTable("dashboard", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  timeRange: text("time_range").notNull().default("24 HOUR"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const panel = pgTable("panel", {
  id: uuid("id").primaryKey().defaultRandom(),
  dashboardId: uuid("dashboard_id")
    .notNull()
    .references(() => dashboard.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  queryId: uuid("query_id").references(() => savedQuery.id, { onDelete: "set null" }),
  connectionId: uuid("connection_id").references(() => cloudflareConnection.id, {
    onDelete: "set null",
  }),
  sql: text("sql").notNull(),
  chartType: text("chart_type").notNull().default("line"),
  xColumn: text("x_column"),
  yColumns: jsonb("y_columns").notNull().default([]),
  posX: integer("pos_x").notNull().default(0),
  posY: integer("pos_y").notNull().default(0),
  posW: integer("pos_w").notNull().default(6),
  posH: integer("pos_h").notNull().default(8),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
