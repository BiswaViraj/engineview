import { describe, it, expect } from "vitest";
import { expandTimeMacro, sinceExpression } from "../server/utils/macros";

describe("time-range macro", () => {
  it("expands $SINCE with the given range", () => {
    expect(expandTimeMacro("WHERE ts > $SINCE", "7 DAY")).toBe(
      "WHERE ts > NOW() - INTERVAL '7' DAY",
    );
  });

  it("expands every occurrence", () => {
    const out = expandTimeMacro("a $SINCE b $SINCE", "1 HOUR");
    expect(out).toBe("a NOW() - INTERVAL '1' HOUR b NOW() - INTERVAL '1' HOUR");
  });

  it("leaves queries without the token unchanged", () => {
    const sql = "SELECT 1 FROM ds WHERE timestamp > NOW() - INTERVAL '1' DAY";
    expect(expandTimeMacro(sql, "7 DAY")).toBe(sql);
  });

  it("defaults to 24 HOUR when the range is omitted", () => {
    expect(expandTimeMacro("$SINCE")).toBe("NOW() - INTERVAL '24' HOUR");
  });

  it("falls back to the default for a malformed range", () => {
    expect(sinceExpression("garbage")).toBe("NOW() - INTERVAL '24' HOUR");
    expect(sinceExpression("12 PARSEC")).toBe("NOW() - INTERVAL '24' HOUR");
  });

  it("accepts plural units", () => {
    expect(sinceExpression("30 DAYS")).toBe("NOW() - INTERVAL '30' DAY");
  });

  it("does not allow injection through the range value", () => {
    // A malicious range cannot smuggle SQL; it just falls back to the default.
    expect(sinceExpression("1 DAY'; DROP TABLE user; --")).toBe(
      "NOW() - INTERVAL '24' HOUR",
    );
  });
});
