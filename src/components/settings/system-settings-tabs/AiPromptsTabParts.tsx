import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AiPromptCardProps {
  children: ReactNode;
  disabled: boolean;
  id: string;
  minHeightClass: string;
  onChange: (value: string) => void;
  onReset: () => void;
  title: string;
  description: string;
  value: string;
}

export function AiPromptCard({
  children,
  disabled,
  id,
  minHeightClass,
  onChange,
  onReset,
  title,
  description,
  value,
}: AiPromptCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset} disabled={disabled}>
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset to Default
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={id}>System Prompt</Label>
          <Textarea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`${minHeightClass} font-mono text-sm`}
            placeholder="Enter system prompt..."
            disabled={disabled}
          />
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function JobDescriptionPromptHelp() {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p><span className="font-semibold">Available Variables:</span></p>
      <ul className="list-disc list-inside">
        <li><code>${'{title}'}</code> - Position Title</li>
        <li><code>${'{department}'}</code> - Department Name</li>
        <li><code>${'{positionLevel}'}</code> - Position Level (e.g. Senior, Junior)</li>
      </ul>
      <p className="mt-2 text-amber-600 dark:text-amber-400">
        Note: Ensure you instruct the AI to return <strong>ONLY HTML</strong> content without markdown code blocks.
      </p>
    </div>
  );
}

export function EvaluationPromptHelp() {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p><span className="font-semibold">Recommended Focus:</span></p>
      <ul className="list-disc list-inside">
        <li>Applicant evidence and position requirements</li>
        <li>Interviewer scores and written feedback</li>
        <li>Strengths, risks, follow-up questions, and recommendation</li>
      </ul>
    </div>
  );
}
