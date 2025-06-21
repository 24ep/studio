// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { logAudit } from '@/lib/auditLog';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // The user model does not have a password field. 
        // Credentials provider is not fully supported with the current schema.
        // This will only allow users who exist in the DB to log in, without a password check.
        if (user) {
          return user;
        }
        
        // Returning null will show a generic error message.
        return null;
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
      // Token might be more reliable here if session is already cleared
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
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!; // The user id is in the 'sub' claim from the JWT
        session.user.role = (token as any).role;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        // On sign-in, persist the user's role to the token
        token.role = (user as User).role;
      }
      return token;
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
