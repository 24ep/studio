import { auth } from '@/auth';

export async function getValidatedAuthSession() {
  try {
    const session = await auth();
    return session?.user?.id ? session : null;
  } catch (error) {
    console.error('[AUTH] Failed to resolve a valid user session:', error);
    return null;
  }
}
