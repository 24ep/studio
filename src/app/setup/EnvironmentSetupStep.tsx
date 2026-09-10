"use client";

import { ArrowRight, Building2, CheckCircle2, Database, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type InstallationEnvironment = 'demo' | 'production';

interface EnvironmentSetupStepProps {
  employeeCount: string;
  environment: InstallationEnvironment;
  errorMessage: string;
  historyMonths: string;
  isAuthenticated: boolean;
  isInitializing: boolean;
  progress: number;
  progressStage: string;
  onEmployeeCountChange: (value: string) => void;
  onEnvironmentChange: (value: InstallationEnvironment) => void;
  onHistoryMonthsChange: (value: string) => void;
  onSubmit: () => void;
}

export function EnvironmentSetupStep(props: EnvironmentSetupStepProps) {
  const options = [
    { value: 'demo', icon: Database, title: 'Demo', description: 'Preload connected sample data for evaluation and training.' },
    { value: 'production', icon: Building2, title: 'Production', description: 'Begin with an empty, secure workspace for real company data.' },
  ] as const;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">Step 2</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose your installation environment</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Start clean for live operations, or explore the workflows with a realistic synthetic workforce.</p>
      </div>
      {props.errorMessage && <Alert variant="destructive"><AlertDescription>{props.errorMessage}</AlertDescription></Alert>}
      <RadioGroup value={props.environment} onValueChange={(value) => props.onEnvironmentChange(value as InstallationEnvironment)} className="grid gap-3 sm:grid-cols-2" aria-label="Installation environment" disabled={props.isInitializing}>
        {options.map((option) => {
          const Icon = option.icon;
          const selected = props.environment === option.value;
          return (
            <Label key={option.value} htmlFor={`environment-${option.value}`} className={`relative min-h-32 cursor-pointer rounded-lg border p-4 text-left font-normal transition-colors focus-within:ring-2 focus-within:ring-ring ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/60'} ${props.isInitializing ? 'cursor-not-allowed opacity-60' : ''}`}>
              <RadioGroupItem id={`environment-${option.value}`} value={option.value} className="sr-only" />
              <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" />{selected && <CheckCircle2 className="h-5 w-5 text-primary" />}</div>
              <p className="mt-4 text-sm font-semibold">{option.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
            </Label>
          );
        })}
      </RadioGroup>
      {props.environment === 'demo' ? (
        <div className="space-y-5 border-y border-border py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="demo-employee-count">Workforce size</Label><Select value={props.employeeCount} onValueChange={props.onEmployeeCountChange} disabled={props.isInitializing}><SelectTrigger id="demo-employee-count"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="100">100 employees</SelectItem><SelectItem value="500">500 employees</SelectItem><SelectItem value="1000">1,000 employees</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="demo-history-months">Historical data</Label><Select value={props.historyMonths} onValueChange={props.onHistoryMonthsChange} disabled={props.isInitializing}><SelectTrigger id="demo-history-months"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="6">6 months</SelectItem><SelectItem value="12">1 year</SelectItem><SelectItem value="24">2 years</SelectItem></SelectContent></Select></div>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Creates connected examples across recruiting, people, attendance, leave, payroll, performance, learning, surveys, expenses, service desk, portals, and reporting. The maximum preset may take several minutes. No real people, credentials, or external messages are used.</p>
        </div>
      ) : <Alert><AlertDescription>Production starts without example employees or historical activity. Import verified records after setup.</AlertDescription></Alert>}
      {props.isInitializing && props.environment === 'demo' && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-4 text-sm"><span className="font-medium">{props.progressStage}</span><span className="tabular-nums text-muted-foreground">{props.progress}%</span></div>
          <Progress value={props.progress} className="h-2" />
          <p className="text-xs leading-5 text-muted-foreground">This durable job can recover after a refresh. Keep this page open to see live progress.</p>
        </div>
      )}
      <div className="flex justify-end border-t border-border pt-5">
        <Button type="button" onClick={props.onSubmit} disabled={props.isInitializing || !props.isAuthenticated} className="sm:min-w-52">
          {props.isInitializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
          {props.isInitializing ? 'Preparing workspace…' : props.environment === 'demo' ? (props.errorMessage ? 'Retry demo setup' : 'Initialize demo') : 'Use production'}
        </Button>
      </div>
    </div>
  );
}
