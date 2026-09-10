import { describe, expect, it } from 'vitest';

import {
  canUploadAvatarForApplicant,
  type AvatarV1PermissionUser,
} from './avatar-v1-route-permissions';
import { buildAvatarV1UploadResponse } from './avatar-v1-route-response';

function makeUser(overrides: Partial<AvatarV1PermissionUser> = {}): AvatarV1PermissionUser {
  return {
    id: 'user-1',
    role: 'Recruiter',
    ...overrides,
  };
}

describe('avatar-v1-route helpers', () => {
  it('checks global, admin, and own-applicant avatar upload permissions', () => {
    expect(canUploadAvatarForApplicant({
      applicantRecruiterId: 'other-user',
      hasGlobalEditPermission: false,
      hasOwnEditPermission: false,
      user: makeUser({ role: 'Admin' }),
    })).toBe(true);

    expect(canUploadAvatarForApplicant({
      applicantRecruiterId: 'other-user',
      hasGlobalEditPermission: true,
      hasOwnEditPermission: false,
      user: makeUser(),
    })).toBe(true);

    expect(canUploadAvatarForApplicant({
      applicantRecruiterId: 'user-1',
      hasGlobalEditPermission: false,
      hasOwnEditPermission: true,
      user: makeUser(),
    })).toBe(true);

    expect(canUploadAvatarForApplicant({
      applicantRecruiterId: 'other-user',
      hasGlobalEditPermission: false,
      hasOwnEditPermission: true,
      user: makeUser(),
    })).toBe(false);
  });

  it('builds the v1 avatar upload response payload', () => {
    expect(buildAvatarV1UploadResponse({
      applicantId: 'applicant-1',
      applicantName: 'Grace',
      avatarUrl: '/api/secure-file/preview?filePath=avatar',
    })).toEqual({
      message: 'Avatar uploaded successfully',
      avatar_url: '/api/secure-file/preview?filePath=avatar',
      applicant: {
        id: 'applicant-1',
        name: 'Grace',
        avatarUrl: '/api/secure-file/preview?filePath=avatar',
      },
    });
  });
});
