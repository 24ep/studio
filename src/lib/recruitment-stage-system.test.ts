import { describe, expect, it, vi } from 'vitest';
import { recruitmentStageSeeds } from './appkit-load-seeds';

import {
  ensureRequiredRecruitmentStages,
  isRequiredRecruitmentStageName,
  isSystemRecruitmentStage,
  OPTIONAL_RECRUITMENT_STAGE_NAMES,
  REQUIRED_RECRUITMENT_STAGE_NAMES,
} from './recruitment-stage-system';

describe('recruitment stage system requirements', () => {
  it('defines only the stages required by core business logic as system stages', () => {
    expect(REQUIRED_RECRUITMENT_STAGE_NAMES).toEqual(['Applied', 'Hired', 'Rejected']);
    expect(OPTIONAL_RECRUITMENT_STAGE_NAMES).toContain('Screening');
    expect(isRequiredRecruitmentStageName('Applied')).toBe(true);
    expect(isRequiredRecruitmentStageName('Screening')).toBe(false);
  });

  it('recognizes both API and Prisma system-stage field names', () => {
    expect(isSystemRecruitmentStage({ isSystem: true })).toBe(true);
    expect(isSystemRecruitmentStage({ is_system: true })).toBe(true);
    expect(isSystemRecruitmentStage({ isSystem: false })).toBe(false);
  });

  it('keeps AppKit seeds optional and separate from required stages', () => {
    expect(recruitmentStageSeeds.every(stage => stage.isSystem === false)).toBe(true);
    expect(recruitmentStageSeeds.some(stage => isRequiredRecruitmentStageName(stage.name))).toBe(false);
  });

  it('demotes optional defaults and upserts required stages', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await ensureRequiredRecruitmentStages({ query } as never);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toContain('SET is_system = false');
    expect(query.mock.calls[0][1]).toEqual([OPTIONAL_RECRUITMENT_STAGE_NAMES]);
    expect(query.mock.calls[1][0]).toContain("'Applied'");
    expect(query.mock.calls[1][0]).toContain("'Hired'");
    expect(query.mock.calls[1][0]).toContain("'Rejected'");
    expect(query.mock.calls[1][0]).toContain('ON CONFLICT (name) DO UPDATE');
  });
});
