import { describe, it, expect } from "vitest";
import { toCsv } from "../app/lib/csv";

describe("toCsv", () => {
  it("writes a header then one line per row", () => {
    expect(toCsv(["a", "b"], [{ a: 1, b: 2 }])).toBe("a,b\n1,2");
  });
  it("quotes values containing comma, quote or newline", () => {
    expect(toCsv(["x"], [{ x: "a,b" }])).toBe('x\n"a,b"');
    expect(toCsv(["x"], [{ x: 'say "hi"' }])).toBe('x\n"say ""hi"""');
  });
  it("renders null and undefined as empty", () => {
    expect(toCsv(["x"], [{ x: null }])).toBe("x\n");
  });
});
