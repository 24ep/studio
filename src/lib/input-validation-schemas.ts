import { z } from "zod";

export const commonSchemas = {
  uuid: z.string().uuid("Invalid UUID format"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
  name: z.string().min(1, "Name is required").max(100, "Name too long").regex(/^[a-zA-Z0-9\s\-_\.]+$/, "Name contains invalid characters"),
  text: z.string().max(1000, "Text too long"),
  longText: z.string().max(10000, "Text too long"),
  url: z.string().url("Invalid URL format").max(2048, "URL too long"),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format"),
  date: z.string().datetime("Invalid date format"),
  positiveInt: z.number().int().positive("Must be a positive integer"),
  nonNegativeInt: z.number().int().min(0, "Must be non-negative"),
  boolean: z.boolean(),
  json: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid JSON format"),
};

export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().max(50 * 1024 * 1024),
  type: z.string().regex(/^(application\/pdf|image\/(jpeg|jpg|png|gif)|text\/plain|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/, "Invalid file type"),
});
