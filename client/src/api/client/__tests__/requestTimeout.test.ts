import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestWithTimeout,
} from "../index";

afterEach(() => {
  vi.useRealTimers();
});

describe("requestWithTimeout", () => {
  it("returns successful responses", async () => {
    const result = await requestWithTimeout(async () => 42, { timeoutMs: 100 });
    expect(result).toBe(42);
  });

  it("maps timed out requests to ApiRequestError with timeout code", async () => {
    vi.useFakeTimers();

    const promise = requestWithTimeout(
      () => new Promise<never>(() => undefined),
      { timeoutMs: 250 },
    );
    const assertion = expect(promise).rejects.toEqual(
      expect.objectContaining({
        code: "timeout",
        name: "ApiRequestError",
      }),
    );

    await vi.advanceTimersByTimeAsync(250);
    await assertion;
  });

  it("maps externally aborted requests to ApiRequestError with aborted code", async () => {
    const controller = new AbortController();

    const promise = requestWithTimeout(
      () =>
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
      { timeoutMs: 5000, signal: controller.signal },
    );
      const assertion = expect(promise).rejects.toEqual(
        expect.objectContaining({
          code: "aborted",
          name: "ApiRequestError",
        }),
      );

    controller.abort();
      await assertion;
  });
});
