import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addUserToRole,
  loadAvailableRoleUsers,
  loadRoleMembers,
  removeUserFromRole,
  updateRoleDetails,
  updateRolePermissions,
} from './unified-role-drawer-api';

function response(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('unified role drawer API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates permissions with the expected payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ permissions: ['USERS_VIEW'] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateRolePermissions({
      roleId: 'role-1',
      permissions: ['USERS_VIEW'],
    })).resolves.toEqual({ permissions: ['USERS_VIEW'] });

    expect(fetchMock).toHaveBeenCalledWith('/api/settings/user-groups/role-1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ permissions: ['USERS_VIEW'] }),
    }));
  });

  it('loads role members and available users from normalized responses', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ users: [{ id: 'user-1' }] }))
      .mockResolvedValueOnce(response([{ id: 'user-2' }])));

    await expect(loadRoleMembers('role-1')).resolves.toEqual([{ id: 'user-1' }]);
    await expect(loadAvailableRoleUsers('ari')).resolves.toEqual([{ id: 'user-2' }]);
  });

  it('updates role details and member mutations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ name: 'Recruiter' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateRoleDetails({
      roleId: 'role-1',
      data: { name: 'Recruiter', description: 'Team', is_default: false },
      permissions: ['USERS_VIEW'],
    })).resolves.toEqual({ name: 'Recruiter' });
    await expect(addUserToRole('role-1', 'user-1')).resolves.toBeUndefined();
    await expect(removeUserFromRole('role-1', 'user-1')).resolves.toBeUndefined();

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'Recruiter',
      description: 'Team',
      is_default: false,
      permissions: ['USERS_VIEW'],
    });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/settings/user-groups/role-1/members');
    expect(fetchMock.mock.calls[2][0]).toBe('/api/settings/user-groups/role-1/members?userId=user-1');
  });

  it('throws server response messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'No permission' }, false)));

    await expect(loadRoleMembers('role-1')).rejects.toThrow('No permission');
  });
});
