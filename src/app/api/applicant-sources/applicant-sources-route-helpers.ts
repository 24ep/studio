import { z } from "zod";

import { getPool } from "@/lib/db";

export const createApplicantSourceSchema = z.object({
  name: z.string().min(1, "Source name is required"),
  description: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  allowSubSource: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export function getApplicantSourceRouteErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim() ? error.message : "Unknown error";
}

export async function fetchApplicantSources() {
  const result = await getPool().query(`
    SELECT
      id, name, description, email, logo, allow_sub_source as "allowSubSource",
      sort_order as "sortOrder", is_active as "isActive",
      "createdAt", "updatedAt"
    FROM "ApplicantSource"
    ORDER BY sort_order ASC, name ASC
  `);

  return result.rows;
}

export async function findApplicantSourceByName(name: string) {
  const existingResult = await getPool().query(
    'SELECT id FROM "ApplicantSource" WHERE name = $1',
    [name],
  );

  return existingResult.rows[0] ?? null;
}

export async function insertApplicantSource({
  id,
  source,
}: {
  id: string;
  source: z.infer<typeof createApplicantSourceSchema>;
}) {
  const result = await getPool().query(`
    INSERT INTO "ApplicantSource" (
      id, name, description, email, logo, allow_sub_source, sort_order, is_active,
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING id, name, description, email, logo, allow_sub_source as "allowSubSource",
              sort_order as "sortOrder", is_active as "isActive",
              "createdAt", "updatedAt"
  `, [
    id,
    source.name,
    source.description,
    source.email,
    source.logo,
    source.allowSubSource,
    source.sortOrder,
    source.isActive,
  ]);

  return result.rows[0];
}
