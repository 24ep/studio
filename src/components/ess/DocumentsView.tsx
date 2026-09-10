"use client";

import * as React from 'react';
import { Download, Eye, FileCheck2, FileOutput, FilePlus2, Loader2, LockKeyhole, Search, Sparkles, Upload } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, Section, StatusBadge } from './EssShared';
import type { EssDashboard, EssRow } from './ess-types';
import { dateValue, statusLabel, stringValue } from './ess-types';
import type { DocumentTemplate } from '@/lib/document-templates';
import { sanitizeRichHtml } from '@/lib/security';

type SelfServiceTemplateData = {
  templates: DocumentTemplate[];
  company: { name: string; legalName: string; address: string; taxId: string; hrContact: string; logo: string };
};

const requestTypes = [
  ['employment_certificate', 'Employment certificate'],
  ['salary_certificate', 'Salary certificate'],
  ['visa_support_letter', 'Visa support letter'],
  ['tax_document', 'Tax document'],
  ['other_hr_letter', 'Other HR letter'],
] as const;

export function DocumentsView({
  data,
  submitting,
  mutate,
  upload,
}: {
  data: EssDashboard;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
  upload: (formData: FormData, successMessage: string) => Promise<boolean>;
}) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'payslips' ? 'payslips' : 'library';
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploadCategory, setUploadCategory] = React.useState('personal_uploaded_document');
  const [request, setRequest] = React.useState({
    documentType: 'employment_certificate',
    purpose: '',
    language: 'English',
    deliveryFormat: 'digital',
    additionalDetails: '',
  });
  const [templateData, setTemplateData] = React.useState<SelfServiceTemplateData | null>(null);
  const [templatesLoading, setTemplatesLoading] = React.useState(true);
  React.useEffect(() => {
    fetch('/api/ess/document-templates')
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load templates')))
      .then((value: SelfServiceTemplateData) => setTemplateData(value))
      .catch(() => setTemplateData({ templates: [], company: { name: '', legalName: '', address: '', taxId: '', hrContact: '', logo: '' } }))
      .finally(() => setTemplatesLoading(false));
  }, []);
  const documentRequests = data.requests.filter(item => item.request_type === 'document_request');
  const filtered = data.documents.filter(document => {
    const text = `${document.title || ''} ${document.type || ''} ${document.category || ''}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === 'all' || document.category === category || document.type === category);
  });
  const categories = Array.from(new Set(data.documents.map(item => String(item.category || item.type || 'other'))));

  const submitUpload = async () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.set('file', uploadFile);
    formData.set('title', uploadTitle || uploadFile.name);
    formData.set('type', uploadCategory);
    const ok = await upload(formData, 'Document uploaded securely.');
    if (ok) {
      setUploadFile(null);
      setUploadTitle('');
    }
  };

  const submitRequest = async () => {
    const selected = requestTypes.find(item => item[0] === request.documentType);
    const result = await mutate('/api/ess/requests', 'POST', {
      requestType: 'document_request',
      title: `Request ${selected?.[1] || 'HR document'}`,
      reason: request.purpose,
      values: request,
      originalValues: {},
      saveAsDraft: false,
    }, 'Document request submitted.');
    if (result) setRequest(current => ({ ...current, purpose: '', additionalDetails: '' }));
  };

  return (
    <Tabs defaultValue={initialTab} className="space-y-4">
      <TabsList className="h-auto">
        <TabsTrigger value="library" className="min-h-9">My documents</TabsTrigger>
        <TabsTrigger value="generate" className="min-h-9">Generate a document</TabsTrigger>
        <TabsTrigger value="payslips" className="min-h-9">Payslips</TabsTrigger>
        <TabsTrigger value="request" className="min-h-9">Request a document</TabsTrigger>
        <TabsTrigger value="upload" className="min-h-9">Upload</TabsTrigger>
        <TabsTrigger value="history" className="min-h-9">Request history</TabsTrigger>
      </TabsList>

      <TabsContent value="library">
        <Section title="Secure document center" description="Preview and downloads are permission checked and audited.">
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search documents" placeholder="Search title or category" value={query} onChange={event => setQuery(event.target.value)} /></div>
            <select aria-label="Filter document category" value={category} onChange={event => setCategory(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All categories</option>{categories.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select>
          </div>
          {filtered.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map(document => (
            <DocumentCard key={String(document.id)} document={document} submitting={submitting} mutate={mutate} />
          ))}</div> : <EmptyState title="No documents found" description="Try another filter or request an HR document." />}
        </Section>
      </TabsContent>

      <TabsContent value="generate">
        <Section title="Generate a document instantly" description="Your verified employee details are added automatically. No HR request is needed for these standard documents.">
          {templatesLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : templateData?.templates.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{templateData.templates.map(template => (
            <article key={template.id} className="flex min-h-52 flex-col rounded-md border border-border bg-background p-4 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><FileOutput className="h-4 w-4" /></span>{template.isConfidential ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"><LockKeyhole className="h-3 w-3" />Confidential</span> : <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Instant</span>}</div>
              <h3 className="mt-4 text-sm font-semibold">{template.name}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{template.description}</p>
              <Button className="mt-auto pt-0" size="sm" onClick={() => generateDocument(template, data, templateData.company)}><Sparkles className="mr-2 h-3.5 w-3.5" />Generate now</Button>
            </article>
          ))}</div> : <EmptyState title="No self-service templates available" description="You can still request a custom document from HR." />}
        </Section>
      </TabsContent>

      <TabsContent value="payslips">
        <Section title="Payslips" description="Published payslips are stored with your other employee documents.">
          {data.payslips.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.payslips.map(payslip => (
            <article key={String(payslip.id)} className="flex min-h-40 flex-col rounded-md border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3"><FileCheck2 className="h-5 w-5 text-primary" /><StatusBadge status={payslip.status} /></div>
              <h3 className="mt-4 text-sm font-semibold">Payslip</h3>
              <p className="mt-1 text-xs text-muted-foreground">Published {dateValue(payslip.published_at || payslip.created_at)}</p>
              <div className="mt-auto pt-4">
                {Boolean(payslip.file_path) && <Button asChild size="sm" variant="outline"><a href={`/api/ess/files?kind=payslip&id=${payslip.id}`} target="_blank" rel="noreferrer"><Download className="mr-1 h-3.5 w-3.5" />View or download</a></Button>}
              </div>
            </article>
          ))}</div> : <EmptyState title="No payslips available" description="Published payslips will appear here as payroll documents." />}
        </Section>
      </TabsContent>

      <TabsContent value="request" className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <Section title="Request an HR document" description="Completed digital documents appear in your secure library.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Document type" id="document-type"><select id="document-type" value={request.documentType} onChange={event => setRequest(current => ({ ...current, documentType: event.target.value }))} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm">{requestTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Language" id="document-language"><Input id="document-language" value={request.language} onChange={event => setRequest(current => ({ ...current, language: event.target.value }))} /></Field>
            <Field label="Delivery format" id="document-delivery"><select id="document-delivery" value={request.deliveryFormat} onChange={event => setRequest(current => ({ ...current, deliveryFormat: event.target.value }))} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="digital">Digital</option><option value="printed">Printed</option><option value="both">Both</option></select></Field>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="document-purpose">Purpose</Label><Textarea id="document-purpose" className="min-h-20" value={request.purpose} onChange={event => setRequest(current => ({ ...current, purpose: event.target.value }))} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="document-details">Additional details</Label><Textarea id="document-details" className="min-h-20" value={request.additionalDetails} onChange={event => setRequest(current => ({ ...current, additionalDetails: event.target.value }))} /></div>
            <Button disabled={submitting || !request.purpose.trim()} onClick={submitRequest}><FilePlus2 className="mr-2 h-4 w-4" />Submit request</Button>
          </div>
        </Section>
        <Section title="Source-of-truth links">
          <div className="space-y-2 text-sm">
            <a href="/ess/documents?tab=payslips" className="block rounded-md border border-border p-3 hover:bg-muted"><strong>Payroll documents</strong><span className="mt-0.5 block text-xs text-muted-foreground">Payslips and payroll-generated tax files</span></a>
            <a href="/learning/certificates" className="block rounded-md border border-border p-3 hover:bg-muted"><strong>Learning certificates</strong><span className="mt-0.5 block text-xs text-muted-foreground">Course and learning completion records</span></a>
          </div>
        </Section>
      </TabsContent>

      <TabsContent value="upload">
        <Section title="Upload a personal HR document" description="PDF, Word, image, and spreadsheet files are scanned against the platform upload policy.">
          <div className="mx-auto grid max-w-2xl gap-4">
            <Field label="Document title" id="upload-title"><Input id="upload-title" value={uploadTitle} onChange={event => setUploadTitle(event.target.value)} /></Field>
            <Field label="Category" id="upload-category"><select id="upload-category" value={uploadCategory} onChange={event => setUploadCategory(event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="personal_uploaded_document">Personal uploaded document</option><option value="training_certificate">Training certificate</option><option value="other_hr_document">Other HR document</option></select></Field>
            <label htmlFor="upload-file" className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20 p-5 text-center focus-within:ring-2 focus-within:ring-ring">
              <Upload className="mb-3 h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-semibold">{uploadFile ? uploadFile.name : 'Choose a document'}</span>
              <span className="mt-1 text-xs text-muted-foreground">Maximum size follows the system security policy.</span>
              <Input id="upload-file" type="file" className="sr-only" onChange={event => setUploadFile(event.target.files?.[0] || null)} />
            </label>
            <Button disabled={submitting || !uploadFile} onClick={submitUpload}>Upload securely</Button>
          </div>
        </Section>
      </TabsContent>

      <TabsContent value="history">
        <Section title="Document request history">
          {documentRequests.length ? <div className="divide-y divide-border">{documentRequests.map(item => (
            <div key={String(item.id)} className="flex flex-col justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div><p className="text-sm font-semibold">{stringValue(item.title)}</p><p className="text-xs text-muted-foreground">{stringValue(item.request_id)} · {dateValue(item.created_at)}</p></div><StatusBadge status={item.status} />
            </div>
          ))}</div> : <EmptyState title="No document requests" description="Submitted HR document requests will appear here." />}
        </Section>
      </TabsContent>
    </Tabs>
  );
}

function generateDocument(template: DocumentTemplate, data: EssDashboard, company: SelfServiceTemplateData['company']) {
  const employee = data.employee;
  const values: Record<string, string> = {
    'employee.full_name': employee.legalName || employee.name,
    'employee.first_name': (employee.preferredName || employee.name).split(' ')[0] || '',
    'employee.employee_id': employee.employeeNumber,
    'employee.email': employee.email,
    'employee.phone': employee.phone || employee.workPhone || '',
    'employee.address': stringValue(employee.profile.address || employee.profile.homeAddress, ''),
    'employment.job_title': employee.jobTitle || '',
    'employment.department': employee.department || '',
    'employment.manager_name': employee.managerName || '',
    'employment.start_date': dateValue(employee.hireDate, ''),
    'employment.salary': stringValue(employee.sensitive?.compensation?.salary || employee.sensitive?.compensation?.baseSalary, ''),
    'employment.employment_type': employee.employmentType,
    'company.name': company.name,
    'company.legal_name': company.legalName,
    'company.address': company.address,
    'company.logo': company.logo ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" style="max-height:72px;max-width:220px" />` : '',
    'company.tax_id': company.taxId,
    'company.hr_contact': company.hrContact,
    'document.generated_date': new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date()),
    'document.reference_number': `DOC-${new Date().getFullYear()}-${employee.employeeNumber}`,
  };
  const content = sanitizeRichHtml(template.content).replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => key === 'company.logo' ? values[key] : escapeHtml(values[key] || '—'));
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.opener = null;
  const confidentialityLabel = template.isConfidential ? '<div class="confidentiality">CONFIDENTIAL</div>' : '';
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(template.name)}</title><style>body{font-family:'DM Sans',sans-serif;color:#172033;max-width:760px;margin:56px auto;padding:0 36px;line-height:1.65}h1,h2,h3{font-family:'DM Sans',sans-serif;color:#14213d}p{margin:0 0 1em}.confidentiality{margin-bottom:24px;border:1px solid #991b1b;padding:6px 10px;color:#991b1b;font:700 11px 'DM Sans',sans-serif;letter-spacing:.16em;text-align:center}@media print{body{margin:28px auto}}</style></head><body>${confidentialityLabel}${content}<script>window.onload=()=>window.print()<\/script></body></html>`);
  printWindow.document.close();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character);
}

