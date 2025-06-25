import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getPool, getMergedUserPermissions } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/auditLog';
// Check if Azure AD is configured
const isAzureADConfigured = () => {
    return process.env.AZURE_AD_CLIENT_ID &&
        process.env.AZURE_AD_CLIENT_SECRET &&
        process.env.AZURE_AD_TENANT_ID &&
        process.env.AZURE_AD_CLIENT_ID !== 'your_azure_ad_application_client_id' &&
        process.env.AZURE_AD_CLIENT_SECRET !== 'your_azure_ad_client_secret_value' &&
        process.env.AZURE_AD_TENANT_ID !== 'your_azure_ad_directory_tenant_id';
};
export const authOptions = {
    providers: [
        // Only add Azure AD provider if properly configured
        ...(isAzureADConfigured() ? [
            AzureADProvider({
                clientId: process.env.AZURE_AD_CLIENT_ID,
                clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
                tenantId: process.env.AZURE_AD_TENANT_ID,
            })
        ] : []),
        // Always include credentials provider for username/password authentication
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                    throw new Error("Please enter both email and password.");
                }
                const client = await getPool().connect();
                try {
                    const result = await client.query('SELECT * FROM "User" WHERE email = $1', [credentials.email]);
                    const user = result.rows[0];
                    console.log('[AUTH DEBUG] User lookup result:', user);
                    if (user && user.password) {
                        const isValid = await bcrypt.compare(credentials.password, user.password);
                        console.log('[AUTH DEBUG] bcrypt.compare result:', isValid);
                        if (isValid) {
                            // Fetch merged permissions (direct + group)
                            const mergedPermissions = await getMergedUserPermissions(user.id);
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
                }
                catch (error) {
                    console.error('[AUTH DEBUG] Authorize error:', error);
                    console.error("Authorize error:", error);
                    return null;
                }
                finally {
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
            console.log('[AUTH DEBUG] JWT callback input:', { token, user, account });
            if (account && user) {
                token.accessToken = account.access_token;
                token.id = user.id;
                token.role = user.role;
                token.modulePermissions = user.modulePermissions;
            }
            // If token.id exists but modulePermissions is missing, fetch merged permissions (for session refreshes)
            if (token.id && !token.modulePermissions) {
                try {
                    token.modulePermissions = await getMergedUserPermissions(token.id);
                }
                catch (e) {
                    token.modulePermissions = [];
                }
            }
            console.log('[AUTH DEBUG] JWT callback output:', token);
            return token;
        },
        async session({ session, token }) {
            console.log('[AUTH DEBUG] Session callback input:', { session, token });
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.modulePermissions = token.modulePermissions;
            }
            console.log('[AUTH DEBUG] Session callback output:', session);
            return session;
        },
        async signIn({ user, account, profile }) {
            var _a, _b, _c;
            // Only handle Azure AD sign-in if Azure AD is configured and this is an Azure AD sign-in
            if (isAzureADConfigured() && (account === null || account === void 0 ? void 0 : account.provider) === 'azure-ad' && (profile === null || profile === void 0 ? void 0 : profile.email)) {
                const client = await getPool().connect();
                try {
                    // Use profile.sub as the unique user ID (OID) if oid is not present
                    const oid = (_b = (_a = profile.oid) !== null && _a !== void 0 ? _a : profile.sub) !== null && _b !== void 0 ? _b : profile.email;
                    const picture = (_c = profile.picture) !== null && _c !== void 0 ? _c : null;
                    // Check if user exists
                    let res = await client.query('SELECT * FROM "User" WHERE email = $1', [profile.email]);
                    let dbUser = res.rows[0];
                    if (!dbUser) {
                        // If not, create a new user
                        await client.query('INSERT INTO "User" (id, name, email, "emailVerified", image, role) VALUES ($1, $2, $3, $4, $5, $6)', [oid, profile.name, profile.email, new Date(), picture, 'Recruiter'] // Default role
                        );
                        await logAudit('AUDIT', `New user '${profile.name}' created via Azure AD SSO.`, 'Auth:SignIn', oid);
                    }
                    // Also create an account entry for the provider
                    res = await client.query('SELECT * FROM "Account" WHERE "provider" = $1 AND "providerAccountId" = $2', [account.provider, account.providerAccountId]);
                    if (res.rows.length === 0) {
                        await client.query('INSERT INTO "Account" ("userId", type, provider, "providerAccountId", access_token, expires_at, scope, token_type, id_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [oid, account.type, account.provider, account.providerAccountId, account.access_token, account.expires_at, account.scope, account.token_type, account.id_token]);
                    }
                }
                catch (err) {
                    console.error("Error during Azure AD sign-in DB operations:", err);
                    return false; // Prevent sign-in on DB error
                }
                finally {
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
