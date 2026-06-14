import { describe, it, expect } from "vitest";
import {
  appCreateSchema,
  appUpdateSchema,
  chartTypeSchema,
  dashboardCreateSchema,
  savedQueryCreateSchema,
  savedQueryUpdateSchema,
} from "../server/utils/schemas";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("appCreateSchema", () => {
  it("requires name and a uuid connectionId", () => {
    expect(appCreateSchema.safeParse({}).success).toBe(false);
    expect(appCreateSchema.safeParse({ name: "Hexbench", connectionId: "nope" }).success).toBe(
      false,
    );
    expect(appCreateSchema.safeParse({ name: "Hexbench", connectionId: UUID }).success).toBe(true);
  });
  it("accepts optional dataset, url and logoUrl", () => {
    const r = appCreateSchema.safeParse({
      name: "Hexbench",
      connectionId: UUID,
      dataset: "pageviews",
      url: "https://hexbench.app",
      logoUrl: "https://hexbench.app/logo.png",
    });
    expect(r.success).toBe(true);
  });
});

describe("appUpdateSchema", () => {
  it("allows partial and empty updates", () => {
    expect(appUpdateSchema.safeParse({}).success).toBe(true);
    expect(appUpdateSchema.safeParse({ name: "Renamed" }).success).toBe(true);
  });
});

describe("savedQueryUpdateSchema", () => {
  it("allows partial updates but rejects blank name or sql", () => {
    expect(savedQueryUpdateSchema.safeParse({}).success).toBe(true);
    expect(savedQueryUpdateSchema.safeParse({ name: "Renamed" }).success).toBe(true);
    expect(savedQueryUpdateSchema.safeParse({ sql: "select 1" }).success).toBe(true);
    expect(savedQueryUpdateSchema.safeParse({ name: "" }).success).toBe(false);
    expect(savedQueryUpdateSchema.safeParse({ sql: "" }).success).toBe(false);
  });
});

describe("chartTypeSchema", () => {
  it("accepts table and rejects unknown types", () => {
    expect(chartTypeSchema.safeParse("table").success).toBe(true);
    expect(chartTypeSchema.safeParse("line").success).toBe(true);
    expect(chartTypeSchema.safeParse("pie").success).toBe(false);
  });
});

describe("appId is required on dashboards and saved queries", () => {
  it("dashboard create needs appId", () => {
    expect(dashboardCreateSchema.safeParse({ name: "D" }).success).toBe(false);
    expect(dashboardCreateSchema.safeParse({ name: "D", appId: UUID }).success).toBe(true);
  });
  it("saved query create needs appId", () => {
    expect(savedQueryCreateSchema.safeParse({ name: "Q", sql: "select 1" }).success).toBe(false);
    expect(
      savedQueryCreateSchema.safeParse({ name: "Q", sql: "select 1", appId: UUID }).success,
    ).toBe(true);
  });
});
