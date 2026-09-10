import { describe, expect, it } from 'vitest';
import {
  canHrAct,
  canRequesterReply,
  canRequesterWithdraw,
  isTerminalTicketStatus,
  nextTicketStatus,
  parseServiceDeskIntent,
  supportCreateSchema,
} from './service-desk-contract';

describe('service desk contract', () => {
  it('accepts a valid employee request and trims its copy', () => {
    const result = supportCreateSchema.parse({
      category: 'payroll',
      subject: '  Missing payslip  ',
      description: '  My July payslip is not available.  ',
    });

    expect(result.subject).toBe('Missing payslip');
    expect(result.description).toBe('My July payslip is not available.');
  });

  it('rejects invalid categories and undersized content', () => {
    expect(supportCreateSchema.safeParse({ category: 'secret', subject: 'No', description: 'Short' }).success).toBe(false);
  });

  it('accepts an administrator-defined category key', () => {
    expect(supportCreateSchema.safeParse({
      category: 'employee_relations',
      subject: 'Workplace support request',
      description: 'I would like to discuss a workplace concern privately.',
    }).success).toBe(true);
  });

  it('rejects caller-controlled assignment and unexpected metadata', () => {
    expect(supportCreateSchema.safeParse({
      category: 'general',
      subject: 'A valid subject',
      description: 'A sufficiently detailed support request.',
      assignedToUserId: '54ce3cbb-77be-4c1c-b91a-3e59f58f83f8',
    }).success).toBe(false);
    expect(supportCreateSchema.safeParse({
      category: 'general',
      subject: 'A valid subject',
      description: 'A sufficiently detailed support request.',
      metadata: { isAdmin: true },
    }).success).toBe(false);
  });

  it.each(['submitted', 'in_review', 'action_required'])('allows active lifecycle actions for %s', status => {
    expect(canRequesterReply(status)).toBe(true);
    expect(canRequesterWithdraw(status)).toBe(true);
    expect(canHrAct(status)).toBe(true);
  });

  it.each(['closed', 'resolved', 'withdrawn'])('blocks changes to terminal status %s', status => {
    expect(canRequesterReply(status)).toBe(false);
    expect(canRequesterWithdraw(status)).toBe(false);
    expect(canHrAct(status)).toBe(false);
    expect(isTerminalTicketStatus(status)).toBe(true);
  });

  it('maps actor actions to deterministic workflow states', () => {
    expect(nextTicketStatus('requester', 'reply')).toBe('action_required');
    expect(nextTicketStatus('requester', 'withdraw')).toBe('withdrawn');
    expect(nextTicketStatus('hr', 'reply')).toBe('in_review');
    expect(nextTicketStatus('hr', 'close')).toBe('closed');
  });

  it('only accepts supported compose intents', () => {
    expect(parseServiceDeskIntent('request')).toBe('request');
    expect(parseServiceDeskIntent('question')).toBe('question');
    expect(parseServiceDeskIntent('other')).toBeNull();
  });
});
