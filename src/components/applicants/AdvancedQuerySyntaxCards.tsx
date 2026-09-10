"use client";

import {
  CheckIcon as Check,
  ClipboardDocumentIcon as Copy,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type {
  AdvancedQueryExample,
  AdvancedQueryExampleCategory,
  AdvancedQueryFieldDefinition,
  AdvancedQueryShortcut,
  AdvancedQuerySpecialValue,
  AdvancedQueryTip,
} from './advanced-query-syntax-content';
import { getAdvancedQueryExampleCopyKey } from './advanced-query-syntax-content';

interface AdvancedQueryFieldCardProps {
  item: AdvancedQueryFieldDefinition;
}

export function AdvancedQueryFieldCard({ item }: AdvancedQueryFieldCardProps) {
  return (
    <div className="bg-muted/50 p-3 rounded-lg border">
      <Badge variant="secondary" className="text-xs mb-1">{item.field}</Badge>
      <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
      <code className="text-xs bg-background px-1 py-0.5 rounded border text-blue-600">
        {item.example}
      </code>
    </div>
  );
}

interface AdvancedQueryStatusBadgeProps {
  status: string;
}

export function AdvancedQueryStatusBadge({ status }: AdvancedQueryStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="text-xs bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
    >
      {status}
    </Badge>
  );
}

interface AdvancedQuerySpecialValueRowProps {
  item: AdvancedQuerySpecialValue;
}

export function AdvancedQuerySpecialValueRow({ item }: AdvancedQuerySpecialValueRowProps) {
  return (
    <div className="text-sm">
      <code className="bg-green-100 dark:bg-green-900 px-1 rounded">{item.value}</code> - {item.description}
    </div>
  );
}

interface AdvancedQueryExampleCategoryCardProps {
  category: AdvancedQueryExampleCategory;
  copiedExample: string | null;
  onCopyExample: (query: string, copyKey: string) => void;
}

export function AdvancedQueryExampleCategoryCard({
  category,
  copiedExample,
  onCopyExample,
}: AdvancedQueryExampleCategoryCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="mb-3">
        <h4 className="font-medium text-base">{category.name}</h4>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </div>
      <div className="space-y-2">
        {category.examples.map((example, exampleIndex) => (
          <AdvancedQueryExampleRow
            key={getAdvancedQueryExampleCopyKey(category.name, exampleIndex)}
            categoryName={category.name}
            copiedExample={copiedExample}
            example={example}
            exampleIndex={exampleIndex}
            onCopyExample={onCopyExample}
          />
        ))}
      </div>
    </div>
  );
}

interface AdvancedQueryExampleRowProps {
  categoryName: string;
  copiedExample: string | null;
  example: AdvancedQueryExample;
  exampleIndex: number;
  onCopyExample: (query: string, copyKey: string) => void;
}

function AdvancedQueryExampleRow({
  categoryName,
  copiedExample,
  example,
  exampleIndex,
  onCopyExample,
}: AdvancedQueryExampleRowProps) {
  const copyKey = getAdvancedQueryExampleCopyKey(categoryName, exampleIndex);

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex-1">
        <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
          {example.query}
        </code>
        <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCopyExample(example.query, copyKey)}
        className="ml-2"
      >
        {copiedExample === copyKey ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface AdvancedQueryShortcutGroupProps {
  shortcuts: AdvancedQueryShortcut[];
}

export function AdvancedQueryShortcutGroup({ shortcuts }: AdvancedQueryShortcutGroupProps) {
  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.label} className="flex items-center justify-between">
          <span className="text-sm text-purple-800 dark:text-purple-200">{shortcut.label}</span>
          <kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-xs rounded border">
            {shortcut.keys}
          </kbd>
        </div>
      ))}
    </div>
  );
}

interface AdvancedQueryTipRowProps {
  tip: AdvancedQueryTip;
}

export function AdvancedQueryTipRow({ tip }: AdvancedQueryTipRowProps) {
  return (
    <li>
      {tip.text}
      {tip.code && (
        <>
          {' '}
          <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{tip.code}</code>
        </>
      )}
    </li>
  );
}
