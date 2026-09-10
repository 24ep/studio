import { z } from 'zod';

export const nullableOptionalIntegerSchema = z.union([
  z.number(),
  z.string().transform((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }),
  z.boolean().transform(() => undefined),
]).nullable().optional();

export const nullableOptionalNumberSchema = z.union([
  z.number(),
  z.string().transform((value) => {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }),
  z.boolean().transform(() => undefined),
]).nullable().optional();

export const nullableOptionalBooleanFlagSchema = z.union([
  z.boolean(),
  z.string().transform((value) => {
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return false;
  }),
  z.number().transform((value) => value === 1),
]).optional().nullable();

export const nullableOptionalPrimitiveStringSchema = z.union([
  z.string(),
  z.number().transform((value) => value.toString()),
  z.boolean().transform(() => ''),
]).optional().nullable();
