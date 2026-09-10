"use client";

import * as React from 'react';
import { BrainCircuit, Database, KeyRound, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const KEYS = ['screeningEnabled','screeningAutoApplicantEnabled','screeningAiAllowed','screeningManualAiDefault','screeningAutomaticAiDefault','screeningEnabledSources','screeningMaxQueries','screeningMaxResultsPerQuery','screeningMonthlyQueryLimit','screeningRetentionDays','screeningIdentityThreshold','screeningBraveApiKey'] as const;
type Values = Record<(typeof KEYS)[number], string>;
const DEFAULTS: Values = { screeningEnabled:'false', screeningAutoApplicantEnabled:'false', screeningAiAllowed:'false', screeningManualAiDefault:'false', screeningAutomaticAiDefault:'false', screeningEnabledSources:'brave,gdelt,un,ofac,uk,thai_sec', screeningMaxQueries:'5', screeningMaxResultsPerQuery:'10', screeningMonthlyQueryLimit:'1000', screeningRetentionDays:'180', screeningIdentityThreshold:'0.8', screeningBraveApiKey:'' };
const SOURCES = [
  { id:'brave', label:'Brave Search', description:'Public web and indexed social discovery. Requires an API key.' },
  { id:'gdelt', label:'GDELT', description:'Multilingual public news discovery. No key required.' },
  { id:'un', label:'UN sanctions', description:'UN consolidated sanctions data. No key required.' },
  { id:'ofac', label:'OFAC sanctions', description:'US Treasury SDN data. No key required.' },
  { id:'uk', label:'UK sanctions', description:'UK Sanctions List data. No key required.' },
  { id:'thai_sec', label:'Thai SEC enforcement', description:'Approved public enforcement search. No key required.' },
] as const;

export default function DigitalFootprintSettingsTab() {
  const [values, setValues] = React.useState<Values>(DEFAULTS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [braveConfigured, setBraveConfigured] = React.useState(false);
  const [braveKeyChanged, setBraveKeyChanged] = React.useState(false);
  const toast = useToast();
  const toastRef = React.useRef(toast); toastRef.current = toast;

  React.useEffect(() => { void (async () => {
    try {
      const response = await fetch(`/api/settings/system-settings?keys=${KEYS.join(',')}`, { credentials:'include' });
      const payload = await response.json() as Partial<Values>;
      setValues({ ...DEFAULTS, ...payload, screeningBraveApiKey:'' });
      setBraveConfigured(Boolean(payload.screeningBraveApiKey));
    } catch { toastRef.current.error('Unable to load screening settings'); }
    finally { setLoading(false); }
  })(); }, []);

  const toggle = (key: keyof Values) => setValues(current => ({ ...current, [key]:current[key] === 'true' ? 'false' : 'true' }));
  const toggleSource = (source: string) => setValues(current => {
    const enabled = new Set(current.screeningEnabledSources.split(',').filter(Boolean));
    if (enabled.has(source)) enabled.delete(source); else enabled.add(source);
    return { ...current, screeningEnabledSources:SOURCES.map(item => item.id).filter(id => enabled.has(id)).join(',') };
  });
  const save = async () => {
    setSaving(true);
    try {
      const keys = KEYS.filter(key => key !== 'screeningBraveApiKey' || braveKeyChanged);
      const response = await fetch('/api/settings/system-settings', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(keys.map(key => ({ key, value:values[key] }))) });
      if (!response.ok) throw new Error(((await response.json().catch(() => null)) as { message?:string } | null)?.message || 'Save failed');
      if (braveKeyChanged) setBraveConfigured(Boolean(values.screeningBraveApiKey));
      setValues(current => ({ ...current, screeningBraveApiKey:'' }));
      setBraveKeyChanged(false);
      toast.success('Digital footprint policy saved');
    } catch (error) { toast.errorWithDescription('Unable to save', error instanceof Error ? error.message : undefined); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading screening policy…</div>;
  return <div className="space-y-4 p-5">
    <header><h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5" />Digital Footprint Screening</h2><p className="mt-1 text-sm text-muted-foreground">Consent-gated public-source discovery. Findings always require human review.</p></header>
    <section className="rounded-lg border p-4"><h3 className="flex items-center gap-2 font-medium"><Search className="h-4 w-4" />Availability and automation</h3><div className="mt-4 space-y-4">
      <SettingSwitch label="Enable screening" description="Allows authorized users to queue manual scans." checked={values.screeningEnabled==='true'} onChange={() => toggle('screeningEnabled')} />
      <SettingSwitch label="Automatically scan new applicants" description="Queues after creation only when recorded consent exists." checked={values.screeningAutoApplicantEnabled==='true'} onChange={() => toggle('screeningAutoApplicantEnabled')} />
    </div></section>
    <section className="rounded-lg border p-4"><h3 className="flex items-center gap-2 font-medium"><BrainCircuit className="h-4 w-4" />Optional AI</h3><div className="mt-4 space-y-4">
      <SettingSwitch label="Allow AI processing" description="Makes AI summarization selectable; it never makes an employment decision." checked={values.screeningAiAllowed==='true'} onChange={() => toggle('screeningAiAllowed')} />
      <SettingSwitch label="Select AI by default for manual scans" checked={values.screeningManualAiDefault==='true'} onChange={() => toggle('screeningManualAiDefault')} disabled={values.screeningAiAllowed!=='true'} />
      <SettingSwitch label="Use AI for automatic applicant scans" checked={values.screeningAutomaticAiDefault==='true'} onChange={() => toggle('screeningAutomaticAiDefault')} disabled={values.screeningAiAllowed!=='true'} />
    </div></section>
    <section className="rounded-lg border p-4"><h3 className="flex items-center gap-2 font-medium"><Database className="h-4 w-4" />Sources and limits</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{SOURCES.map(source => <SettingSwitch key={source.id} label={source.label} description={source.description} checked={values.screeningEnabledSources.split(',').includes(source.id)} onChange={() => toggleSource(source.id)} />)}</div>
      <div className="mt-4 rounded-md border p-3"><label className="space-y-1.5 text-sm"><span className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4" />Brave Search API key</span><Input type="password" autoComplete="new-password" value={values.screeningBraveApiKey} placeholder={braveConfigured ? 'Configured — enter a new key to replace it' : 'Enter API key'} onChange={event => { setValues(current => ({...current,screeningBraveApiKey:event.target.value})); setBraveKeyChanged(true); }} /></label><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{braveConfigured ? 'A masked key is stored in Admin Center.' : 'No key is configured.'}</span>{braveConfigured && <Button type="button" variant="ghost" size="sm" onClick={() => { setValues(current => ({...current,screeningBraveApiKey:''})); setBraveKeyChanged(true); }}>Remove key</Button>}</div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SettingInput label="Monthly query limit" type="number" value={values.screeningMonthlyQueryLimit} onChange={value => setValues(current=>({...current,screeningMonthlyQueryLimit:value}))} />
        <SettingInput label="Queries per case" type="number" value={values.screeningMaxQueries} onChange={value => setValues(current=>({...current,screeningMaxQueries:value}))} />
        <SettingInput label="Results per query" type="number" value={values.screeningMaxResultsPerQuery} onChange={value => setValues(current=>({...current,screeningMaxResultsPerQuery:value}))} />
        <SettingInput label="Retention days" type="number" value={values.screeningRetentionDays} onChange={value => setValues(current=>({...current,screeningRetentionDays:value}))} />
        <SettingInput label="Identity threshold (0.5–1.0)" type="number" value={values.screeningIdentityThreshold} onChange={value => setValues(current=>({...current,screeningIdentityThreshold:value}))} />
      </div>
    </section>
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save screening policy'}</Button></div>
  </div>;
}

function SettingSwitch({label,description,checked,onChange,disabled}:{label:string;description?:string;checked:boolean;onChange:()=>void;disabled?:boolean}) { return <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{label}</p>{description&&<p className="text-xs text-muted-foreground">{description}</p>}</div><Switch checked={checked} onCheckedChange={onChange} disabled={disabled}/></div>; }
function SettingInput({label,value,onChange,type='text'}:{label:string;value:string;onChange:(value:string)=>void;type?:string}) { return <label className="space-y-1.5 text-sm"><span className="font-medium">{label}</span><Input type={type} value={value} onChange={event=>onChange(event.target.value)} /></label>; }
