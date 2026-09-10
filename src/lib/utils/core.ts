/**
 * Core Utilities
 * Basic utility functions used throughout the application
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detect if text contains Thai characters
 */
export function containsThaiText(text: string): boolean {
  if (!text) return false;
  const thaiRegex = /[\u0E00-\u0E7F]/;
  return thaiRegex.test(text);
}

/**
 * Get appropriate font class based on text content
 */
export function getFontClass(text: string, defaultClass: string = 'font-sans'): string {
  if (containsThaiText(text)) {
    return 'font-ibm-plex-sans-thai';
  }
  return 'font-english';
}

/**
 * Get appropriate font family CSS value based on text content
 */
export function getFontFamily(text: string): string {
  if (containsThaiText(text)) {
    return 'var(--font-ibm-plex-sans-thai), sans-serif';
  }
  return 'var(--font-dm-sans), "DM Sans", sans-serif';
}

/**
 * Safely ensures a value is an array
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Safely parses JSON text or returns a default value if parsing fails.
 * Existing object values are returned as-is for callers that receive pre-parsed DB driver values.
 */
export function safeJsonParse<T>(jsonValue: unknown, defaultValue: T): T {
  if (jsonValue === null || jsonValue === undefined || jsonValue === '') {
    return defaultValue;
  }

  if (typeof jsonValue === 'object') {
    return jsonValue as T;
  }

  if (typeof jsonValue !== 'string') {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}
