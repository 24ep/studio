import { describe, expect, it } from 'vitest';

import { buildAuthDebugResponse, type AuthDebugEnv } from './auth-debug-config-utils';

function buildEnv(overrides: Partial<AuthDebugEnv> = {}): AuthDebugEnv {
  return {
    NEXTAUTH_SECRET: 'a'.repeat(32),
    NEXTAUTH_URL: 'https://studio.example.com',
    AZURE_AD_CLIENT_ID: 'client-id-12345678901234567890',
    AZURE_AD_CLIENT_SECRET: 'client-secret',
    AZURE_AD_TENANT_ID: 'tenant-id',
    NODE_ENV: 'test',
    ...overrides,
  };
}

describe('auth debug config utils', () => {
  it('builds a valid debug response without exposing secret characters', () => {
    const response = buildAuthDebugResponse(buildEnv(), '2026-01-01T00:00:00.000Z');

    expect(response.valid).toBe(true);
    expect(response.issues).toEqual([]);
    expect(response.config.secretLength).toBe(32);
    expect(response.config.secretPreview).toBe('[set: 32 characters]');
    expect(response.config.azureAd).toMatchObject({
      configured: true,
      expectedRedirectUri: 'https://studio.example.com/api/auth/callback/azure-ad',
      clientId: 'client-id-1234567890...',
    });
    expect(response.azureAdSetupInstructions?.step1).toBe('Go to Azure Portal -> App Registrations -> Your App');
  });

  it('reports missing and placeholder NextAuth settings', () => {
    const response = buildAuthDebugResponse(buildEnv({
      NEXTAUTH_SECRET: 'secret',
      NEXTAUTH_URL: undefined,
      AZURE_AD_CLIENT_ID: undefined,
      AZURE_AD_CLIENT_SECRET: undefined,
      AZURE_AD_TENANT_ID: undefined,
    }));

    expect(response.valid).toBe(false);
    expect(response.config.secretPreview).toBe('[set: 6 characters]');
    expect(response.issues).toEqual(expect.arrayContaining([
      'NEXTAUTH_URL is not set',
      'NEXTAUTH_SECRET is set to a placeholder value',
      'NEXTAUTH_SECRET is too short (should be at least 32 characters)',
    ]));
    expect(response.azureAdSetupInstructions).toBeNull();
  });

  it('reports incomplete Azure AD setup when any Azure setting is present', () => {
    const response = buildAuthDebugResponse(buildEnv({
      AZURE_AD_CLIENT_ID: 'client-id',
      AZURE_AD_CLIENT_SECRET: undefined,
      AZURE_AD_TENANT_ID: undefined,
    }));

    expect(response.config.azureAd.configured).toBe(false);
    expect(response.issues).toEqual(expect.arrayContaining([
      'AZURE_AD_CLIENT_SECRET is not set',
      'AZURE_AD_TENANT_ID is not set',
    ]));
  });
});
