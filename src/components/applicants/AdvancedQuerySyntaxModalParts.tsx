"use client";

import {
  CommandLineIcon as Keyboard,
  DocumentTextIcon as FileText,
  KeyIcon as Key,
  LightBulbIcon as Lightbulb,
  MagnifyingGlassIcon as Search,
} from '@heroicons/react/24/outline';

import { Separator } from '@/components/ui/separator';

import {
  ADVANCED_QUERY_EXAMPLE_CATEGORIES,
  ADVANCED_QUERY_FIELDS,
  ADVANCED_QUERY_SHORTCUT_GROUPS,
  ADVANCED_QUERY_SPECIAL_VALUES,
  ADVANCED_QUERY_STATUS_VALUES,
  ADVANCED_QUERY_TIPS,
} from './advanced-query-syntax-content';
import {
  AdvancedQueryExampleCategoryCard,
  AdvancedQueryFieldCard,
  AdvancedQueryShortcutGroup,
  AdvancedQuerySpecialValueRow,
  AdvancedQueryStatusBadge,
  AdvancedQueryTipRow,
} from './AdvancedQuerySyntaxCards';

export function AdvancedQueryBasicSyntaxSection() {
  return (
    <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 dark:border-primary/30">
      <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Basic Syntax</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Use <code className="bg-primary/10 dark:bg-primary/20 px-1 rounded">field:value</code> format to search specific fields.
        Multiple filters can be combined with spaces.
      </p>
      <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded border border-primary/20 dark:border-primary/30">
        <code className="text-sm text-primary">
          minAppliedJobFitScore:80 status:Applied skills:React
        </code>
      </div>
    </div>
  );
}

export function AdvancedQueryFieldsSection() {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Search className="h-5 w-5" /> Available Search Fields</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ADVANCED_QUERY_FIELDS.map((item) => (
          <AdvancedQueryFieldCard key={item.field} item={item} />
        ))}
      </div>
    </div>
  );
}

export function AdvancedQuerySpecialValuesSection() {
  return (
    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2"><Key className="h-5 w-5" /> Special Values & Status Handling</h3>
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Status Field</h4>
          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
            Status names are automatically converted to UUIDs. Use these common status names:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ADVANCED_QUERY_STATUS_VALUES.map(status => (
              <AdvancedQueryStatusBadge key={status} status={status} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Special Values</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ADVANCED_QUERY_SPECIAL_VALUES.map((item) => (
              <AdvancedQuerySpecialValueRow key={item.value} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdvancedQueryExamplesSection({
  copiedExample,
  onCopyExample,
}: {
  copiedExample: string | null;
  onCopyExample: (query: string, copyKey: string) => void;
}) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Search Examples</h3>
      <div className="space-y-6">
        {ADVANCED_QUERY_EXAMPLE_CATEGORIES.map((category) => (
          <AdvancedQueryExampleCategoryCard
            key={category.name}
            category={category}
            copiedExample={copiedExample}
            onCopyExample={onCopyExample}
          />
        ))}
      </div>
    </div>
  );
}

export function AdvancedQueryKeyboardShortcutsSection() {
  return (
    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2"><Keyboard className="h-5 w-5" /> Keyboard Shortcuts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ADVANCED_QUERY_SHORTCUT_GROUPS.map((group, groupIndex) => (
          <AdvancedQueryShortcutGroup key={groupIndex} shortcuts={group} />
        ))}
      </div>
    </div>
  );
}

export function AdvancedQueryTipsSection() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
      <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Pro Tips</h3>
      <ul className="list-disc pl-5 text-sm text-amber-800 dark:text-amber-200 space-y-1">
        {ADVANCED_QUERY_TIPS.map((tip) => (
          <AdvancedQueryTipRow key={`${tip.text}-${tip.code ?? 'plain'}`} tip={tip} />
        ))}
      </ul>
    </div>
  );
}

export function AdvancedQuerySectionSeparator() {
  return <Separator />;
}
