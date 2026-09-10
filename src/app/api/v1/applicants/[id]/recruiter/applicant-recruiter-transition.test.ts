import { describe, expect, it, vi } from 'vitest';
import { buildRecruiterChangeNotes } from './applicant-recruiter-transition';

describe('applicant-recruiter-transition', () => {
  it('builds assigned notes with recruiter name', async () => {
    const client = {
      query: vi.fn(async () => ({ rows: [{ name: 'Ada Recruiter' }] })),
      release: vi.fn(),
    };

    await expect(buildRecruiterChangeNotes(client, 'recruiter-1', null))
      .resolves.toBe('Recruiter assigned: Ada Recruiter');
  });

  it('builds unassigned notes and skips unchanged assignments', async () => {
    const client = {
      query: vi.fn(async () => ({ rows: [] })),
      release: vi.fn(),
    };

    await expect(buildRecruiterChangeNotes(client, null, 'recruiter-1'))
      .resolves.toBe('Recruiter unassigned');
    await expect(buildRecruiterChangeNotes(client, 'recruiter-1', 'recruiter-1'))
      .resolves.toBe('');
  });
});
