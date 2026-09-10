export interface OutbornOrganizationMembership {
  id: string;
  role: string;
  name?: string;
  slug?: string;
}

export interface OutbornAccountIdentity {
  principal: {
    kind: 'user';
    userId: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
    permissions?: string[];
  };
  organizations: OutbornOrganizationMembership[];
}

export function resolveHriveOrganization(
  organizations: OutbornOrganizationMembership[],
  configuredOrganizationId = process.env.OUTBORN_HRIVE_ORGANIZATION_ID?.trim(),
): OutbornOrganizationMembership {
  if (configuredOrganizationId) {
    const selected = organizations.find(org => org.id === configuredOrganizationId);
    if (!selected) {
      throw new Error('The signed-in Outborn Account user is not a member of OUTBORN_HRIVE_ORGANIZATION_ID.');
    }
    return selected;
  }

  if (organizations.length === 1) return organizations[0]!;
  if (organizations.length === 0) {
    throw new Error('The signed-in Outborn Account user does not belong to an organization.');
  }
  throw new Error('Multiple Outborn organizations are available. Configure OUTBORN_HRIVE_ORGANIZATION_ID for this Hrive deployment.');
}
