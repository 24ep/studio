import { describe, expect, it } from "vitest";

import { mapV1PositionRow } from "./positions-v1-route-map";
import { buildV1PositionListQuery } from "./positions-v1-route-query";

describe("positions v1 route helpers", () => {
  it("builds filtered list and count queries with matching params", () => {
    const query = buildV1PositionListQuery(new URLSearchParams({
      title: "engineer",
      department: "Product, Design",
      isOpen: "true",
      positionLevel: "senior",
      limit: "50",
      offset: "100",
    }));

    expect(query.query).toContain("p.title ILIKE $1");
    expect(query.query).toContain("p.department = ANY($2::text[])");
    expect(query.query).toContain('p."isOpen" = TRUE');
    expect(query.query).toContain('p."positionLevel" ILIKE $3');
    expect(query.query).toContain("LIMIT $4 OFFSET $5");
    expect(query.countQuery).not.toContain("LIMIT");
    expect(query.queryParams).toEqual(["%engineer%", ["Product", "Design"], "%senior%", 50, 100]);
    expect(query.countParams).toEqual(["%engineer%", ["Product", "Design"], "%senior%"]);
  });

  it("maps recruiter fields into the response shape", () => {
    expect(mapV1PositionRow({
      id: "position-1",
      title: "Engineer",
      department: "Product",
      description: null,
      matchCriteria: null,
      isOpen: true,
      positionLevel: null,
      gradeId: null,
      recruiterId: "user-1",
      customAttributes: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      recruiterName: "Ada",
      recruiterEmail: "ada@example.com",
    })).toMatchObject({
      custom_attributes: {},
      recruiter: {
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
      },
    });
  });
});
