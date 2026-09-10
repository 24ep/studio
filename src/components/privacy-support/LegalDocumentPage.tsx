"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrivacySupportShell, ContentPanel, StatusPill } from './PrivacySupportShell';

type Document = {
  id: string; title: string; version: string; content: string;
  effectiveAt?: string | null; publishedAt?: string | null; acknowledgedAt?: string | null;
};

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-zinc-300">
      {content.split(/\n+/).filter(Boolean).map((line, index) => {
        if (line.startsWith('# ')) return <h2 key={index} className="pt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={index} className="pt-5 text-lg font-semibold text-slate-950 dark:text-white">{line.slice(3)}</h3>;
        if (line.startsWith('- ')) return <p key={index} className="pl-4 before:mr-2 before:content-['•']">{line.slice(2)}</p>;
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

export function LegalDocumentPage({ type }: { type: 'privacy_policy' | 'terms_of_service' }) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const isPrivacy = type === 'privacy_policy';
  useEffect(() => {
    fetch(`/api/privacy-support/legal/${type}`).then(response => response.json()).then(data => {
      setDocument(data.document || null);
      setAcknowledged(Boolean(data.document?.acknowledgedAt));
    }).finally(() => setLoading(false));
  }, [type]);

  async function acknowledge() {
    const response = await fetch(`/api/privacy-support/legal/${type}`, { method: 'POST' });
    if (response.ok) setAcknowledged(true);
  }

  return (
    <PrivacySupportShell
      eyebrow="Legal & privacy"
      title={isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
      description={isPrivacy ? 'How your organization handles personal information within hrive.' : 'The responsibilities and acceptable-use conditions for this employee platform.'}
    >
      {loading ? (
        <ContentPanel className="p-10 text-sm text-muted-foreground" aria-busy="true">Loading the current document…</ContentPanel>
      ) : !document ? (
        <ContentPanel className="p-10">
          <h2 className="text-lg font-semibold">No published document yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">An administrator must complete legal review and publish this document before it becomes available.</p>
          <Button asChild variant="outline" className="mt-5"><Link href="/service-desk">Open Service Desk</Link></Button>
        </ContentPanel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <ContentPanel className="p-6 sm:p-9">
            <MarkdownContent content={document.content} />
          </ContentPanel>
          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <ContentPanel className="p-5">
              <div className="flex items-center justify-between gap-2">
                <StatusPill>Version {document.version}</StatusPill>
                {acknowledged && <StatusPill tone="good"><Check className="mr-1 h-3 w-3" />Acknowledged</StatusPill>}
              </div>
              <dl className="mt-5 space-y-3 text-xs">
                <div><dt className="text-muted-foreground">Effective</dt><dd className="mt-1 font-medium">{document.effectiveAt ? new Date(document.effectiveAt).toLocaleDateString() : 'On publication'}</dd></div>
                <div><dt className="text-muted-foreground">Published</dt><dd className="mt-1 font-medium">{document.publishedAt ? new Date(document.publishedAt).toLocaleDateString() : 'Current'}</dd></div>
              </dl>
              {!acknowledged && <Button className="mt-5 w-full" onClick={acknowledge}>Acknowledge version</Button>}
              <Button variant="outline" className="mt-2 w-full" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
              <Button variant="ghost" className="mt-1 w-full" onClick={() => {
                const url = URL.createObjectURL(new Blob([document.content], { type: 'text/plain' }));
                const link = window.document.createElement('a'); link.href = url; link.download = `${type}-${document.version}.txt`; link.click(); URL.revokeObjectURL(url);
              }}><Download className="mr-2 h-4 w-4" />Download text</Button>
            </ContentPanel>
          </aside>
        </div>
      )}
    </PrivacySupportShell>
  );
}
