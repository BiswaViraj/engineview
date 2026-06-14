import { z } from "zod";

// Request body schemas, shared by the API route handlers. Strings are trimmed
// so blank-but-present values are rejected.

export const connectionCreateSchema = z.object({
  label: z.string().trim().min(1, "label is required"),
  accountId: z.string().trim().min(1, "accountId is required"),
  apiToken: z.string().trim().min(1, "apiToken is required"),
  defaultDataset: z.string().trim().optional(),
});

export const connectionUpdateSchema = z.object({
  label: z.string().trim().min(1).optional(),
  accountId: z.string().trim().min(1).optional(),
  apiToken: z.string().trim().min(1).optional(),
  defaultDataset: z.string().trim().optional(),
});

export const appCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  connectionId: z.uuid("a valid connectionId is required"),
  dataset: z.string().trim().optional(),
  url: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
});

export const appUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  connectionId: z.uuid().optional(),
  dataset: z.string().trim().nullable().optional(),
  url: z.string().trim().nullable().optional(),
  logoUrl: z.string().trim().nullable().optional(),
});

export const savedQueryCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  sql: z.string().trim().min(1, "sql is required"),
  appId: z.uuid("a valid appId is required"),
  connectionId: z.uuid().nullish(),
});

export const savedQueryUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sql: z.string().trim().min(1).optional(),
});

export const queryRunSchema = z.object({
  connectionId: z.uuid("a valid connectionId is required"),
  sql: z.string().trim().min(1, "sql is required"),
  timeRange: z.string().trim().optional(),
});

export const dashboardCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  appId: z.uuid("a valid appId is required"),
});

export const dashboardUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  timeRange: z.string().trim().optional(),
});

export const chartTypeSchema = z.enum(["line", "area", "bar", "stat", "table"]);

export const panelCreateSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  queryId: z.uuid("a valid queryId is required"),
  chartType: chartTypeSchema.optional(),
  xColumn: z.string().optional(),
  yColumns: z.array(z.string()).optional(),
  posW: z.number().int().min(1).max(12).optional(),
  posH: z.number().int().min(1).max(40).optional(),
});

export const panelUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  chartType: chartTypeSchema.optional(),
  xColumn: z.string().nullable().optional(),
  yColumns: z.array(z.string()).optional(),
  posW: z.number().int().min(1).max(12).optional(),
  posH: z.number().int().min(1).max(40).optional(),
});
