
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mockAppUsers } from '@/lib/data'; // Assuming mockAppUsers contains users with email/password for demo

// IMPORTANT: See comments in the original file for Azure AD setup.

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      // Optional: Configure profile information if needed
      // profile(profile) { ... }
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

        // --- THIS IS MOCK AUTHENTICATION - NOT FOR PRODUCTION ---
        // In a real application, you would:
        // 1. Query your database for a user with the provided email.
        // 2. Compare the provided password with the hashed password stored in your database.
        //    NEVER store plain text passwords. Use a library like bcrypt.
        const user = mockAppUsers.find(u => u.email === credentials.email);

        // For demo purposes, let's assume a mock password check
        // In a real app, you'd compare a hashed password.
        // Example: if (user && await bcrypt.compare(credentials.password, user.hashedPassword))
        if (user && credentials.password === "password") { // Replace "password" with actual logic
          // Return a user object that NextAuth expects
          // Ensure it has at least id, name, email. Other fields are optional.
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl, // Optional
            // role: user.role, // You can add custom properties here
          } as NextAuthUser; // Cast to NextAuthUser
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
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
      // Persist the OAuth access_token or user details from credentials to the token
      if (account?.provider === "azure-ad" && account) {
        token.accessToken = account.access_token;
        token.id = profile?.sub || user?.id; // OID or sub is usually the unique identifier from Azure AD
      }
      if (user) { // This user object comes from the provider (Azure AD profile or Credentials authorize)
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        // If you added custom properties like 'role' in authorize or profile, assign them here.
        // const dbUser = mockAppUsers.find(u => u.id === user.id); // Example: Fetch role from DB/mock
        // if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token or user id from token
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
        // if (token.role) session.user.role = token.role as UserProfile['role'];
        // session.accessToken = token.accessToken as string | undefined; // If using access tokens
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirect to signin page on error, with error query param
  },
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
