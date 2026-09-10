"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CopyPlus, Loader2, LockKeyhole, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RequiredEmailTemplate, EmailTemplateVersion, EmailTemplateVersionStatus } from '@/lib/email-template-catalog';

import { EmailTemplateEditor } from './EmailTemplatesTabParts';
import { EmailTemplateAttributeGuide } from './EmailTemplateAttributeGuide';
import { EmailTemplateAiGenerator } from './EmailTemplateAiGenerator';
import type { EmailTemplatesTabProps } from './email-templates-tab-types';

const ENDPOINT = '/api/settings/email-templates';

export default function EmailTemplatesTab(props: EmailTemplatesTabProps) {
  const {
    emailEditorMode,
    setEmailEditorMode,
    isSaving: isPageSaving,
    isEditorReady,
    setEmailTemplateInterviewInvitation,
    setEmailTemplateInterviewInvitationSubject,
    setEmailTemplateOfferLetter,
    setEmailTemplateOfferLetterSubject,
  } = props;
  const [templates, setTemplates] = useState<RequiredEmailTemplate[]>([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(0);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  useEffect(() => {
    void loadTemplates();
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.code === selectedCode) || templates[0],
    [selectedCode, templates],
  );
  const selectedVersion = selectedTemplate?.versions.find(version => version.version === selectedVersionNumber)
    || selectedTemplate?.versions[0];

  useEffect(() => {
    if (!selectedTemplate) return;
    const version = selectedTemplate.versions.find(item => item.version === selectedVersionNumber) || selectedTemplate.versions[0];
    if (!version) return;
    setSelectedCode(selectedTemplate.code);
    setSelectedVersionNumber(version.version);
    setSubject(version.subject);
    setHtml(version.html);
  }, [selectedCode, selectedTemplate, selectedVersionNumber]);

  async function loadTemplates() {
    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINT);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Failed to load email templates.');
      const loaded = Array.isArray(payload.templates) ? payload.templates as RequiredEmailTemplate[] : [];
      setTemplates(loaded);
      if (loaded[0]) {
        setSelectedCode(current => current || loaded[0].code);
        setSelectedVersionNumber(current => current || loaded[0].versions[0]?.version || 1);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load email templates.');
    } finally {
      setIsLoading(false);
    }
  }

  function selectTemplate(template: RequiredEmailTemplate) {
    setSelectedCode(template.code);
    setSelectedVersionNumber(template.versions[0]?.version || 1);
  }

  function selectVersion(version: EmailTemplateVersion) {
    setSelectedVersionNumber(version.version);
    setSubject(version.subject);
    setHtml(version.html);
  }

  async function saveVersion(status: EmailTemplateVersionStatus, createNew = false) {
    if (!selectedTemplate || !selectedVersion) return;
    if (!subject.trim() || !html.trim()) {
      toast.error('Subject and email body are required.');
      return;
    }

    setIsSavingVersion(true);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: selectedTemplate.code,
          ...(createNew ? {} : { version: selectedVersion.version }),
          subject,
          html,
          text: selectedVersion.text || '',
          variables: selectedVersion.variables || [],
          status,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Failed to save email template version.');

      const returnedTemplate = payload.template as RequiredEmailTemplate;
      setTemplates(current => current.map(template => template.code === returnedTemplate.code ? returnedTemplate : template));
      setSelectedVersionNumber(Number(payload.version.version));
      if (status === 'active' && selectedTemplate.code === 'interview_invitation') {
        setEmailTemplateInterviewInvitationSubject(subject);
        setEmailTemplateInterviewInvitation(html);
      }
      if (status === 'active' && selectedTemplate.code === 'offer_letter') {
        setEmailTemplateOfferLetterSubject(subject);
        setEmailTemplateOfferLetter(html);
      }
      toast.success(createNew ? `Version ${payload.version.version} created as draft.` : status === 'active' ? `Version ${payload.version.version} is now active.` : `Version ${payload.version.version} saved as draft.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save email template version.');
    } finally {
      setIsSavingVersion(false);
    }
  }

  const busy = isPageSaving || isSavingVersion;
  const activeCount = templates.filter(template => template.versions.some(version => version.status === 'active')).length;

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="min-h-0 border-b bg-muted/20 md:border-b-0 md:border-r">
        <ScrollArea className="h-full">
          <div className="p-4">
            <h3 className="text-sm font-semibold">Required by Hrive</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              This deploy-seeded catalog is fixed. Custom template types cannot be added.
            </p>
            <div className="mt-4 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">Active templates</span>
                <span className="text-sm font-semibold tabular-nums">{activeCount}/{templates.length}</span>
              </div>
            </div>

            <nav aria-label="Required email templates" className="mt-4 space-y-2">
              {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
              {templates.map(template => {
                const active = template.versions.some(version => version.status === 'active');
                const selected = selectedTemplate?.code === template.code;
                return (
                  <button
                    key={template.code}
                    type="button"
                    onClick={() => selectTemplate(template)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${selected ? 'border-primary bg-primary/5' : 'bg-background hover:border-primary/40 hover:bg-accent'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {active ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-5">{template.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{template.category} · {template.versions.length} {template.versions.length === 1 ? 'version' : 'versions'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </ScrollArea>
      </aside>

      <ScrollArea className="h-full min-h-0">
        {selectedTemplate && selectedVersion ? (
          <div>
            <header className="border-b bg-muted/20 px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedTemplate.name}</h3>
                    <Badge variant="outline">Required by Hrive</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedTemplate.description}</p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void saveVersion('draft', true)}>
                  <CopyPlus className="mr-2 h-4 w-4" /> Create new version
                </Button>
              </div>
            </header>

            <div className="border-b px-6 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-medium text-muted-foreground">Versions</span>
                {selectedTemplate.versions.map(version => (
                  <Button
                    key={version.version}
                    type="button"
                    size="sm"
                    variant={version.version === selectedVersion.version ? 'default' : 'outline'}
                    onClick={() => selectVersion(version)}
                  >
                    v{version.version}
                    <span className={`ml-2 h-2 w-2 rounded-full ${version.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="ml-1 capitalize">{version.status}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-5 p-6">
              <EmailTemplateAiGenerator
                key={selectedTemplate.code}
                templateCode={selectedTemplate.code}
                disabled={busy}
                onGenerated={generated => {
                  setSubject(generated.subject);
                  setHtml(generated.html);
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="required-email-template-subject">Email subject</Label>
                <Input id="required-email-template-subject" value={subject} onChange={event => setSubject(event.target.value)} disabled={busy} />
              </div>

              <EmailTemplateAttributeGuide templateCode={selectedTemplate.code} />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label>Email body</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={emailEditorMode === 'wysiwyg' ? 'default' : 'outline'} onClick={() => setEmailEditorMode('wysiwyg')} disabled={busy}>WYSIWYG</Button>
                  <Button type="button" size="sm" variant={emailEditorMode === 'html' ? 'default' : 'outline'} onClick={() => setEmailEditorMode('html')} disabled={busy}>HTML</Button>
                </div>
              </div>
              <EmailTemplateEditor emailEditorMode={emailEditorMode} value={html} onChange={setHtml} isSaving={busy} isEditorReady={isEditorReady} />

              <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
                <Button type="button" variant="outline" disabled={busy} onClick={() => void saveVersion('draft')}>
                  {isSavingVersion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save as draft
                </Button>
                <Button type="button" disabled={busy} onClick={() => void saveVersion('active')}>
                  {isSavingVersion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Save and activate
                </Button>
              </div>
              <p className="text-right text-xs text-muted-foreground">Activating this version automatically moves the previously active version to draft.</p>
            </div>
          </div>
        ) : !isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">No required email templates are available.</div>
        ) : null}
      </ScrollArea>
    </div>
  );
}
