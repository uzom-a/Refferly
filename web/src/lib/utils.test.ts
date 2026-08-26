import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("filters out falsy values", () => {
    expect(cn("text-sm", false, null, undefined, "font-bold")).toBe("text-sm font-bold");
  });

  it("merges conflicting Tailwind classes, keeping the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional object syntax from clsx", () => {
    expect(cn("base", { "text-red-500": true, "text-blue-500": false })).toBe(
      "base text-red-500",
    );
  });

  it("returns an empty string when given no meaningful input", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined)).toBe("");
  });
});
