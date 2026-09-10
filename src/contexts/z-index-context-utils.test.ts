import { describe, expect, it } from "vitest";

import {
  INITIAL_Z_INDEX,
  getLayerOverlayZIndex,
  getLayerZIndex,
  registerZIndexItem,
  type ZIndexItem,
} from "./z-index-context-utils";

describe("z-index context utilities", () => {
  it("registers the first standard layer at the initial z-index", () => {
    expect(registerZIndexItem([], "dialog", "modal", 100)).toEqual([
      { id: "dialog", type: "modal", zIndex: INITIAL_Z_INDEX, timestamp: 100 },
    ]);
  });

  it("prioritizes overlay layers above existing components", () => {
    const components: ZIndexItem[] = [
      { id: "drawer", type: "drawer", zIndex: 1000, timestamp: 100 },
      { id: "modal", type: "modal", zIndex: 1100, timestamp: 200 },
    ];

    expect(registerZIndexItem(components, "toast", "overlay", 300)).toEqual([
      ...components,
      { id: "toast", type: "overlay", zIndex: 1400, timestamp: 300 },
    ]);
  });

  it("does not rebuild an unchanged registration", () => {
    const components: ZIndexItem[] = [
      { id: "select", type: "dropdown", zIndex: 1000, timestamp: 100 },
    ];

    expect(registerZIndexItem(components, "select", "dropdown", 200)).toBe(components);
  });

  it("replaces an existing id when the layer type changes", () => {
    const components: ZIndexItem[] = [
      { id: "menu", type: "dropdown", zIndex: 1000, timestamp: 100 },
      { id: "dialog", type: "modal", zIndex: 1100, timestamp: 200 },
    ];

    expect(registerZIndexItem(components, "menu", "overlay", 300)).toEqual([
      { id: "dialog", type: "modal", zIndex: 1100, timestamp: 200 },
      { id: "menu", type: "overlay", zIndex: 1400, timestamp: 300 },
    ]);
  });

  it("reads content and overlay z-index values with fallbacks", () => {
    const components: ZIndexItem[] = [
      { id: "drawer", type: "drawer", zIndex: 1200, timestamp: 100 },
    ];

    expect(getLayerZIndex(components, "drawer")).toBe(1200);
    expect(getLayerOverlayZIndex(components, "drawer")).toBe(1199);
    expect(getLayerZIndex(components, "missing")).toBe(INITIAL_Z_INDEX);
    expect(getLayerOverlayZIndex(components, "missing")).toBe(INITIAL_Z_INDEX);
  });
});
