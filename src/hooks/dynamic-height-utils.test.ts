import { describe, expect, it } from "vitest";

import {
  calculateDynamicHeight,
  resolveDynamicHeightOptions,
  shouldCommitDynamicHeight,
} from "./dynamic-height-utils";

describe("dynamic-height-utils", () => {
  it("resolves default and provided dynamic height options", () => {
    expect(resolveDynamicHeightOptions()).toEqual({
      minHeight: 300,
      maxHeight: 800,
      buffer: 20,
      debounceMs: 150,
    });

    expect(resolveDynamicHeightOptions({
      minHeight: 240,
      maxHeight: 960,
      buffer: 32,
      debounceMs: 80,
    })).toEqual({
      minHeight: 240,
      maxHeight: 960,
      buffer: 32,
      debounceMs: 80,
    });
  });

  it("calculates dynamic height within configured bounds", () => {
    expect(calculateDynamicHeight({
      windowHeight: 900,
      filterHeight: 180,
      minHeight: 300,
      maxHeight: 800,
      buffer: 20,
    })).toBe(700);

    expect(calculateDynamicHeight({
      windowHeight: 1200,
      filterHeight: 10,
      minHeight: 300,
      maxHeight: 800,
      buffer: 20,
    })).toBe(800);

    expect(calculateDynamicHeight({
      windowHeight: 250,
      filterHeight: 50,
      minHeight: 300,
      maxHeight: 800,
      buffer: 20,
    })).toBe(300);
  });

  it("falls back to minimum height without a browser window height", () => {
    expect(calculateDynamicHeight({
      windowHeight: null,
      filterHeight: 180,
      minHeight: 320,
      maxHeight: 800,
      buffer: 20,
    })).toBe(320);
  });

  it("only commits meaningful height changes", () => {
    expect(shouldCommitDynamicHeight(406, 400)).toBe(true);
    expect(shouldCommitDynamicHeight(405, 400)).toBe(false);
    expect(shouldCommitDynamicHeight(397, 400, 2)).toBe(true);
  });
});
