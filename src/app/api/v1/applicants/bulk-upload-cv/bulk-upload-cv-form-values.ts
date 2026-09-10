export function getFormStringValue(formData: FormData, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
