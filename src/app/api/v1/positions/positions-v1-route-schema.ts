import { z } from "zod";

export const createPositionSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  description: z.string().optional().nullable(),
  matchCriteria: z.string().optional().nullable(),
  isOpen: z.boolean({ required_error: "isOpen status is required" }),
  positionLevel: z.string().optional().nullable(),
  custom_attributes: z.record(z.unknown()).optional().nullable(),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export function formatCreatePositionValidationErrors(error: z.ZodError<CreatePositionInput>) {
  const fieldErrors = error.flatten().fieldErrors;

  return Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
    .join("; ");
}
