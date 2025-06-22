import { type NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getPool, getMergedUserPermissions } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/auditLog';
import type { UserProfile, PlatformModuleId } from '@/lib/types';

export const authOptions: NextAuthOptions = {
    providers: [
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        tenantId: process.env.AZURE_AD_TENANT_ID!,
      }),
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please enter both email and password.");
          }
  
          const client = await getPool().connect();
          try {
            const result = await client.query('SELECT * FROM "User" WHERE email = $1', [credentials.email]);
            const user = result.rows[0];
  
            if (user && user.password) {
              const isValid = await bcrypt.compare(credentials.password, user.password);
              if (isValid) {
                // Fetch merged permissions (direct + group)
                const mergedPermissions = await getMergedUserPermissions(user.id) as PlatformModuleId[];
                // Return a user object, omitting the password
                return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  image: user.image,
                  modulePermissions: mergedPermissions,
                };
              }
            }
            return null;
          } catch (error) {
              console.error("Authorize error:", error);
              return null;
          } finally {
              client.release();
          }
        }
      })
    ],
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (account && user) {
          token.accessToken = account.access_token;
          token.id = user.id;
          token.role = user.role;
          token.modulePermissions = user.modulePermissions as PlatformModuleId[];
        }
        // If token.id exists but modulePermissions is missing, fetch merged permissions (for session refreshes)
        if (token.id && !token.modulePermissions) {
          try {
            token.modulePermissions = await getMergedUserPermissions(token.id as string) as PlatformModuleId[];
          } catch (e) {
            token.modulePermissions = [];
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as UserProfile['role'];
          session.user.modulePermissions = token.modulePermissions as PlatformModuleId[];
        }
        return session;
      },
      async signIn({ user, account, profile }) {
          if (account?.provider === 'azure-ad' && profile?.email) {
              const client = await getPool().connect();
              try {
                  // Use profile.sub as the unique user ID (OID) if oid is not present
                  const oid = (profile as any).oid ?? (profile as any).sub ?? profile.email;
                  const picture = (profile as any).picture ?? null;
  
                  // Check if user exists
                  let res = await client.query('SELECT * FROM "User" WHERE email = $1', [profile.email]);
                  let dbUser = res.rows[0];
  
                  if (!dbUser) {
                      // If not, create a new user
                      await client.query(
                          'INSERT INTO "User" (id, name, email, "emailVerified", image, role) VALUES ($1, $2, $3, $4, $5, $6)',
                          [oid, profile.name, profile.email, new Date(), picture, 'Recruiter'] // Default role
                      );
                      await logAudit('AUDIT', `New user '${profile.name}' created via Azure AD SSO.`, 'Auth:SignIn', oid);
                  }
                  
                  // Also create an account entry for the provider
                  res = await client.query('SELECT * FROM "Account" WHERE "provider" = $1 AND "providerAccountId" = $2', [account.provider, account.providerAccountId]);
                  if (res.rows.length === 0) {
                       await client.query(
                          'INSERT INTO "Account" ("userId", type, provider, "providerAccountId", access_token, expires_at, scope, token_type, id_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                          [oid, account.type, account.provider, account.providerAccountId, account.access_token, account.expires_at, account.scope, account.token_type, account.id_token]
                      );
                  }
              } catch (err) {
                  console.error("Error during Azure AD sign-in DB operations:", err);
                  return false; // Prevent sign-in on DB error
              } finally {
                  client.release();
              }
          }
          return true;
      }
    },
    pages: {
      signIn: '/auth/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }; 