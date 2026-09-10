import { describe, expect, it } from 'vitest';
import {
  buildTransitionUpdateQuery,
  extractTransitionIdFromPathname,
  getTransitionActorLabel,
  getTransitionRouteErrorMessage,
  updateTransitionSchema,
} from './transition-detail-utils';

describe('transition-detail-utils', () => {
  it('extracts transition ids from route pathnames', () => {
    expect(extractTransitionIdFromPathname('/api/transitions/transition-1')).toBe('transition-1');
    expect(extractTransitionIdFromPathname('/api/transitions/transition-1/extra')).toBe('transition-1');
    expect(extractTransitionIdFromPathname('/api/applicants/transition-1')).toBeNull();
  });

  it('builds update queries with stable parameter positions', () => {
    expect(buildTransitionUpdateQuery({ notes: 'Updated' }, 'transition-1')).toEqual({
      query: 'UPDATE "TransitionRecord" SET notes = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
      values: ['Updated', 'transition-1'],
    });

    expect(buildTransitionUpdateQuery({
      notes: null,
      date: '2026-01-01T00:00:00.000Z',
    }, 'transition-1')).toEqual({
      query: 'UPDATE "TransitionRecord" SET notes = $1, "updatedAt" = NOW(), date = $2 WHERE id = $3 RETURNING *',
      values: [null, '2026-01-01T00:00:00.000Z', 'transition-1'],
    });
  });

  it('normalizes actor labels, errors, and update payloads', () => {
    expect(getTransitionActorLabel({ name: 'Ada', email: 'ada@example.com' })).toBe('Ada');
    expect(getTransitionActorLabel({ name: null, email: 'ada@example.com' })).toBe('ada@example.com');
    expect(getTransitionActorLabel(null)).toBe('Unknown');
    expect(getTransitionRouteErrorMessage(new Error('Nope'))).toBe('Nope');
    expect(updateTransitionSchema.safeParse({ date: 'bad' }).success).toBe(false);
  });
});
