import {
  supportCreateSchema,
  type ServiceDeskCategoryOption,
  type SupportCreateInput,
} from '@/lib/service-desk-contract';

export type TalkWithHrCreateResponse = {
  id?: string;
  requestNumber?: string;
  message?: string;
};

export type EmployeeAccessRequestResult =
  | { status: 'sent'; created: TalkWithHrCreateResponse }
  | {
      status: 'handoff';
      detail?: { category: string; message: string; humanRequested: true };
    };

function accessCategory(categories: ServiceDeskCategoryOption[]) {
  return categories.find(option => option.key === 'account_access')
    || categories.find(option => /access|administrator/i.test(`${option.key} ${option.label}`))
    || categories.find(option => option.key === 'general')
    || categories[0];
}

export function buildEmployeeAccessRequest({
  employeeId,
  issue,
  categories,
  reference,
}: {
  employeeId: string;
  issue: string;
  categories: ServiceDeskCategoryOption[];
  reference: string;
}): { payload: SupportCreateInput; fallback: NonNullable<Extract<EmployeeAccessRequestResult, { status: 'handoff' }>['detail']> } | null {
  const category = accessCategory(categories);
  if (!category) return null;

  const description = [
    'I need help accessing an employee record in People.',
    `Employee record ID: ${employeeId}`,
    `Page: /people/${employeeId}`,
    `Issue shown: ${issue}`,
  ].join('\n');
  const parsed = supportCreateSchema.safeParse({
    category: category.key,
    subject: `Access requested for employee record ${reference}`,
    description,
    metadata: { intent: 'request', source: 'employee-record-unavailable', channel: 'human' },
  });
  if (!parsed.success) return null;

  return {
    payload: parsed.data,
    fallback: { category: category.key, message: description, humanRequested: true },
  };
}

export async function sendEmployeeAccessRequest({
  employeeId,
  issue,
  categories,
  reference,
  request = fetch,
}: {
  employeeId: string;
  issue: string;
  categories: ServiceDeskCategoryOption[];
  reference: string;
  request?: typeof fetch;
}): Promise<EmployeeAccessRequestResult> {
  const prepared = buildEmployeeAccessRequest({ employeeId, issue, categories, reference });
  if (!prepared) return { status: 'handoff' };

  try {
    const response = await request('/api/privacy-support/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepared.payload),
    });
    const data = await response.json().catch(() => ({})) as TalkWithHrCreateResponse;
    if (!response.ok || !data.id) return { status: 'handoff', detail: prepared.fallback };
    return { status: 'sent', created: data };
  } catch {
    return { status: 'handoff', detail: prepared.fallback };
  }
}
