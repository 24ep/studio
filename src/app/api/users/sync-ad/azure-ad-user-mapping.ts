import type { AzureAdGraphUser } from './azure-ad-graph';
import type { AzureAdUserSyncData } from './azure-ad-sync-types';

export function buildAzureAdUserDataMap(adUsers: AzureAdGraphUser[]) {
  const userDataMap = new Map<string, AzureAdUserSyncData>();

  for (const adUser of adUsers) {
    const email = adUser.mail || adUser.userPrincipalName;
    if (!email || !adUser.id) {
      continue;
    }

    userDataMap.set(email, {
      email,
      name: adUser.displayName || email.split('@')[0],
      azureOid: adUser.id,
      department: adUser.department || null,
      jobTitle: adUser.jobTitle || null,
      officeLocation: adUser.officeLocation || null,
      employeeId: adUser.employeeId || null,
      companyName: adUser.companyName || null,
      employeeType: adUser.employeeType || null,
      hireDate: adUser.employeeHireDate ? new Date(adUser.employeeHireDate) : null,
      manager: adUser.manager?.displayName || null,
      managerEmail: adUser.manager?.mail || null,
      samAccountName: adUser.onPremisesSamAccountName || null,
      contactInfo: buildContactInfo(adUser),
      accountEnabled: adUser.accountEnabled !== false,
    });
  }

  return userDataMap;
}

export function getAzureAdDepartments(userDataMap: Map<string, AzureAdUserSyncData>) {
  const departments = new Set<string>();

  for (const user of userDataMap.values()) {
    if (user.department) {
      departments.add(user.department);
    }
  }

  return Array.from(departments);
}

function buildContactInfo(adUser: AzureAdGraphUser): AzureAdUserSyncData['contactInfo'] {
  return {
    streetAddress: adUser.streetAddress || null,
    city: adUser.city || null,
    stateOrProvince: adUser.state || null,
    postalCode: adUser.postalCode || null,
    country: adUser.country || null,
    businessPhone: adUser.businessPhones?.[0] || null,
    mobilePhone: adUser.mobilePhone || null,
    otherEmails: adUser.otherMails || [],
  };
}
