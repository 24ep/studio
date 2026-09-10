"use client";

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Search, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';

type SubjectType = 'applicant' | 'employee';
interface Finding { id:string; source_url:string; source_title?:string; publisher?:string; category:string; allegation_status:string; identity_confidence:number; review_status:string; ai_summary?:string; matching_signals?:string[]; }
interface Case { id:string; status:string; use_ai:boolean; ai_status:string; trigger_type:string; sources_checked?:string[]; created_at:string; findings:Finding[]; }
interface Settings { enabled:boolean; aiAllowed:boolean; manualAiDefault:boolean; enabledSources:string[]; braveConfigured:boolean; }

export function ScreeningAction({ subjectType, subjectId, variant='menu' }: { subjectType:SubjectType; subjectId:string; variant?:'menu'|'button' }) {
  const { data: session } = useSession();
  const allowed = hasPermission(session?.user, 'SCREENING_CREATE');
  const [open,setOpen]=React.useState(false);
  if (!allowed) return null;
  const trigger = variant === 'menu' ? <DropdownMenuItem onSelect={event=>{event.preventDefault();setOpen(true)}} className="cursor-pointer"><ShieldCheck className="mr-2 h-4 w-4"/>Run digital footprint scan</DropdownMenuItem> : <Button type="button" variant="outline" size="sm" onClick={()=>setOpen(true)}><ShieldCheck className="mr-2 h-4 w-4"/>Digital footprint</Button>;
  return <><Dialog open={open} onOpenChange={setOpen}>{trigger}<ScreeningDialog subjectType={subjectType} subjectId={subjectId} onClose={()=>setOpen(false)}/></Dialog></>;
}

function ScreeningDialog({subjectType,subjectId,onClose}:{subjectType:SubjectType;subjectId:string;onClose:()=>void}) {
  const { data: session } = useSession();
  const canReview=hasPermission(session?.user,'SCREENING_REVIEW');
  const [cases,setCases]=React.useState<Case[]>([]); const [settings,setSettings]=React.useState<Settings|null>(null);
  const [useAi,setUseAi]=React.useState(false); const [consent,setConsent]=React.useState(false); const [loading,setLoading]=React.useState(true); const [submitting,setSubmitting]=React.useState(false);
  const toast=useToast();
  const toastRef=React.useRef(toast);toastRef.current=toast;
  const load=React.useCallback(async()=>{setLoading(true);try{const response=await fetch(`/api/screening/cases?subjectType=${subjectType}&subjectId=${encodeURIComponent(subjectId)}`,{credentials:'include'});if(!response.ok)throw new Error('Unable to load screening history');const payload=await response.json() as {cases:Case[];settings:Settings};setCases(payload.cases);setSettings(payload.settings);setUseAi(payload.settings.aiAllowed&&payload.settings.manualAiDefault);}catch(error){toastRef.current.errorWithDescription('Screening unavailable',error instanceof Error?error.message:undefined);}finally{setLoading(false)}},[subjectId,subjectType]);
  React.useEffect(()=>{void load()},[load]);
  const run=async()=>{setSubmitting(true);try{if(consent){const consentResponse=await fetch('/api/screening/consent',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({subjectType,subjectId,captureSource:'authorized_user_attestation'})});if(!consentResponse.ok)throw new Error('Unable to record screening consent');}const response=await fetch('/api/screening/cases',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({subjectType,subjectId,useAi})});const payload=await response.json() as {message?:string};if(!response.ok)throw new Error(payload.message||'Unable to queue scan');toast.successWithDescription('Screening queued','Results will appear here when processing completes.');await load();}catch(error){toast.errorWithDescription('Unable to queue scan',error instanceof Error?error.message:undefined);}finally{setSubmitting(false)}};
  const review=async(findingId:string,reviewStatus:string)=>{const response=await fetch(`/api/screening/findings/${findingId}`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewStatus})});if(response.ok)await load();else toast.error('Review update failed');};
  return <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Digital footprint screening</DialogTitle><DialogDescription>Searches permitted public sources only. Results are possible matches for human review and never change employment status automatically.</DialogDescription></DialogHeader>
    {loading?<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div>:<div className="space-y-5">
      <section className="rounded-lg border p-4"><div className="flex items-center justify-between"><div><p className="font-medium">New scan</p><p className="text-xs text-muted-foreground">Sources: {settings?.enabledSources.join(', ')||'None configured'}</p></div>{settings?.braveConfigured?<Badge variant="outline">Search configured</Badge>:<Badge variant="secondary">Search key missing</Badge>}</div>
        <label className="mt-4 flex items-start gap-2 text-sm"><Checkbox checked={consent} onCheckedChange={value=>setConsent(value===true)}/><span>I confirm the person received and accepted the approved screening notice. This creates an auditable consent record.</span></label>
        {settings?.aiAllowed&&<div className="mt-4 flex items-center justify-between rounded-md bg-muted/50 p-3"><div><p className="text-sm font-medium">Use AI</p><p className="text-xs text-muted-foreground">Categorize and summarize collected text; no decision recommendation.</p></div><Switch checked={useAi} onCheckedChange={setUseAi}/></div>}
        <Button className="mt-4" onClick={run} disabled={submitting||!settings?.enabled}>{submitting&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Queue scan</Button>
      </section>
      <section><h3 className="mb-2 text-sm font-semibold">Screening history</h3>{cases.length===0?<p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">No screening cases.</p>:<div className="space-y-3">{cases.map(item=><article key={item.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.status.replace(/_/g,' ')}</Badge><span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()} · {item.trigger_type.replace(/_/g,' ')} · AI {item.ai_status.replace(/_/g,' ')}</span></div>{item.findings?.map(finding=><div key={finding.id} className="mt-3 rounded-md bg-muted/40 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{finding.source_title||finding.category}</p><p className="text-xs text-muted-foreground">{finding.category.replace(/_/g,' ')} · identity {Math.round(Number(finding.identity_confidence)*100)}% · {finding.allegation_status}</p></div><a href={finding.source_url} target="_blank" rel="noreferrer" aria-label="Open public source"><ExternalLink className="h-4 w-4"/></a></div>{finding.ai_summary&&<p className="mt-2 text-sm">{finding.ai_summary}</p>}{canReview&&finding.review_status==='pending'&&<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>review(finding.id,'wrong_person')}>Wrong person</Button><Button size="sm" variant="outline" onClick={()=>review(finding.id,'irrelevant')}>Irrelevant</Button><Button size="sm" variant="outline" onClick={()=>review(finding.id,'disputed')}>Disputed</Button><Button size="sm" onClick={()=>review(finding.id,'confirmed')}>Confirm identity</Button></div>}</div>)}</article>)}</div>}</section>
    </div>}<DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button variant="ghost" onClick={()=>void load()}><Search className="mr-2 h-4 w-4"/>Refresh</Button></DialogFooter></DialogContent>;
}
