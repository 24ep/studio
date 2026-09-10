import { DefaultSession } from "next-auth";
import { UserProfile, PlatformModuleId } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserProfile['role'];
      avatarUrl?: string | null;
      personalColor?: string | null;
      twoFactorEnabled?: boolean;
      twoFactorMethod?: 'email' | 'totp';
      modulePermissions: PlatformModuleId[];
      
      // Impersonation fields
      impersonatedUserId?: string;
      impersonatedRole?: UserProfile['role'];
      adminId?: string; // Stores the original admin ID when impersonating
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserProfile['role'];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    sessionToken?: string;
    isMobile?: boolean;
    
    // Impersonation fields
    impersonatedUserId?: string;
    impersonatedRole?: string;
    adminId?: string;
  }
}

export {};
