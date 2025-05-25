
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

// IMPORTANT:
// 1. Create a .env.local file in your project root (if it doesn't exist).
// 2. Add the following environment variables to your .env.local file, replacing placeholder values:
//    AZURE_AD_CLIENT_ID="your_azure_ad_application_client_id"
//    AZURE_AD_CLIENT_SECRET="your_azure_ad_client_secret_value"
//    AZURE_AD_TENANT_ID="your_azure_ad_directory_tenant_id"
//    NEXTAUTH_URL="http://localhost:9002" # During development, or your production URL
//    NEXTAUTH_SECRET="generate_a_strong_random_secret_string" 
//    # You can generate a secret using: openssl rand -base64 32
//
// 3. Ensure Redirect URIs in your Azure AD App Registration are correctly configured.
//    For local development with NEXTAUTH_URL="http://localhost:9002", add:
//    - http://localhost:9002/api/auth/callback/azure-ad  (Type: Web)
//
// 4. This file sets up the NextAuth.js handler. To make authentication work across your app:
//    - Wrap your application with <AuthProvider> (from src/components/auth/AuthProvider.tsx)
//      in `src/app/layout.tsx`. This provider uses NextAuth's <SessionProvider>.
//    - You can then use `useSession()`, `signIn()`, `signOut()` in your client components.
//    - For server components, you can use `getServerSession(authOptions)`.

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      // Optional: Configure profile information if needed
      // profile(profile) {
      //   // profile object structure depends on the scopes and claims configured in Azure AD
      //   return {
      //     id: profile.sub, // Typically 'sub' (subject) claim from token
      //     name: profile.name,
      //     email: profile.email,
      //     image: null, // Azure AD by default might not return image, or requires graph API call
      //     // Add custom fields from Azure AD token if necessary
      //     // e.g., roles: profile.roles
      //   };
      // },
    }),
  ],
  // Optional: Add callbacks for session, jwt, etc. if needed for custom logic
  // callbacks: {
  //   async jwt({ token, account, profile }) {
  //     // Persist the OAuth access_token to the token right after signin
  //     if (account) {
  //       token.accessToken = account.access_token;
  //       // You can also add user roles from profile if available
  //       // token.roles = profile?.roles; 
  //     }
  //     return token;
  //   },
  //   async session({ session, token }) {
  //     // Send properties to the client, like an access_token or user roles
  //     session.accessToken = token.accessToken as string | undefined;
  //     // session.user.roles = token.roles as string[] | undefined;
  //     return session;
  //   },
  // },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    // signOut: '/auth/signout', // Optional: Custom sign-out page
    // error: '/auth/error', // Optional: Custom error page (e.g., for auth errors)
    // verifyRequest: '/auth/verify-request', // Optional: For email provider
    // newUser: '/auth/new-user' // Optional: New user (e.g., after sign up)
  },
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
