
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import pool from '../../../../lib/db'; // Import the db pool
import type { UserProfile } from '@/lib/types';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      profile(profile) {
        // Map Azure AD profile claims to NextAuth user object
        return {
          id: profile.sub || profile.oid, // 'sub' or 'oid' is typically the unique ID
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // role: mapAzureGroupsToRoles(profile.groups) // Example: custom function to map roles. Ensure roles are part of the JWT/session.
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
          const userQuery = 'SELECT id, name, email, password, role, "avatarUrl" as "image" FROM "User" WHERE email = $1';
          const result = await client.query(userQuery, [credentials.email]);
          
          if (result.rows.length === 0) {
            console.log(`No user found with email: ${credentials.email}`);
            throw new Error("Invalid email or password.");
          }
          
          const userFromDb = result.rows[0];

          const isPasswordValid = await bcrypt.compare(credentials.password, userFromDb.password);

          if (isPasswordValid) {
            return {
              id: userFromDb.id,
              name: userFromDb.name,
              email: userFromDb.email,
              image: userFromDb.image, // from "avatarUrl"
              role: userFromDb.role as UserProfile['role'],
            } as NextAuthUser & { role?: UserProfile['role'] }; 
          } else {
            console.log(`Invalid password attempt for email: ${credentials.email}`);
            throw new Error("Invalid email or password.");
          }
        } catch (error) {
            if (!(error instanceof Error && (error.message === "Invalid email or password." || error.message === "Please enter both email and password."))) {
              console.error("Error during credentials authorization:", error);
            }
            throw error; 
        } finally {
          client.release();
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
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
      }
      // For Azure AD, if role wasn't mapped in profile(), you might map it here
      // or ensure profile mapping includes the role from group claims.
      // if (account?.provider === "azure-ad" && profile) {
      //   // example: token.role = mapAzureGroupsToRoles(profile.groups)
      // }
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
    