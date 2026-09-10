'use client';

import * as React from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

import type { ExpenseResource, ExpenseSummary } from '@/lib/expenses/contracts';
import { useFinancialDimensions } from '@/hooks/use-financial-dimensions';
import { useDropdownOptions } from '@/hooks/use-dropdown-options';
import { defaultDropdownOptions } from '@/lib/dropdown-option-catalog';
import { cn } from '@/lib/utils';

type FormState = Record<string, string | boolean>;
type ClaimLine = {
  categoryId: string;
  expenseDate: string;
  merchant: string;
  description: string;
  amount: string;
  currency: string;
  exchangeRate: string;
  taxAmount: string;
};

function isoDate(daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

const baseInput = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:ring-blue-950';

function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200', className)}>
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export function ExpenseCreateForm({
  resource,
  summary,
  onClose,
  onCreated,
}: {
  resource: Exclude<ExpenseResource, 'accounting'>;
  summary: ExpenseSummary;
  onClose: () => void;
  onCreated: () => void;
}) {
  const currencies = useDropdownOptions('currencies', defaultDropdownOptions('currencies'));
  const [state, setState] = React.useState<FormState>(() => ({
    title: '',
    purpose: '',
    amount: '',
    currency: 'THB',
    advanceTypeId: summary.advanceTypes[0]?.id || '',
    requiredDate: isoDate(7),
    settlementDueDate: isoDate(30),
    paymentMethod: 'bank_transfer',
    paymentDestination: '',
    periodStart: isoDate(-7),
    periodEnd: isoDate(),
    reimbursementCurrency: 'THB',
    origin: 'Bangkok',
    destination: '',
    departureAt: isoDate(14),
    returnAt: isoDate(16),
    travelType: 'domestic',
    estimatedAmount: '',
    requestedAdvanceAmount: '0',
    justification: '',
    costCenterId: '',
    projectId: '',
    saveAsDraft: false,
  }));
  const [items, setItems] = React.useState<ClaimLine[]>([{
    categoryId: summary.categories[0]?.id || '',
    expenseDate: isoDate(),
    merchant: '',
    description: '',
    amount: '',
    currency: 'THB',
    exchangeRate: '1',
    taxAmount: '0',
  }]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [policyIssues, setPolicyIssues] = React.useState<string[]>([]);
  const dimensions = useFinancialDimensions();
  const selectedCostCenter = dimensions.costCenters.find(item => item.id === state.costCenterId);
  const availableProjects = dimensions.projects.filter(item => !state.costCenterId || !item.costCenterId || item.costCenterId === state.costCenterId);
  const selectedProject = dimensions.projects.find(item => item.id === state.projectId);

  const update = (key: string, value: string | boolean) => setState(current => ({ ...current, [key]: value }));

  async function create(saveAsDraft: boolean) {
    setBusy(true);
    setError(null);
    setPolicyIssues([]);
    const idempotencyKey = `${resource}-${crypto.randomUUID()}`;
    let payload: Record<string, unknown>;
    if (resource === 'advances') {
      payload = {
        title: state.title,
        purpose: state.purpose,
        advanceTypeId: state.advanceTypeId,
        amount: Number(state.amount),
        currency: state.currency,
        requiredDate: state.requiredDate,
        settlementDueDate: state.settlementDueDate,
        paymentMethod: state.paymentMethod,
        paymentDestination: state.paymentDestination,
        costCenterId: state.costCenterId || null,
        projectId: state.projectId || null,
        costCenter: selectedCostCenter?.code || null,
        projectReference: selectedProject?.code || null,
        saveAsDraft,
        idempotencyKey,
      };
    } else if (resource === 'claims') {
      payload = {
        title: state.title,
        businessPurpose: state.purpose,
        claimCurrency: state.currency,
        reimbursementCurrency: state.reimbursementCurrency,
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
        paymentMethod: state.paymentMethod,
        reimbursementDestination: state.paymentDestination,
        costCenterId: state.costCenterId || null,
        projectId: state.projectId || null,
        costCenter: selectedCostCenter?.code || null,
        projectReference: selectedProject?.code || null,
        items: items.map(item => ({
          expenseDate: item.expenseDate,
          categoryId: item.categoryId,
          merchant: item.merchant,
          description: item.description,
          originalAmount: Number(item.amount),
          originalCurrency: item.currency,
          exchangeRate: Number(item.exchangeRate),
          taxAmount: Number(item.taxAmount),
          attendeeCount: 0,
          personalPayment: true,
          billable: false,
          reimbursable: true,
        })),
        saveAsDraft,
        idempotencyKey,
      };
    } else {
      payload = {
        title: state.title,
        businessPurpose: state.purpose,
        justification: state.justification,
        travelType: state.travelType,
        origin: state.origin,
        destinations: [state.destination],
        departureAt: state.departureAt,
        returnAt: state.returnAt,
        estimatedAmount: Number(state.estimatedAmount),
        currency: state.currency,
        requestedAdvanceAmount: Number(state.requestedAdvanceAmount),
        costCenterId: state.costCenterId || null,
        projectId: state.projectId || null,
        costCenter: selectedCostCenter?.code || null,
        projectReference: selectedProject?.code || null,
        visaRequired: state.travelType === 'international',
        insuranceRequired: state.travelType === 'international',
        itinerary: [],
        saveAsDraft,
        idempotencyKey,
      };
    }
    try {
      const response = await fetch(`/api/expenses/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setPolicyIssues(Array.isArray(body.policyResults)
          ? body.policyResults.map((item: { message?: string }) => item.message || 'Policy validation failed.')
          : []);
        throw new Error(body.message || 'The request could not be created.');
      }
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be created.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="expense-create-heading">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">New request</p>
            <h2 id="expense-create-heading" className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">
              {resource === 'advances' ? 'Request an employee advance' : resource === 'claims' ? 'Create an expense claim' : 'Plan business travel'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900">
            Close form
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-5 border-y border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
            <p className="font-semibold">{error}</p>
            {policyIssues.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {policyIssues.map(issue => <li key={issue}>{issue}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label={resource === 'travel' ? 'Trip title' : resource === 'claims' ? 'Claim title' : 'Request title'}>
            <input className={baseInput} value={String(state.title)} onChange={event => update('title', event.target.value)} required placeholder={resource === 'travel' ? 'Customer success summit — Singapore' : 'Regional customer workshop'} />
          </Field>
          {resource === 'advances' && (
            <Field label="Advance type">
              <select className={baseInput} value={String(state.advanceTypeId)} onChange={event => update('advanceTypeId', event.target.value)}>
                {summary.advanceTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </Field>
          )}
          <Field label={resource === 'travel' ? 'Business purpose' : resource === 'claims' ? 'Business purpose' : 'Purpose'} className="md:col-span-2">
            <textarea className={cn(baseInput, 'min-h-24 py-3')} value={String(state.purpose)} onChange={event => update('purpose', event.target.value)} required placeholder="Explain the business outcome this request supports." />
          </Field>
          <Field label="Cost center" hint="Governed by HR Setup and reused in payroll and reporting.">
            <select className={baseInput} value={String(state.costCenterId)} onChange={event => { update('costCenterId', event.target.value); update('projectId', ''); }} disabled={dimensions.loading}>
              <option value="">No cost center</option>
              {dimensions.costCenters.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
            </select>
          </Field>
          <Field label="Project">
            <select className={baseInput} value={String(state.projectId)} onChange={event => update('projectId', event.target.value)} disabled={dimensions.loading}>
              <option value="">No project</option>
              {availableProjects.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
            </select>
          </Field>

          {resource === 'advances' && (
            <>
              <Field label="Requested amount">
                <input className={baseInput} type="number" min="0.01" step="0.01" value={String(state.amount)} onChange={event => update('amount', event.target.value)} required />
              </Field>
              <Field label="Currency">
                <select className={baseInput} value={String(state.currency)} onChange={event => update('currency', event.target.value)}>
                  {currencies.map(currency => <option key={currency.value} value={currency.value}>{currency.label}</option>)}
                </select>
              </Field>
              <Field label="Funds required">
                <input className={baseInput} type="date" value={String(state.requiredDate)} onChange={event => update('requiredDate', event.target.value)} />
              </Field>
              <Field label="Settlement due">
                <input className={baseInput} type="date" value={String(state.settlementDueDate)} onChange={event => update('settlementDueDate', event.target.value)} />
              </Field>
            </>
          )}

          {resource === 'claims' && (
            <>
              <Field label="Claim period starts">
                <input className={baseInput} type="date" value={String(state.periodStart)} onChange={event => update('periodStart', event.target.value)} />
              </Field>
              <Field label="Claim period ends">
                <input className={baseInput} type="date" value={String(state.periodEnd)} onChange={event => update('periodEnd', event.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Expense items</h3>
                  <button type="button" onClick={() => setItems(current => [...current, {
                    categoryId: summary.categories[0]?.id || '',
                    expenseDate: isoDate(),
                    merchant: '',
                    description: '',
                    amount: '',
                    currency: 'THB',
                    exchangeRate: '1',
                    taxAmount: '0',
                  }])} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950">
                    <PlusIcon className="h-4 w-4" /> Add expense
                  </button>
                </div>
                <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {items.map((item, index) => (
                    <div key={index} className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Category">
                        <select className={baseInput} value={item.categoryId} onChange={event => setItems(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, categoryId: event.target.value } : line))}>
                          {summary.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Expense date">
                        <input className={baseInput} type="date" value={item.expenseDate} onChange={event => setItems(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, expenseDate: event.target.value } : line))} />
                      </Field>
                      <Field label="Merchant">
                        <input className={baseInput} value={item.merchant} onChange={event => setItems(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, merchant: event.target.value } : line))} placeholder="Merchant name" />
                      </Field>
                      <Field label="Amount">
                        <input className={baseInput} type="number" min="0.01" step="0.01" value={item.amount} onChange={event => setItems(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, amount: event.target.value } : line))} />
                      </Field>
                      <Field label="Description" className="sm:col-span-2">
                        <input className={baseInput} value={item.description} onChange={event => setItems(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, description: event.target.value } : line))} placeholder="What was purchased?" />
                      </Field>
                      <Field label="Currency / rate">
                        <div className="grid grid-cols-2 gap-2">
                          <select className={baseInput} value={item.currency} onChange={event => setItems(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, currency: event.target.value } : line))}>
                            {currencies.map(currency => <option key={currency.value} value={currency.value}>{currency.label}</option>)}
                          </select>
                          <input aria-label="Exchange rate" className={baseInput} type="number" min="0.000001" step="0.000001" value={item.exchangeRate} onChange={event => setItems(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, exchangeRate: event.target.value } : line))} />
                        </div>
                      </Field>
                      <div className="flex items-end">
                        <button type="button" disabled={items.length === 1} onClick={() => setItems(current => current.filter((_, lineIndex) => lineIndex !== index))} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-300 dark:hover:bg-rose-950">
                          <TrashIcon className="h-4 w-4" /> Delete item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {resource === 'travel' && (
            <>
              <Field label="Travel type">
                <select className={baseInput} value={String(state.travelType)} onChange={event => update('travelType', event.target.value)}>
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </Field>
              <Field label="Origin">
                <input className={baseInput} value={String(state.origin)} onChange={event => update('origin', event.target.value)} />
              </Field>
              <Field label="Destination">
                <input className={baseInput} value={String(state.destination)} onChange={event => update('destination', event.target.value)} placeholder="Singapore" />
              </Field>
              <Field label="Estimated budget">
                <input className={baseInput} type="number" min="0.01" step="0.01" value={String(state.estimatedAmount)} onChange={event => update('estimatedAmount', event.target.value)} />
              </Field>
              <Field label="Departure">
                <input className={baseInput} type="datetime-local" value={`${String(state.departureAt)}T09:00`} onChange={event => update('departureAt', event.target.value)} />
              </Field>
              <Field label="Return">
                <input className={baseInput} type="datetime-local" value={`${String(state.returnAt)}T18:00`} onChange={event => update('returnAt', event.target.value)} />
              </Field>
              <Field label="Requested travel advance">
                <input className={baseInput} type="number" min="0" step="0.01" value={String(state.requestedAdvanceAmount)} onChange={event => update('requestedAdvanceAmount', event.target.value)} />
              </Field>
              <Field label="Currency">
                <select className={baseInput} value={String(state.currency)} onChange={event => update('currency', event.target.value)}>
                  {currencies.map(currency => <option key={currency.value} value={currency.value}>{currency.label}</option>)}
                </select>
              </Field>
              <Field label="Business justification" className="md:col-span-2">
                <textarea className={cn(baseInput, 'min-h-24 py-3')} value={String(state.justification)} onChange={event => update('justification', event.target.value)} placeholder="Why is travel the right way to achieve this outcome?" />
              </Field>
            </>
          )}

          {resource !== 'travel' && (
            <>
              <Field label={resource === 'claims' ? 'Reimbursement method' : 'Payment method'}>
                <select className={baseInput} value={String(state.paymentMethod)} onChange={event => update('paymentMethod', event.target.value)}>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="payroll">Payroll</option>
                  <option value="accounts_payable">Accounts payable</option>
                  {resource === 'advances' && <option value="cash">Cash</option>}
                </select>
              </Field>
              <Field label={resource === 'claims' ? 'Reimbursement destination' : 'Payment destination'} hint="Only a masked reference is shown after approval.">
                <input className={baseInput} value={String(state.paymentDestination)} onChange={event => update('paymentDestination', event.target.value)} placeholder="Payroll bank account ending 4821" />
              </Field>
            </>
          )}
        </div>

        <div className="sticky bottom-0 z-10 mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-950/95">
          <button type="button" disabled={busy} onClick={() => create(true)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {busy ? 'Saving your request…' : 'Save draft'}
          </button>
          <button type="button" disabled={busy} onClick={() => create(false)} className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            {busy ? 'Checking policy…' : 'Send for review'}
          </button>
        </div>
      </div>
    </section>
  );
}
