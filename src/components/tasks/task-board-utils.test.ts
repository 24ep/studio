import { describe, expect, it } from 'vitest';
import type { Task } from './TaskCard';
import {
  getTaskBoardCardWidth,
  groupTasksByStage,
  sortTaskStages,
} from './task-board-utils';

const task = (id: string, status: string) => ({ id, status }) as Task;

describe('task board utilities', () => {
  it('groups tasks into configured stages only', () => {
    expect(groupTasksByStage([
      task('task-1', 'new'),
      task('task-2', 'done'),
      task('task-3', 'missing'),
    ], [
      { id: 'new', name: 'New' },
      { id: 'done', name: 'Done' },
    ])).toEqual({
      new: [task('task-1', 'new')],
      done: [task('task-2', 'done')],
    });
  });

  it('sorts stages by sort order without mutating input', () => {
    const stages = [
      { id: 'done', name: 'Done', sortOrder: 2 },
      { id: 'new', name: 'New', sortOrder: 1 },
    ];

    expect(sortTaskStages(stages).map(stage => stage.id)).toEqual(['new', 'done']);
    expect(stages.map(stage => stage.id)).toEqual(['done', 'new']);
  });

  it('returns card width settings', () => {
    expect(getTaskBoardCardWidth().className).toBe('w-64');
    expect(getTaskBoardCardWidth({ cardWidth: 'wide' } as never).className).toBe('w-80');
    expect(getTaskBoardCardWidth({ cardWidth: 'custom', customCardWidth: 312 } as never).style).toMatchObject({
      width: '312px',
      minWidth: '312px',
      maxWidth: '312px',
    });
  });
});
