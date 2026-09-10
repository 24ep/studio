import { describe, expect, it } from 'vitest';
import {
  buildApplicantDetailResponseData,
  buildApplicantEmployeeSummary,
  buildApplicantDetailSuccessHeaders,
  buildApplicantPositionSummary,
  buildApplicantReadStatusActivity,
  buildApplicantRecruiterSummary,
  buildApplicantSourceSummary,
  buildApplicantUpdatePermissionFlags,
  buildApplicantUpdateResponseData,
  buildApplicantUpdateRequestParts,
  buildApplicantUpdateMutation,
  canAttemptApplicantUpdate,
  fetchApplicantHeadStatus,
  fetchApplicantDetailResponseData,
  fetchApplicantPostUpdateResponseParts,
  getApplicantJobMatchFeatureEnabled,
  getApplicantReadStatus,
  isApplicantQueryTimeoutError,
  isAuthorizedForApplicantDetail,
  isValidApplicantId,
  mapApplicantDetailFetchError,
  mapApplicantUpdateError,
  normalizeApplicantDetailJobMatch,
  normalizeApplicantCustomAttributes,
  parseApplicantLiteParam,
  shouldBroadcastApplicantStatusChange,
  shouldSyncRecruiterAfterPositionChange,
  updateApplicantReadStatus,
  validateApplicantUpdateReferences,
} from './applicant-detail-route-utils';

