export type PolicyDocumentStatus = 'Published' | 'Draft' | 'In review';

export interface PolicyDocument {
  id: string;
  title: string;
  summary: string;
  category: string;
  status: PolicyDocumentStatus;
  updated: string;
  owner: string;
  path: string;
  content: string;
  portals: Array<'Employee portal' | 'Job portal'>;
  tags?: string[];
  externalLinks?: Array<{ label: string; url: string }>;
  versions?: PolicyDocumentVersion[];
}

export interface PolicyDocumentVersion {
  id: string;
  createdAt: string;
  createdBy: string;
  note: string;
  title: string;
  status: PolicyDocumentStatus;
  content: string;
}

export type AppKitPolicyDocument = Partial<Omit<PolicyDocument, 'id'>> & {
  id?: string;
  slug?: string;
  updatedAt?: string;
  sortOrder?: number;
  __appkitId?: string | null;
};

export function normalizePolicyDocument(record: AppKitPolicyDocument): PolicyDocument | null {
  const id = String(record.slug || record.id || record.__appkitId || '').trim();
  const title = String(record.title || '').trim();
  if (!id || !title) return null;

  const allowedStatuses: PolicyDocumentStatus[] = ['Published', 'Draft', 'In review'];
  const status = allowedStatuses.includes(record.status as PolicyDocumentStatus)
    ? record.status as PolicyDocumentStatus
    : 'Draft';
  const portals = Array.isArray(record.portals)
    ? record.portals.filter((portal): portal is PolicyDocument['portals'][number] => portal === 'Employee portal' || portal === 'Job portal')
    : [];

  return {
    id,
    title,
    summary: String(record.summary || ''),
    category: String(record.category || 'General'),
    status,
    updated: String(record.updated || record.updatedAt || ''),
    owner: String(record.owner || ''),
    path: String(record.path || `/policy-documents/${id}`),
    content: String(record.content || ''),
    portals,
    tags: Array.isArray(record.tags) ? record.tags.map(String).filter(Boolean) : [],
    externalLinks: Array.isArray(record.externalLinks)
      ? record.externalLinks.filter((link): link is { label: string; url: string } => Boolean(link && typeof link === 'object' && 'url' in link && 'label' in link))
      : [],
    versions: Array.isArray(record.versions) ? record.versions : [],
  };
}
