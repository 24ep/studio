import { decode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

import type { PlatformModuleId } from "@/lib/types";

export type VerifiedApiToken = JWT & {
  role?: string;
  modulePermissions?: PlatformModuleId[];
};

function getNextAuthTokenSalts(isSecure: boolean) {
  return [
    isSecure ? "__Secure-authjs.session-token" : "authjs.session-token",
    isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
  ];
}

export async function verifyApiToken(token: string): Promise<VerifiedApiToken | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("NEXTAUTH_SECRET is not set");

    const salts = getNextAuthTokenSalts(process.env.NODE_ENV === "production");
    for (const salt of salts) {
      try {
        const decoded = await decode({ token, secret, salt });
        if (decoded) return decoded as VerifiedApiToken;
      } catch {
        // Try the next cookie salt for compatibility with older sessions.
      }
    }

    return null;
  } catch (err) {
    console.error("[AUTH] Token verification failed:", err);
    return null;
  }
}
