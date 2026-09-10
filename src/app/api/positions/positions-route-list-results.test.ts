import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getApplicantStatsByPositionId } from './positions-route-applicant-stats';

const queryMock = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('getApplicantStatsByPositionId', () => {
  beforeEach(() => {
    queryMock.mockReset();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('preserves applied counts when the optional job-match query fails', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ position_id: '00000000-0000-0000-0000-000000000001', total_applied: '3' }],
      })
      .mockRejectedValueOnce(new Error('JobMatch schema is unavailable'));

    const stats = await getApplicantStatsByPositionId(
      ['00000000-0000-0000-0000-000000000001'],
      true,
      queryMock,
    );

    expect(stats.get('00000000-0000-0000-0000-000000000001')).toEqual({
      totalApplied: 3,
      appliedStatusCount: 3,
      totalMatching: 0,
    });
  });

  it('returns independent applied and matching counts for every position', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ position_id: '00000000-0000-0000-0000-000000000001', total_applied: 2 }],
      })
      .mockResolvedValueOnce({
        rows: [{ position_id: '00000000-0000-0000-0000-000000000002', total_matching: '4' }],
      });

    const stats = await getApplicantStatsByPositionId(
      [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      ],
      true,
      queryMock,
    );

    expect(Array.from(stats.values())).toEqual([
      { totalApplied: 2, appliedStatusCount: 2, totalMatching: 0 },
      { totalApplied: 0, appliedStatusCount: 0, totalMatching: 4 },
    ]);
  });
});
