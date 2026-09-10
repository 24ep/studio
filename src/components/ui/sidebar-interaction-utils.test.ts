import { describe, expect, it } from "vitest"

import {
  canAttemptSidebarToggle,
  shouldBlurCollapsedOffcanvas,
  shouldCollapseSidebarOnLeave,
  shouldExpandSidebarOnHover,
  shouldReplaceAriaHiddenWithInert,
} from "./sidebar-interaction-utils"

describe("sidebar interaction utilities", () => {
  it("guards rapid or in-progress toggles", () => {
    expect(canAttemptSidebarToggle({
      isToggling: false,
      lastToggleTime: 100,
      now: 300,
    })).toBe(true)
    expect(canAttemptSidebarToggle({
      isToggling: false,
      lastToggleTime: 200,
      now: 300,
    })).toBe(false)
    expect(canAttemptSidebarToggle({
      isToggling: true,
      lastToggleTime: 0,
      now: 300,
    })).toBe(false)
  })

  it("decides hover expansion and collapse behavior", () => {
    expect(shouldExpandSidebarOnHover({ isMobile: false, manuallyExpanded: false, open: false })).toBe(true)
    expect(shouldExpandSidebarOnHover({ isMobile: true, manuallyExpanded: false, open: false })).toBe(false)
    expect(shouldCollapseSidebarOnLeave({ isMobile: false, manuallyExpanded: false, open: true })).toBe(true)
    expect(shouldCollapseSidebarOnLeave({ isMobile: false, manuallyExpanded: true, open: true })).toBe(false)
  })

  it("blurs only collapsed offcanvas sidebars", () => {
    expect(shouldBlurCollapsedOffcanvas({ collapsible: "offcanvas", state: "collapsed" })).toBe(true)
    expect(shouldBlurCollapsedOffcanvas({ collapsible: "icon", state: "collapsed" })).toBe(false)
    expect(shouldBlurCollapsedOffcanvas({ collapsible: "offcanvas", state: "expanded" })).toBe(false)
  })

  it("detects focusable aria-hidden targets that should become inert", () => {
    const target = {
      getAttribute: () => "true",
      querySelectorAll: () => ({ length: 1 }),
    } as unknown as HTMLElement
    const mutation = {
      attributeName: "aria-hidden",
      type: "attributes",
    } as MutationRecord

    expect(shouldReplaceAriaHiddenWithInert(mutation, target)).toBe(true)
    const emptyTarget = {
      getAttribute: () => "true",
      querySelectorAll: () => ({ length: 0 }),
    } as unknown as HTMLElement
    expect(shouldReplaceAriaHiddenWithInert(mutation, emptyTarget)).toBe(false)
  })
})