function DocumentCard({ document, submitting, mutate }: {
  document: EssRow;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  const requiresAck = Boolean(document.requires_acknowledgment && !document.acknowledged_at);
  return (
    <article className="flex min-h-48 flex-col rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3"><FileCheck2 className="h-5 w-5 text-primary" /><StatusBadge status={requiresAck ? 'acknowledgment_required' : document.status} /></div>
      <h3 className="mt-4 line-clamp-2 text-sm font-semibold">{stringValue(document.title)}</h3>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{statusLabel(document.category || document.type)} · v{stringValue(document.version_number, '1')}</p>
      <p className="mt-2 text-xs text-muted-foreground">Issued {dateValue(document.issue_date || document.updated_at)}{document.expires_at ? ` · Expires ${dateValue(document.expires_at)}` : ''}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {Boolean(document.file_path) && <Button asChild size="sm" variant="outline"><a href={`/api/ess/files?kind=document&id=${document.id}`} target="_blank" rel="noreferrer"><Eye className="mr-1 h-3.5 w-3.5" />Preview</a></Button>}
        {Boolean(document.file_path) && <Button asChild size="sm" variant="ghost"><a href={`/api/ess/files?kind=document&id=${document.id}`} download><Download className="mr-1 h-3.5 w-3.5" />Download</a></Button>}
        {requiresAck && <Button size="sm" disabled={submitting} onClick={() => void mutate('/api/ess/documents', 'PATCH', { id: document.id, action: 'acknowledge' }, 'Document acknowledged.')}>Acknowledge</Button>}
      </div>
    </article>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
