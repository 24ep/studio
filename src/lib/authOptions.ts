import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import pool from '../lib/db';
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import type { UserProfile, PlatformModuleId } from '@/lib/types';
import bcrypt from 'bcrypt';
import { logAudit } from '@/lib/auditLog';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      profile(profile) {
        return {
          id: profile.sub || profile.oid,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }
        const client = await pool.connect();
        try {
          const userQuery = 'SELECT id, name, email, password, role, "avatarUrl" as "image", "modulePermissions" FROM "User" WHERE email = $1';
          const result = await client.query(userQuery, [credentials.email]);
          if (result.rows.length === 0) {
            console.log(`No user found with email: ${credentials.email}`);
            await logAudit('WARN', `Failed login attempt: User not found for email '${credentials.email}'.`, 'Auth:Credentials', null, { email: credentials.email, ip: req.headers?.['x-forwarded-for'] || req.headers?.['remote_addr'] });
            throw new Error("Invalid email or password.");
          }
          const userFromDb = result.rows[0];
          const isPasswordValid = await bcrypt.compare(credentials.password, userFromDb.password);
          if (isPasswordValid) {
            return {
              id: userFromDb.id,
              name: userFromDb.name,
              email: userFromDb.email,
              image: userFromDb.image, 
              role: userFromDb.role as UserProfile['role'],
              modulePermissions: (userFromDb.modulePermissions || []) as PlatformModuleId[],
            } as NextAuthUser & { role?: UserProfile['role'], modulePermissions?: PlatformModuleId[] }; 
          } else {
            console.log(`Invalid password attempt for email: ${credentials.email}`);
            await logAudit('WARN', `Failed login attempt: Invalid password for user '${userFromDb.email}' (ID: ${userFromDb.id}).`, 'Auth:Credentials', userFromDb.id, { email: userFromDb.email, ip: req.headers?.['x-forwarded-for'] || req.headers?.['remote_addr'] });
            throw new Error("Invalid email or password.");
          }
        } catch (error) {
            if (!(error instanceof Error && (error.message === "Invalid email or password." || error.message === "Please enter both email and password."))) {
              console.error("Error during credentials authorization:", error);
            }
            if (error instanceof Error && (error.message === "Invalid email or password." || error.message === "Please enter both email and password.")) {
                throw error;
            }
            await logAudit('ERROR', `Error during credentials authorization for email '${credentials?.email}'. Error: ${(error as Error).message}`, 'Auth:Credentials', null, { email: credentials?.email });
            throw new Error("An error occurred during login. Please try again.");
        } finally {
          client.release();
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await logAudit('AUDIT', `User '${user.name || user.email}' (ID: ${user.id}) signed in.`, 'Auth', user.id, { provider: account?.provider, isNewUser: isNewUser });
    },
    async signOut({ token, session }) {
      const userId = token?.id || (session?.user as any)?.id;
      const userName = token?.name || token?.email || session?.user?.name || session?.user?.email || 'Unknown User';
      if (userId) {
        await logAudit('AUDIT', `User '${userName}' (ID: ${userId}) signed out.`, 'Auth', userId);
      } else {
        await logAudit('AUDIT', `User signed out (ID not available in token/session).`, 'Auth');
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) { 
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        if ((user as any).role) {
          token.role = (user as any).role as UserProfile['role'];
        }
        if ((user as any).modulePermissions) {
          token.modulePermissions = (user as any).modulePermissions as PlatformModuleId[];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
        if (token.role) {
          session.user.role = token.role as UserProfile['role'];
        }
        if (token.modulePermissions) {
          session.user.modulePermissions = token.modulePermissions as PlatformModuleId[];
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', 
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 