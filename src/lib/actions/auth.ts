"use server"

import { signIn } from "@/auth";
import { getCredentialsSignInError } from "./auth-error-utils";
import { isNextRedirectError } from "@/lib/next-redirect-error";

/**
 * Server Action to handle credentials sign-in.
 * This allows us to catch specific error codes (like 2FA required)
 * and pass them back to the client without them being wrapped in CallbackRouteError
 * by the Next-Auth API handler.
 */
export async function signInWithCredentials(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const twoFactorCode = formData.get('twoFactorCode') as string;
    const redirectTo = formData.get('redirectTo') as string || '/';

    try {
        // We call signIn from the server-side auth configuration
        // This will handle the credentials check and session creation
        await signIn("credentials", {
            email,
            password,
            twoFactorCode,
            redirectTo,
            // NOTE: redirect: true is default for server-side signIn
        });

        // If successful, execution will stop here and a redirect will be thrown
    } catch (error) {
        // IMPORTANT: If it's a redirect error (success), we MUST re-throw it!
        if (isNextRedirectError(error)) {
            throw error;
        }

        console.log('[AUTH ACTION] Sign in error:', error);
        return getCredentialsSignInError(error);
    }
}
