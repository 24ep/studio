import type { Prisma } from "@prisma/client";
import { z } from "zod";

const jsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() => z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(jsonValueSchema),
  z.record(z.string(), jsonValueSchema),
]));

const fieldMappingSchema = z.object({
  source_field: z.string(),
  target_field: z.string(),
  transform: z.enum(["uppercase", "lowercase", "trim", "date", "number", "boolean"]).optional(),
  default_value: jsonValueSchema.optional(),
});

export const webhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH"]),
  is_active: z.boolean().optional(),
  auth_type: z.enum(["none", "basic", "bearer", "header"]).optional(),
  auth_username: z.string().optional(),
  auth_password: z.string().optional(),
  auth_token: z.string().optional(),
  auth_header_name: z.string().optional(),
  auth_header_value: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retry_count: z.number().min(0).max(10).optional(),
  timeout: z.number().min(5).max(300).optional(),
  body_template: z.string().optional(),
  field_mappings: z.array(fieldMappingSchema).optional(),
  include_metadata: z.boolean().optional(),
  custom_payload: z.boolean().optional(),
});
