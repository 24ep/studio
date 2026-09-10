"use client";

import { useEffect, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import { PrivacySupportShell, ContentPanel, StatusPill } from './PrivacySupportShell';

type Release = { version: string; date: string | null; sections: { title: string; items: string[] }[] };

export function ReleaseNotesPage() {
  const [version, setVersion] = useState('');
  const [releases, setReleases] = useState<Release[]>([]);
  useEffect(() => { fetch('/api/privacy-support/releases').then(r => r.json()).then(data => { setVersion(data.version || 'Unknown'); setReleases(data.releases || []); }); }, []);
  return (
    <PrivacySupportShell eyebrow="What’s new" title="App Version & Release Notes" description="Review the version you are using and the employee-relevant improvements delivered with recent releases.">
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ContentPanel className="self-start p-6 lg:sticky lg:top-5">
          <PackageCheck className="h-6 w-6 text-blue-700" /><p className="mt-4 text-xs font-medium text-muted-foreground">Current application version</p><p className="mt-1 text-3xl font-semibold tracking-tight">{version || '…'}</p>
        </ContentPanel>
        <div className="space-y-4">
          {releases.length === 0 && <ContentPanel className="p-8"><h2 className="font-semibold">Version information available</h2><p className="mt-2 text-sm text-muted-foreground">Detailed release notes are not included in this deployment.</p></ContentPanel>}
          {releases.map((release, index) => <ContentPanel key={release.version} className="p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Version {release.version}</h2><div className="flex items-center gap-2">{index === 0 && <StatusPill tone="good">Current</StatusPill>}<span className="text-xs text-muted-foreground">{release.date}</span></div></div><div className="mt-6 space-y-6">{release.sections.filter(section => section.items.length).map(section => <section key={section.title}><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">{section.title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{section.items.map((item, itemIndex) => <li key={itemIndex} className="pl-4 before:-ml-4 before:mr-2 before:text-slate-400 before:content-['—']">{item}</li>)}</ul></section>)}</div></ContentPanel>)}
        </div>
      </div>
    </PrivacySupportShell>
  );
}
