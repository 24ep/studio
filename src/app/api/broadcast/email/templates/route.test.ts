import { describe, expect, it } from "vitest";

import { parseTemplateCatalog } from "./template-catalog";

describe("broadcast email template catalog", () => {
  it("returns only active versions of Hrive-required templates", () => {
    const templates = parseTemplateCatalog(JSON.stringify([
      {
        code: "interview_invitation",
        versions: [
          { version: 2, status: "draft", subject: "Draft", html: "<p>Draft</p>" },
          { version: 1, status: "active", subject: "Active", html: "<p>Active</p>", variables: ["name"] },
        ],
      },
      { code: "custom_template", versions: [{ version: 1, status: "active", subject: "Custom", html: "<p>No</p>" }] },
    ]));

    expect(templates.find(template => template.code === "interview_invitation")).toEqual(
      expect.objectContaining({ subject: "Active", html: "<p>Active</p>", variables: ["name"] }),
    );
    expect(templates.some(template => template.code === "custom_template")).toBe(false);
  });

  it("falls back to the deploy-seeded required catalog", () => {
    expect(parseTemplateCatalog(null).length).toBeGreaterThan(0);
    expect(parseTemplateCatalog("not json").every(template => template.code && template.html)).toBe(true);
  });
});