describe('applicant-detail-route-utils', () => {
  it('validates applicant id and parses lite query params', () => {
    expect(isValidApplicantId('6f992907-3519-4fc5-b65f-5d229bd7c7fa')).toBe(true);
    expect(isValidApplicantId('not-a-uuid')).toBe(false);

    expect(parseApplicantLiteParam(new URL('https://example.test/applicants/1?lite=1'))).toBe(true);
    expect(parseApplicantLiteParam(new URL('https://example.test/applicants/1?lite=true'))).toBe(true);
    expect(parseApplicantLiteParam(new URL('https://example.test/applicants/1?lite=false'))).toBe(false);
  });

  it('builds no-cache applicant detail response headers with a compact etag', () => {
    const headers = buildApplicantDetailSuccessHeaders({ id: 'applicant-1', name: 'Ada' });

    expect(headers).toMatchObject({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    expect(headers.ETag).toMatch(/^"[A-Za-z0-9+/=]{1,8}"$/);
  });

  it('authorizes applicant detail requests by session user before token lookup', async () => {
    let connected = false;

    await expect(isAuthorizedForApplicantDetail({
      applicantId: 'applicant-1',
      userId: 'user-1',
      token: null,
      connectClient: async () => {
        connected = true;
        return {
          query: async () => ({ rows: [] }),
          release: () => undefined,
        };
      },
    })).resolves.toBe(true);

    expect(connected).toBe(false);
  });

  it('authorizes applicant detail requests by valid evaluation token and releases the client', async () => {
    let released = false;
    const queries: Array<{ query: string; values?: unknown[] }> = [];

    await expect(isAuthorizedForApplicantDetail({
      applicantId: 'applicant-1',
      token: 'token-1',
      connectClient: async () => ({
        query: async (query: string, values?: unknown[]) => {
          queries.push({ query, values });
          return { rows: [{ id: 'link-1' }] };
        },
        release: () => {
          released = true;
        },
      }),
    })).resolves.toBe(true);

    expect(queries[0].query).toContain('"ApplicantEvaluationLink"');
    expect(queries[0].values).toEqual(['token-1', 'applicant-1']);
    expect(released).toBe(true);
  });

  it('denies applicant detail token authorization on query errors', async () => {
    let released = false;

    await expect(isAuthorizedForApplicantDetail({
      applicantId: 'applicant-1',
      token: 'bad-token',
      connectClient: async () => ({
        query: async () => {
          throw new Error('database unavailable');
        },
        release: () => {
          released = true;
        },
      }),
    })).resolves.toBe(false);

    expect(released).toBe(true);
  });

  it('maps applicant detail fetch failures to route response payloads', () => {
    expect(mapApplicantDetailFetchError({ code: 'ECONNREFUSED' }, 'applicant-1')).toEqual({
      status: 503,
      body: {
        message: 'Database connection error. Please try again in a moment.',
        error: 'Database connection failed',
        applicantId: 'applicant-1',
      },
    });

    expect(mapApplicantDetailFetchError({ code: '57014' }, 'applicant-1')).toMatchObject({
      status: 408,
      body: { error: 'Database timeout' },
    });

    expect(mapApplicantDetailFetchError(new Error('boom'), 'applicant-1')).toEqual({
      status: 500,
      body: {
        message: 'Error fetching Applicant',
        error: 'boom',
        applicantId: 'applicant-1',
      },
    });
  });

  it('maps applicant update failures to route response payloads', () => {
    expect(mapApplicantUpdateError({
      code: '23503',
      constraint: 'TransitionRecord_positionId_fkey',
      message: 'bad position',
    })).toEqual({
      status: 400,
      body: { message: 'Invalid position reference in transition record' },
    });

    expect(mapApplicantUpdateError({
      code: '23503',
      constraint: 'TransitionRecord_applicantId_fkey',
      message: 'bad applicant',
    })).toEqual({
      status: 400,
      body: { message: 'Invalid Applicant reference in transition record' },
    });

    expect(mapApplicantUpdateError({
      code: '23503',
      constraint: 'Other_fkey',
      message: 'foreign key failed',
    })).toEqual({
      status: 400,
      body: {
        message: 'Foreign key constraint violation',
        error: 'foreign key failed',
      },
    });

    expect(mapApplicantUpdateError(new Error('boom'))).toEqual({
      status: 500,
      body: {
        message: 'Error updating Applicant',
        error: 'boom',
      },
    });
  });

  it('allows applicant updates when any update permission bucket is present', () => {
    expect(canAttemptApplicantUpdate({
      hasBasicEditPermission: true,
      hasSensitiveEditPermission: false,
      hasPipelineUpdatePermission: false,
    })).toBe(true);
    expect(canAttemptApplicantUpdate({
      hasBasicEditPermission: false,
      hasSensitiveEditPermission: true,
      hasPipelineUpdatePermission: false,
    })).toBe(true);
    expect(canAttemptApplicantUpdate({
      hasBasicEditPermission: false,
      hasSensitiveEditPermission: false,
      hasPipelineUpdatePermission: true,
    })).toBe(true);
    expect(canAttemptApplicantUpdate({
      hasBasicEditPermission: false,
      hasSensitiveEditPermission: false,
      hasPipelineUpdatePermission: false,
    })).toBe(false);
  });

  it('builds applicant update permission buckets from the shared permission checker', () => {
    const checkedPermissions: string[][] = [];
    const user = { role: 'Recruiter' };

    const flags = buildApplicantUpdatePermissionFlags(user, (_user, required) => {
      checkedPermissions.push(required);
      return required.includes('APPLICANTS_EDIT_SENSITIVE');
    });

    expect(flags).toEqual({
      hasBasicEditPermission: false,
      hasSensitiveEditPermission: true,
      hasPipelineUpdatePermission: false,
    });
    expect(checkedPermissions).toEqual([
      ['APPLICANTS_EDIT_BASIC', 'APPLICANTS_EDIT_BASIC_OWN'],
      ['APPLICANTS_EDIT_SENSITIVE', 'APPLICANTS_EDIT_SENSITIVE_OWN'],
      ['APPLICANTS_PIPELINE_STAGE_UPDATE', 'APPLICANTS_PIPELINE_STAGE_UPDATE_OWN'],
    ]);
  });

  it('loads applicant job-match feature state with enabled fallback on setting errors', async () => {
    await expect(getApplicantJobMatchFeatureEnabled({
      readSystemSetting: async () => 'false',
    })).resolves.toBe(false);

    await expect(getApplicantJobMatchFeatureEnabled({
      readSystemSetting: async () => 'true',
    })).resolves.toBe(true);

    const error = new Error('settings unavailable');
    const errors: unknown[] = [];
    await expect(getApplicantJobMatchFeatureEnabled({
      readSystemSetting: async () => {
        throw error;
      },
      onError: (settingError) => errors.push(settingError),
    })).resolves.toBe(true);
    expect(errors).toEqual([error]);
  });

  it('checks applicant HEAD existence with a short timeout and query timing', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const timestamps = [1000, 1350];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        return query.startsWith('SELECT 1')
          ? { rows: [{ exists: 1 }] }
          : { rows: [] };
      },
    };

    await expect(fetchApplicantHeadStatus({
      client,
      applicantId: 'applicant-1',
      now: () => timestamps.shift() ?? 1350,
    })).resolves.toEqual({
      exists: true,
      queryTimeMs: 350,
    });

    expect(queries).toEqual([
      { query: 'SET statement_timeout = 5000', values: undefined },
      {
        query: 'SELECT 1 FROM "Applicant" WHERE id = $1::uuid LIMIT 1',
        values: ['applicant-1'],
      },
    ]);
  });

  it('identifies applicant query timeout errors', () => {
    expect(isApplicantQueryTimeoutError({ code: '57014' })).toBe(true);
    expect(isApplicantQueryTimeoutError({ message: 'statement timeout reached' })).toBe(true);
    expect(isApplicantQueryTimeoutError({ code: 'ECONNREFUSED' })).toBe(false);
    expect(isApplicantQueryTimeoutError(null)).toBe(false);
  });

  it('builds a parameterized update mutation for provided fields only', () => {
    const mutation = buildApplicantUpdateMutation({
      name: 'Ada Lovelace',
      email: '',
      phone: undefined,
      fitScore: 0.82,
    }, 'applicant-1');

    expect(mutation.fields).toEqual([
      'name = $1',
      'email = $2',
      '"fitScore" = $3',
      '"updatedAt" = NOW()',
    ]);
    expect(mutation.values).toEqual(['Ada Lovelace', '', 0.82, 'applicant-1']);
    expect(mutation.query).toContain('WHERE id = $4::uuid');
  });

  it('splits applicant update request body into mutation payload and route-only controls', () => {
    expect(buildApplicantUpdateRequestParts({
      name: 'Ada',
      email: 'ada@example.test',
      custom_attributes: { legacy: true },
      customFields: { current: true },
      positionId: 'position-1',
      recruiterId: 'recruiter-1',
      status: 'stage-1',
      transitionNotes: 'Moved after interview',
      isPinned: true,
      isBlacklisted: false,
      isRead: true,
      ignored: 'not used',
    })).toEqual({
      updatePayload: {
        name: 'Ada',
        email: 'ada@example.test',
        phone: undefined,
        expectedSalary: undefined,
        positionId: 'position-1',
        recruiterId: 'recruiter-1',
        fitScore: undefined,
        status: 'stage-1',
        assignmentJustification: undefined,
        parsedData: undefined,
        custom_attributes: { legacy: true },
        customFields: { current: true },
        resumePath: undefined,
        avatarUrl: undefined,
        sourceId: undefined,
        subSource: undefined,
        isPinned: true,
        isBlacklisted: false,
      },
      transitionNotes: 'Moved after interview',
      isRead: true,
    });

    expect(buildApplicantUpdateRequestParts(null)).toMatchObject({
      updatePayload: {},
      transitionNotes: undefined,
      isRead: undefined,
    });
  });

  it('broadcasts applicant status changes only when a new status was requested', () => {
    expect(shouldBroadcastApplicantStatusChange('stage-1', 'stage-2')).toBe(true);
    expect(shouldBroadcastApplicantStatusChange('stage-1', 'stage-1')).toBe(false);
    expect(shouldBroadcastApplicantStatusChange('stage-1', undefined)).toBe(false);
  });

  it('joins assignment justification arrays for the legacy text column', () => {
    const mutation = buildApplicantUpdateMutation({
      assignmentJustification: ['Strong fit', 'Available now'],
    }, 'applicant-1');

    expect(mutation.fields[0]).toBe('"assignmentJustification" = $1');
    expect(mutation.values[0]).toBe('Strong fit\nAvailable now');
  });

  it('prefers customFields over custom_attributes when both are provided', () => {
    const mutation = buildApplicantUpdateMutation({
      custom_attributes: { source: 'legacy' },
      customFields: { source: 'current' },
    }, 'applicant-1');

    expect(mutation.fields[0]).toBe('"customAttributes" = $1');
    expect(mutation.values[0]).toEqual({ source: 'current' });
  });

  it('updates pin timestamps without adding bind params for NOW or NULL', () => {
    const pinned = buildApplicantUpdateMutation({ isPinned: true }, 'applicant-1');
    expect(pinned.fields).toEqual([
      '"isPinned" = $1',
      '"pinnedAt" = NOW()',
      '"updatedAt" = NOW()',
    ]);
    expect(pinned.values).toEqual([true, 'applicant-1']);
    expect(pinned.query).toContain('WHERE id = $2::uuid');

    const unpinned = buildApplicantUpdateMutation({ isPinned: false }, 'applicant-1');
    expect(unpinned.fields).toContain('"pinnedAt" = NULL');
    expect(unpinned.values).toEqual([false, 'applicant-1']);
  });

  it('normalizes applicant custom attributes defensively', () => {
    expect(normalizeApplicantCustomAttributes({ level: 'senior' })).toEqual({ level: 'senior' });
    expect(normalizeApplicantCustomAttributes('{"source":"referral"}')).toEqual({ source: 'referral' });
    expect(normalizeApplicantCustomAttributes('not-json')).toEqual({});
    expect(normalizeApplicantCustomAttributes(['bad'])).toEqual({});
    expect(normalizeApplicantCustomAttributes(null)).toEqual({});
  });

  it('builds read status activity only when the status changes', () => {
    expect(buildApplicantReadStatusActivity(true, false)).toEqual({
      stage: 'READ_STATUS_CHANGED',
      notes: 'Marked as read',
    });
    expect(buildApplicantReadStatusActivity(false, true)).toEqual({
      stage: 'READ_STATUS_CHANGED',
      notes: 'Marked as unread',
    });
    expect(buildApplicantReadStatusActivity(true, undefined)).toEqual({
      stage: 'READ_STATUS_CHANGED',
      notes: 'Marked as read',
    });

    expect(buildApplicantReadStatusActivity(true, true)).toBeNull();
    expect(buildApplicantReadStatusActivity(false, false)).toBeNull();
  });

  it('fetches applicant read status for a specific user', async () => {
    const client = {
      query: async (query: string, values?: unknown[]) => {
        expect(query).toContain('"applicant_read_status"');
        expect(values).toEqual(['applicant-1', 'user-1']);
        return { rows: [{ is_read: false }] };
      },
    };

    await expect(getApplicantReadStatus(client, 'applicant-1', 'user-1')).resolves.toBe(false);
  });

  it('upserts read status and records transition activity when status changes', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        if (query.includes('SELECT "is_read"')) {
          return { rows: [{ is_read: false }] };
        }
        return { rows: [] };
      },
    };

    await expect(updateApplicantReadStatus({
      client,
      applicantId: 'applicant-1',
      userId: 'user-1',
      isRead: true,
    })).resolves.toBe(true);

    expect(queries).toHaveLength(3);
    expect(queries[0].values).toEqual(['applicant-1', 'user-1']);
    expect(queries[1].query).toContain('ON CONFLICT ("applicant_id", "user_id")');
    expect(queries[1].query).toContain('"read_at" = NOW()');
    expect(queries[1].values).toEqual(['applicant-1', 'user-1', true]);
    expect(queries[2].query).toContain('"TransitionRecord"');
    expect(queries[2].values).toEqual([
      'applicant-1',
      'READ_STATUS_CHANGED',
      'Marked as read',
      'user-1',
    ]);
  });

  it('does not write read status transition activity when status is unchanged', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        if (query.includes('SELECT "is_read"')) {
          return { rows: [{ is_read: false }] };
        }
        return { rows: [] };
      },
    };

    await updateApplicantReadStatus({
      client,
      applicantId: 'applicant-1',
      userId: 'user-1',
      isRead: false,
    });

    expect(queries).toHaveLength(2);
    expect(queries[1].query).toContain('"read_at" = NULL');
  });

  it('detects position changes that should trigger recruiter sync', () => {
    expect(shouldSyncRecruiterAfterPositionChange({
      nextPositionId: 'position-2',
      previousPositionId: 'position-1',
      explicitRecruiterId: undefined,
    })).toBe(true);

    expect(shouldSyncRecruiterAfterPositionChange({
      nextPositionId: null,
      previousPositionId: 'position-1',
      explicitRecruiterId: undefined,
    })).toBe(true);

    expect(shouldSyncRecruiterAfterPositionChange({
      nextPositionId: 'position-1',
      previousPositionId: 'position-1',
      explicitRecruiterId: undefined,
    })).toBe(false);

    expect(shouldSyncRecruiterAfterPositionChange({
      nextPositionId: 'position-2',
      previousPositionId: 'position-1',
      explicitRecruiterId: 'recruiter-1',
    })).toBe(false);

    expect(shouldSyncRecruiterAfterPositionChange({
      previousPositionId: 'position-1',
      explicitRecruiterId: undefined,
    })).toBe(false);
  });

  it('validates applicant update reference ids with parameterized lookup queries', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        return { rows: [{ id: 'found' }] };
      },
    };

    await expect(validateApplicantUpdateReferences({
      client,
      positionId: 'position-1',
      recruiterId: 'recruiter-1',
      sourceId: 'source-1',
      status: 'stage-1',
    })).resolves.toEqual({ valid: true });

    expect(queries.map(entry => entry.values)).toEqual([
      ['position-1'],
      ['recruiter-1', 'Recruiter'],
      ['source-1'],
      ['stage-1'],
    ]);
  });

  it('returns specific applicant update reference validation failures', async () => {
    const missingClient = {
      query: async () => ({ rows: [] }),
    };

    await expect(validateApplicantUpdateReferences({
      client: missingClient,
      positionId: 'missing-position',
    })).resolves.toMatchObject({
      valid: false,
      status: 400,
      message: 'Position not found.',
      logMessage: 'Position not found: missing-position',
    });

    await expect(validateApplicantUpdateReferences({
      client: missingClient,
      recruiterId: 'missing-recruiter',
    })).resolves.toMatchObject({
      valid: false,
      status: 400,
      message: 'Recruiter not found or user is not a recruiter.',
      logMessage: 'Recruiter not found or user is not a recruiter: missing-recruiter',
    });

    await expect(validateApplicantUpdateReferences({
      client: missingClient,
      sourceId: 'missing-source',
    })).resolves.toMatchObject({
      valid: false,
      status: 400,
      message: 'Applicant source not found.',
      logMessage: 'Applicant source not found: missing-source',
    });

    await expect(validateApplicantUpdateReferences({
      client: missingClient,
      status: 'missing-stage',
    })).resolves.toMatchObject({
      valid: false,
      status: 400,
      message: 'Invalid status: Status must reference a valid recruitment stage',
    });
  });

  it('wraps applicant update status validation query errors', async () => {
    const error = new Error('database unavailable');
    const client = {
      query: async () => {
        throw error;
      },
    };

    await expect(validateApplicantUpdateReferences({
      client,
      status: 'stage-1',
    })).resolves.toEqual({
      valid: false,
      status: 500,
      message: 'Error validating status',
      logMessage: 'Error validating status:',
      logError: error,
    });
  });

  it('builds applicant detail compatibility summaries and normalized job matches', () => {
    const applicant = {
      positionId: 'position-1',
      positionTitle: 'Engineer',
      positionDepartment: 'Platform',
      recruiterId: 'recruiter-1',
      recruiterName: 'Grace',
      recruiterAvatarUrl: '/grace.png',
      sourceId: 'source-1',
      sourceName: 'Referral',
      sourceDescription: 'Employee referral',
      sourceLogo: '/source.png',
    };

    expect(buildApplicantPositionSummary(applicant)).toEqual({
      title: 'Engineer',
      department: 'Platform',
      companyId: null,
      company: null,
    });
    expect(buildApplicantRecruiterSummary(applicant)).toEqual({
      name: 'Grace',
    });
    expect(buildApplicantRecruiterSummary(applicant, { includeAvatar: true })).toEqual({
      name: 'Grace',
      avatarUrl: '/grace.png',
    });
    expect(buildApplicantSourceSummary(applicant)).toEqual({
      id: 'source-1',
      name: 'Referral',
      description: 'Employee referral',
      logo: '/source.png',
    });
    expect(buildApplicantPositionSummary({})).toBeNull();
    expect(buildApplicantEmployeeSummary({})).toBeNull();
    expect(buildApplicantRecruiterSummary({})).toBeNull();
    expect(buildApplicantSourceSummary({})).toBeNull();

    expect(normalizeApplicantDetailJobMatch({
      id: 'match-1',
      fitScore: null,
      positionTitle: 'Senior Engineer',
    })).toMatchObject({
      id: 'match-1',
      fitScore: null,
      jobTitle: 'Senior Engineer',
      positionTitle: 'Senior Engineer',
    });
  });

  it('builds applicant detail response data with nested compatibility fields', () => {
    const response = buildApplicantDetailResponseData({
      applicant: {
        id: 'applicant-1',
        name: 'Ada',
        fitScore: 87,
        employeeId: 'employee-1',
        employeeNumber: 'EMP-000001',
        positionId: 'position-1',
        positionTitle: 'Engineer',
        positionDepartment: 'Platform',
        recruiterId: 'recruiter-1',
        recruiterName: 'Grace',
        recruiterAvatarUrl: '/grace.png',
        sourceId: 'source-1',
        sourceName: 'Referral',
        sourceDescription: 'Employee referral',
        sourceLogo: '/source.png',
        customAttributes: '{"priority":"high"}',
        expectedSalary: 100000,
      },
      jobMatches: [
        { id: 'match-1', fitScore: 91, positionTitle: 'Senior Engineer' },
        { id: 'match-2', fitScore: null, jobTitle: 'Architect' },
        { id: 'match-3', fitScore: 12 },
      ],
      attachments: [{ id: 'attachment-1' }, { id: 'attachment-2' }],
      userReadStatus: true,
      lite: false,
    });

    expect(response).toMatchObject({
      fitScore: 87,
      isRead: true,
      employee: { id: 'employee-1', employeeNumber: 'EMP-000001' },
      position: { title: 'Engineer', department: 'Platform' },
      recruiter: { name: 'Grace', avatarUrl: '/grace.png' },
      source: {
        id: 'source-1',
        name: 'Referral',
        description: 'Employee referral',
        logo: '/source.png',
      },
      custom_attributes: { priority: 'high' },
      customFields: { priority: 'high' },
      expectedSalary: 100000,
      attachmentHistory: [{ id: 'attachment-1' }, { id: 'attachment-2' }],
      _metadata: {
        totalJobMatches: 3,
        totalAttachments: 2,
        hasMoreJobMatches: true,
        hasMoreAttachments: true,
      },
    });
    expect(response.jobMatches.map(match => ({
      fitScore: match.fitScore,
      jobTitle: match.jobTitle,
      positionTitle: match.positionTitle,
    }))).toEqual([
      { fitScore: 91, jobTitle: 'Senior Engineer', positionTitle: 'Senior Engineer' },
      { fitScore: null, jobTitle: 'Architect', positionTitle: 'Architect' },
      { fitScore: 12, jobTitle: null, positionTitle: null },
    ]);
  });

  it('promotes legacy built-in CV details into applicant detail parsed data', () => {
    const response = buildApplicantDetailResponseData({
      applicant: {
        id: 'applicant-legacy',
        parsedData: {
          built_in_resume_processor: {
            applicant_info: {
              personal_info: { firstname: 'Grace', lastname: 'Hopper' },
              contact_info: { email: 'grace@example.com' },
              experience: [{ company: 'US Navy' }],
            },
          },
        },
      },
      jobMatches: [],
      attachments: [],
      userReadStatus: false,
      lite: false,
    });

    expect(response.parsedData).toMatchObject({
      personal_info: { firstname: 'Grace', lastname: 'Hopper' },
      contact_info: { email: 'grace@example.com' },
      experience: [{ company: 'US Navy' }],
    });
  });

  it('fetches applicant detail response data with related records and read status', async () => {
    const queries: string[] = [];
    const client = {
      query: async (query: string) => {
        queries.push(query);
        if (query.includes('FROM "Applicant" c')) {
          return {
            rows: [{
              id: 'applicant-1',
              name: 'Ada',
              fitScore: 82,
              positionId: 'position-1',
              positionTitle: 'Engineer',
              customAttributes: { priority: 'high' },
            }],
          };
        }
        if (query.includes('FROM "JobMatch"')) {
          return { rows: [{ id: 'match-1', fitScore: 91, positionTitle: 'Senior Engineer' }] };
        }
        if (query.includes('FROM "Attachment"')) {
          return { rows: [{ id: 'attachment-1' }] };
        }
        if (query.includes('"applicant_read_status"')) {
          return { rows: [{ is_read: true }] };
        }
        return { rows: [] };
      },
    };

    await expect(fetchApplicantDetailResponseData({
      client,
      applicantId: 'applicant-1',
      userId: 'user-1',
      lite: false,
      readSystemSetting: async () => 'true',
    })).resolves.toMatchObject({
      found: true,
      responseData: {
        id: 'applicant-1',
        fitScore: 82,
        isRead: true,
        jobMatches: [{ id: 'match-1', fitScore: 91 }],
        attachmentHistory: [{ id: 'attachment-1' }],
      },
    });

    expect(queries.some(query => query.includes('FROM "JobMatch"'))).toBe(true);
    expect(queries.some(query => query.includes('FROM "Attachment"'))).toBe(true);
    expect(queries.some(query => query.includes('"applicant_read_status"'))).toBe(true);
  });

  it('fetches applicant detail in lite mode without optional job matches or attachments', async () => {
    const queries: string[] = [];
    let settingReads = 0;
    const client = {
      query: async (query: string) => {
        queries.push(query);
        if (query.includes('FROM "Applicant" c')) {
          return { rows: [{ id: 'applicant-1', name: 'Ada', fitScore: null }] };
        }
        return { rows: [] };
      },
    };

    await expect(fetchApplicantDetailResponseData({
      client,
      applicantId: 'applicant-1',
      lite: true,
      readSystemSetting: async () => {
        settingReads++;
        return 'true';
      },
    })).resolves.toMatchObject({
      found: true,
      responseData: {
        id: 'applicant-1',
        jobMatches: [],
        attachmentHistory: [],
        _metadata: {
          hasMoreJobMatches: false,
          hasMoreAttachments: false,
        },
      },
    });

    expect(settingReads).toBe(0);
    expect(queries.some(query => query.includes('FROM "JobMatch"'))).toBe(false);
    expect(queries.some(query => query.includes('FROM "Attachment"'))).toBe(false);
  });

  it('returns a not-found applicant detail fetch result', async () => {
    const client = {
      query: async () => ({ rows: [] }),
    };

    await expect(fetchApplicantDetailResponseData({
      client,
      applicantId: 'missing-applicant',
      lite: false,
      readSystemSetting: async () => 'true',
    })).resolves.toEqual({ found: false });
  });

  it('builds applicant update response data with compatibility fields', () => {
    expect(buildApplicantUpdateResponseData({
      applicant: {
        id: 'applicant-1',
        name: 'Ada',
        assignmentJustification: '',
        positionId: 'position-1',
        positionTitle: 'Engineer',
        positionDepartment: 'Platform',
        recruiterId: 'recruiter-1',
        recruiterName: 'Grace',
        sourceId: 'source-1',
        sourceName: 'Referral',
        sourceDescription: 'Employee referral',
        sourceLogo: '/source.png',
      },
      customAttributes: { priority: 'high' },
      jobMatches: [{ id: 'match-1' }],
      attachments: [{ id: 'attachment-1' }],
      userReadStatus: false,
      recruiterSync: { synced: true },
      headcountAssignment: { assigned: true },
    })).toMatchObject({
      id: 'applicant-1',
      assignmentJustification: null,
      customAttributes: { priority: 'high' },
      customFields: { priority: 'high' },
      isRead: false,
      position: { title: 'Engineer', department: 'Platform' },
      recruiter: { name: 'Grace' },
      source: {
        id: 'source-1',
        name: 'Referral',
        description: 'Employee referral',
        logo: '/source.png',
      },
      jobMatches: [{ id: 'match-1' }],
      attachmentHistory: [{ id: 'attachment-1' }],
      recruiterSync: { synced: true },
      headcountAssignment: { assigned: true },
    });
  });

  it('fetches post-update response parts and reuses an already updated read status', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        if (query.includes('FROM "Applicant"')) {
          return {
            rows: [{
              id: 'applicant-1',
              name: 'Ada',
              customAttributes: '{"priority":"high"}',
            }],
          };
        }
        if (query.includes('FROM "JobMatch"')) {
          return { rows: [{ id: 'match-1' }] };
        }
        if (query.includes('FROM "Attachment"')) {
          return { rows: [{ id: 'attachment-1' }] };
        }
        if (query.includes('"applicant_read_status"')) {
          return { rows: [{ is_read: false }] };
        }
        return { rows: [] };
      },
    };

    await expect(fetchApplicantPostUpdateResponseParts({
      client,
      applicantId: 'applicant-1',
      actingUserId: 'user-1',
      isJobMatchEnabled: true,
      newReadStatus: true,
    })).resolves.toMatchObject({
      applicant: { id: 'applicant-1', name: 'Ada' },
      customAttributes: { priority: 'high' },
      jobMatches: [{ id: 'match-1' }],
      attachments: [{ id: 'attachment-1' }],
      userReadStatus: true,
    });

    expect(queries.map(entry => entry.values)).toEqual([
      ['applicant-1'],
      ['applicant-1'],
      ['applicant-1'],
    ]);
    expect(queries.some(entry => entry.query.includes('"applicant_read_status"'))).toBe(false);
  });

  it('fetches post-update read status when it was not already changed', async () => {
    const queries: string[] = [];
    const client = {
      query: async (query: string) => {
        queries.push(query);
        if (query.includes('FROM "Applicant"')) {
          return { rows: [{ id: 'applicant-1', customAttributes: null }] };
        }
        if (query.includes('FROM "Attachment"')) {
          return { rows: [] };
        }
        if (query.includes('"applicant_read_status"')) {
          return { rows: [{ is_read: false }] };
        }
        return { rows: [] };
      },
    };

    await expect(fetchApplicantPostUpdateResponseParts({
      client,
      applicantId: 'applicant-1',
      actingUserId: 'user-1',
      isJobMatchEnabled: false,
    })).resolves.toMatchObject({
      jobMatches: [],
      attachments: [],
      userReadStatus: false,
    });

    expect(queries.some(query => query.includes('FROM "JobMatch"'))).toBe(false);
    expect(queries.some(query => query.includes('"applicant_read_status"'))).toBe(true);
  });

  it('throws when post-update applicant re-fetch cannot find the applicant', async () => {
    const client = {
      query: async () => ({ rows: [] }),
    };

    await expect(fetchApplicantPostUpdateResponseParts({
      client,
      applicantId: 'missing-applicant',
      actingUserId: 'user-1',
      isJobMatchEnabled: true,
    })).rejects.toThrow('Applicant not found after update');
  });
});
