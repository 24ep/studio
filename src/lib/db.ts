// src/lib/db.ts
import prisma from './prisma';

export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    if (setting) {
      return setting.value;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching system setting for key "${key}":`, error);
    return null; // Return null on error to avoid breaking flows, default to env var if calling code handles it
  }
}

