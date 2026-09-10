import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getApplicantCommentErrorMessage,
  getApplicantCommentMutationFailureResponse,
  warnForSlowApplicantCommentsQuery,
} from './applicant-comments-route-utils';

async function readResponseMessage(response: Response) {
  return {
    status: response.status,
    body: JSON.parse(await response.text()) as { message?: string },
  };
}

describe('applicant comments route utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps edit and delete mutation failures to route responses', async () => {
    await expect(readResponseMessage(getApplicantCommentMutationFailureResponse('not_found', 'edit'))).resolves.toEqual({
      status: 404,
      body: { message: 'Comment not found' },
    });

    await expect(readResponseMessage(getApplicantCommentMutationFailureResponse('forbidden', 'delete'))).resolves.toEqual({
      status: 403,
      body: { message: 'Forbidden: Only the author can delete this comment.' },
    });
  });

  it('normalizes unknown error values', () => {
    expect(getApplicantCommentErrorMessage(new Error('boom'))).toBe('boom');
    expect(getApplicantCommentErrorMessage('plain failure')).toBe('plain failure');
  });

  it('warns only for slow comment queries', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    warnForSlowApplicantCommentsQuery(1000, 'applicant-1', 3999);
    expect(warn).not.toHaveBeenCalled();

    warnForSlowApplicantCommentsQuery(1000, 'applicant-1', 4001);
    expect(warn).toHaveBeenCalledWith('[PERF WARNING] Slow comments query: 3001ms for Applicant applicant-1');
  });
});
