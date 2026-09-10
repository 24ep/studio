/**
 * NextAuth v5 migration compatibility layer.
 *
 * Code should prefer importing auth helpers from their focused modules where
 * practical. This file preserves the historic "@/lib/auth" public API.
 */

import { auth } from "@/auth";
import { isAzureAdSettingsConfigured } from "@/lib/auth-config-utils";

export type { VerifiedApiToken } from "@/lib/auth-api-token";
export { verifyApiToken } from "@/lib/auth-api-token";
export { requireSessionAndPermission } from "@/lib/auth-route-guards";
export {
  clearUserValidationCache,
  validateUserExists,
  validateUserSession,
} from "@/lib/auth-user-validation";

export const isAzureADConfigured = () => (
  isAzureAdSettingsConfigured({
    clientId: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    tenantId: process.env.AZURE_AD_TENANT_ID,
  })
);

export const authOptions = null;

export async function getServerSession(..._args: unknown[]) {
  return auth();
}
