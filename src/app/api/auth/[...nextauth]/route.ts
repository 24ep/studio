
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mockAppUsers } from '@/lib/data'; 
import type { UserProfile } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      profile(profile) {
        // You can map additional Azure AD profile claims to the NextAuth user object here
        // For RBAC, you might map Azure AD group memberships to application roles
        return {
          id: profile.sub || profile.oid, // 'sub' or 'oid' is typically the unique ID
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // role: mapAzureGroupsToRoles(profile.groups) // Example: custom function
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

        const user = mockAppUsers.find(u => u.email === credentials.email);

        // --- THIS IS MOCK AUTHENTICATION - NOT FOR PRODUCTION ---
        // In a real app, use bcrypt.compare(credentials.password, user.hashedPassword)
        if (user && credentials.password === "password") { 
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: user.role, // Include role here
          } as NextAuthUser & { role?: UserProfile['role'] }; 
        } else {
          throw new Error("Invalid email or password.");
        }
        // --- END MOCK AUTHENTICATION ---
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // This 'user' object comes from the provider (Azure AD profile or Credentials authorize result)
      if (user) { 
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        if (user.role) { // If role is present on user object (e.g., from Credentials or Azure profile mapping)
          token.role = user.role as UserProfile['role'];
        }
      }
      // For Azure AD, if role wasn't mapped in profile(), you might fetch it here or from token claims
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
