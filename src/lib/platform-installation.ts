import { z } from 'zod';

import prisma from '@/lib/prisma';

export const firstAdminSetupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((input) => input.password === input.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export type FirstAdminSetupInput = z.infer<typeof firstAdminSetupSchema>;

export const installationEnvironmentSchema = z.discriminatedUnion('environment', [
  z.object({ environment: z.literal('production') }),
  z.object({
    environment: z.literal('demo'),
    employeeCount: z.coerce.number().int().min(10).max(1000),
    historyMonths: z.coerce.number().int().min(1).max(24),
  }),
]);

export type InstallationEnvironmentInput = z.infer<typeof installationEnvironmentSchema>;

export async function isPlatformSetupRequired() {
  const [adminCount, setupOwner, environmentConfigured] = await Promise.all([
    prisma.user.count({ where: { role: 'Admin', isActive: true } }),
    prisma.systemSetting.findUnique({ where: { key: 'platformInstalledByUserId' }, select: { value: true } }),
    prisma.systemSetting.findUnique({ where: { key: 'installationEnvironmentConfiguredAt' }, select: { value: true } }),
  ]);
  return adminCount === 0 || (Boolean(setupOwner?.value) && !environmentConfigured?.value);
}

export async function getInstallationSetupState() {
  const [adminCount, environment, configuredAt] = await Promise.all([
    prisma.user.count({ where: { role: 'Admin', isActive: true } }),
    prisma.systemSetting.findUnique({ where: { key: 'installationEnvironment' }, select: { value: true } }),
    prisma.systemSetting.findUnique({ where: { key: 'installationEnvironmentConfiguredAt' }, select: { value: true } }),
  ]);
  return {
    adminCreated: adminCount > 0,
    environment: environment?.value === 'demo' || environment?.value === 'production' ? environment.value : null,
    environmentConfigured: Boolean(configuredAt?.value),
  };
}
