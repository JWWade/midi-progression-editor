import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "../index";

describe("resolveApiBaseUrl", () => {
  it("uses configured base URL when provided", () => {
    const baseUrl = resolveApiBaseUrl({
      DEV: false,
      MODE: "production",
      VITE_API_BASE_URL: "https://api.example.com",
    });

    expect(baseUrl).toBe("https://api.example.com");
  });

  it("falls back to localhost in development when URL is missing", () => {
    const baseUrl = resolveApiBaseUrl({
      DEV: true,
      MODE: "development",
    });

    expect(baseUrl).toBe("http://localhost:5110");
  });

  it("throws in non-development when URL is missing", () => {
    expect(() =>
      resolveApiBaseUrl({
        DEV: false,
        MODE: "production",
      }),
    ).toThrow(/VITE_API_BASE_URL/);
  });

  it("throws in non-development when URL is blank", () => {
    expect(() =>
      resolveApiBaseUrl({
        DEV: false,
        MODE: "preview",
        VITE_API_BASE_URL: "   ",
      }),
    ).toThrow(/VITE_API_BASE_URL/);
  });
});
