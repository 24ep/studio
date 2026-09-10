import { describe, expect, it } from "vitest";

import {
  buildErrorContext,
  createFilterErrorContext,
  createInitializationErrorContext,
  getFilterErrorDebugInfo,
  getInitializationErrorVariableName,
  isFilterError,
  isInitializationError,
  isResizeObserverLoopError,
} from "./error-handler-utils";

describe("error-handler-utils", () => {
  it("builds a normalized error context", () => {
    const context = buildErrorContext(new Error("Boom"), "global_error", { filename: "app.js" });

    expect(context).toMatchObject({
      errorType: "global_error",
      message: "Boom",
      filename: "app.js",
      url: "server-side",
    });
    expect(context.userAgent).toEqual(expect.any(String));
    expect(context.timestamp).toEqual(expect.any(String));
  });

  it("classifies initialization errors", () => {
    expect(isInitializationError("Cannot access tg before initialization")).toBe(true);
    expect(getInitializationErrorVariableName("Cannot access tg before initialization")).toBe("TG");
    expect(getInitializationErrorVariableName("Cannot access ee before initialization")).toBe("EE");
    expect(getInitializationErrorVariableName("Cannot access value before initialization")).toBe("Unknown");

    expect(createInitializationErrorContext({
      errorType: "global_error",
      message: "Cannot access tg before initialization",
      timestamp: "now",
    })).toMatchObject({
      errorType: "TG_initialization_error",
      likelyCause: "Variable accessed before initialization in minified bundle",
    });
  });

  it("classifies filter errors and creates debug info", () => {
    expect(isFilterError(new Error("items.filter is not a function"))).toBe(true);
    expect(isFilterError("T.filter is not a function")).toBe(true);
    expect(isFilterError("other failure")).toBe(false);

    expect(createFilterErrorContext({
      errorType: "global_error",
      message: "items.filter is not a function",
      timestamp: "now",
    })).toMatchObject({ errorType: "filter_error" });

    expect(getFilterErrorDebugInfo({ a: 1 }, "load")).toMatchObject({
      context: "load",
      arrayType: "object",
      isArray: false,
      keys: ["a"],
      sample: "{\"a\":1}...",
    });
  });

  it("detects benign resize observer loop errors", () => {
    expect(isResizeObserverLoopError("ResizeObserver loop completed with undelivered notifications")).toBe(true);
    expect(isResizeObserverLoopError("ResizeObserver loop limit exceeded")).toBe(false);
    expect(isResizeObserverLoopError(undefined)).toBe(false);
  });
});
