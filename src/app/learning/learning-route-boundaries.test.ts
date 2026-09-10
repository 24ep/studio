import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

async function routeSource(path: string) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

describe("Learning route ownership", () => {
  it("keeps Career Explorer out of the legacy LearningPageClient", async () => {
    const source = await routeSource(
      "src/app/learning/career-explorer/page.tsx",
    );

    expect(source).not.toContain("LearningPageClient");
    expect(source).toContain("CareerExplorer");
  });

  it("keeps Trusted Certificates out of the legacy LearningPageClient", async () => {
    const source = await routeSource(
      "src/app/learning/trusted-certificates/page.tsx",
    );

    expect(source).not.toContain("LearningPageClient");
    expect(source).toContain("TrustedCertificatesPageClient");
  });

  it("keeps Achievements out of the legacy LearningPageClient", async () => {
    const source = await routeSource(
      "src/app/learning/achievements/page.tsx",
    );

    expect(source).not.toContain("LearningPageClient");
    expect(source).toContain("AchievementsPageClient");
  });
});
