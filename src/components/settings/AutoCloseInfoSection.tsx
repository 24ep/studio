import { CheckCircle, Info } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { AutoCloseSectionHeader } from './AutoCloseSectionHeader';

export function AutoCloseInfoSection() {
  return (
    <AccordionItem value="info" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <AutoCloseSectionHeader
          icon={<Info className="h-5 w-5 text-primary" />}
          title="How it works"
          description="This feature automatically closes positions when all associated headcounts are filled."
        />
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AutoCloseInfoItem
            title="Automatic Detection"
            description="System checks all open positions for filled headcounts"
            className="bg-blue-100 text-blue-600"
          />
          <AutoCloseInfoItem
            title="Smart Closure"
            description="Only closes positions where ALL headcounts are filled"
            className="bg-green-100 text-green-600"
          />
          <AutoCloseInfoItem
            title="Audit Trail"
            description="All auto-closures are logged with full audit trail"
            className="bg-purple-100 text-purple-600"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AutoCloseInfoItem({
  className,
  description,
  title,
}: {
  className: string;
  description: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${className}`}>
        <CheckCircle className="h-4 w-4" />
      </div>
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
