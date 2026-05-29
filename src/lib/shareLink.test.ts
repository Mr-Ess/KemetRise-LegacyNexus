import { describe, it, expect } from "vitest";
import { buildShareLink } from "@/lib/shareLink";

describe("shareLink", () => {
  it("encodes payload into URL hash", () => {
    const url = buildShareLink("brand", { id: "1", name: "Test" });
    expect(url).toContain("?share=");
    const data = new URL(url).searchParams.get("share")!;
    const decoded = JSON.parse(decodeURIComponent(escape(atob(data))));
    expect(decoded.kind).toBe("brand");
    expect(decoded.payload.name).toBe("Test");
  });
});
