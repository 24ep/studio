import { describe, expect, it, vi } from 'vitest';

import {
  appendCommentFilesWithLabels,
  buildCombinedApplicantActivities,
  createCommentAttachmentPreview,
  createOptimisticApplicantComment,
  filterCombinedApplicantActivities,
  getApplicantActivityAuthorName,
  getApplicantCommentAttachments,
  getCommentSubmitErrorMessage,
  getCombinedApplicantActivityViewState,
  getOriginalCommentId,
} from './applicant-comments-utils';

function makeFile(name: string) {
  return new File(['content'], name, { type: 'text/plain' });
}

describe('applicant comments utilities', () => {
  it('combines comments, activity logs, and reminders in newest-first order', () => {
    const activities = buildCombinedApplicantActivities({
      comments: [
        { id: '1', content: 'Comment', type: 'comment', createdAt: '2026-01-02T00:00:00Z', attachments: 'bad' },
        { id: '2', content: 'Remark', type: 'remark', createdAt: '2026-01-04T00:00:00Z' },
      ],
      logs: [
        { id: 'log-comment', action: 'Comment added', time: '2026-01-05T00:00:00Z' },
        {
          id: 'log-1',
          action: 'Status changed',
          user: 'System',
          time: '2026-01-01T00:00:00Z',
          attachments: [{ fileName: 'resume.pdf', url: '/resume.pdf', label: 'resume' }],
        },
      ],
      reminders: [
        { id: 'reminder-1', title: 'Follow up', user: { name: 'Ari' }, reminderDate: '2026-01-03T00:00:00Z' },
      ],
    });

    expect(activities.map(activity => activity.id)).toEqual([
      'comment-2',
      'reminder-reminder-1',
      'comment-1',
      'activity-log-1',
    ]);
    expect(activities[2].attachments).toEqual([]);
    expect(activities[3].attachments).toEqual([
      { fileName: 'resume.pdf', url: '/resume.pdf', label: 'resume', applicantId: '' },
    ]);
  });

  it('filters combined activities by tab', () => {
    const activities = buildCombinedApplicantActivities({
      comments: [
        { id: 'comment', type: 'comment' },
        { id: 'remark', type: 'remark' },
      ],
      logs: [{ id: 'activity', action: 'Moved' }],
      reminders: [{ id: 'reminder', title: 'Call' }],
    });

    expect(filterCombinedApplicantActivities(activities, 'comment').map(item => item.rawType)).toEqual(['comment']);
    expect(filterCombinedApplicantActivities(activities, 'remark').map(item => item.rawType)).toEqual(['remark', 'reminder']);
    expect(filterCombinedApplicantActivities(activities, 'activity').map(item => item.rawType)).toEqual(['activity', 'reminder']);
  });

  it('computes visible activity state and load-more availability', () => {
    const activities = buildCombinedApplicantActivities({
      comments: [
        { id: '1', type: 'comment', createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', type: 'comment', createdAt: '2026-01-02T00:00:00Z' },
      ],
    });

    expect(getCombinedApplicantActivityViewState({
      activities,
      activeSubTab: 'comment',
      displayedItems: 1,
      hasMoreComments: false,
      hasMoreActivities: false,
    })).toMatchObject({
      combinedActivities: [activities[0]],
      hasMoreItems: true,
    });

    expect(getCombinedApplicantActivityViewState({
      activities: [],
      activeSubTab: 'activity',
      displayedItems: 5,
      hasMoreComments: true,
      hasMoreActivities: false,
    }).hasMoreItems).toBe(false);
  });

  it('creates attachment preview metadata', () => {
    expect(createCommentAttachmentPreview({
      fileName: 'resume.pdf',
      url: '/file',
      label: 'Resume',
      updatedAt: '2026-01-01',
      fileSize: 123,
      filePath: '/path',
    }, 'applicant-1')).toEqual({
      fileName: 'resume.pdf',
      url: '/file',
      label: 'Resume',
      updatedAt: '2026-01-01',
      fileSize: 123,
      filePath: '/path',
      applicantId: 'applicant-1',
    });
  });

  it('normalizes author labels and comment attachment arrays for timeline rows', () => {
    expect(getApplicantActivityAuthorName({
      id: 'comment-1',
      type: 'comment',
      author: { name: 'Ada' },
    })).toBe('Ada');
    expect(getApplicantActivityAuthorName({
      id: 'comment-2',
      type: 'comment',
      author: 'Grace',
    })).toBe('Grace');
    expect(getApplicantActivityAuthorName({
      id: 'activity-1',
      type: 'activity',
    })).toBe('Unknown');

    const attachments = [{ fileName: 'resume.pdf', url: '/resume.pdf' }];
    expect(getApplicantCommentAttachments({
      id: 'comment-3',
      type: 'comment',
      attachments,
    })).toBe(attachments);
    expect(getApplicantCommentAttachments({
      id: 'comment-4',
      type: 'comment',
    })).toEqual([]);
  });

  it('appends files with default labels', () => {
    const first = makeFile('first.txt');
    const second = makeFile('second.txt');

    expect(appendCommentFilesWithLabels([first], ['resume'], [second])).toEqual({
      files: [first, second],
      labels: ['resume', 'other'],
    });
  });

  it('creates optimistic comments and extracts original ids', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    const file = makeFile('resume.pdf');

    expect(createOptimisticApplicantComment({
      content: 'Hello',
      channel: 'remark',
      files: [file],
      labels: ['resume'],
      now: new Date('2026-01-01T00:00:00Z'),
    })).toEqual({
      id: 'temp-1767225600000',
      content: 'Hello',
      type: 'remark',
      rawType: 'remark',
      author: { name: 'You' },
      createdAt: '2026-01-01T00:00:00.000Z',
      attachments: [{
        id: 'temp-attachment-1767225600000-0',
        fileName: 'resume.pdf',
        label: 'resume',
        url: 'blob:preview',
      }],
    });
    expect(getOriginalCommentId('comment-123')).toBe('123');

    createObjectUrl.mockRestore();
  });

  it('maps common comment submit failures to helpful messages', () => {
    expect(getCommentSubmitErrorMessage(new Error('MinIO bucket unavailable')))
      .toBe('File storage service is not available. Please try again later or contact support.');
    expect(getCommentSubmitErrorMessage(new Error('Unauthorized 401')))
      .toBe('Your session has expired. Please refresh the page and try again.');
    expect(getCommentSubmitErrorMessage(new Error('Internal server error')))
      .toBe('Server error occurred. Please try again later.');
    expect(getCommentSubmitErrorMessage(new Error('Custom failure'))).toBe('Custom failure');
  });
});
