export type BenefitActor = 'employee' | 'manager';
export type BenefitAction = 'withdraw' | 'resubmit' | 'request_termination' | 'approve' | 'return' | 'reject';

const transitions: Record<BenefitActor, Partial<Record<BenefitAction, Record<string, string>>>> = {
  employee: {
    withdraw: {
      pending_approval: 'withdrawn',
    },
    resubmit: {
      returned_for_revision: 'pending_approval',
      rejected: 'pending_approval',
      withdrawn: 'pending_approval',
    },
    request_termination: {
      active: 'pending_termination',
    },
  },
  manager: {
    approve: {
      pending_approval: 'active',
      pending_termination: 'ended',
    },
    return: {
      pending_approval: 'returned_for_revision',
      pending_termination: 'active',
    },
    reject: {
      pending_approval: 'rejected',
      pending_termination: 'active',
    },
  },
};

export function resolveBenefitTransition(status: string, action: BenefitAction, actor: BenefitActor) {
  const next = transitions[actor]?.[action]?.[status];
  if (!next) throw new Error('Benefit action is no longer available. Refresh and try again.');
  return next;
}

export function employeeBenefitActions(status: string): BenefitAction[] {
  if (status === 'pending_approval') return ['withdraw'];
  if (['returned_for_revision', 'rejected', 'withdrawn'].includes(status)) return ['resubmit'];
  if (status === 'active') return ['request_termination'];
  return [];
}
