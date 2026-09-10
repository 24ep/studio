"use client";

import { Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SystemApiKeysListSection } from "./SystemApiKeysTabList";
import type { SystemApiKey } from "./system-api-keys-utils";
import type { useSystemApiKeysTab } from "./use-system-api-keys-tab";

export {
  CreatedSystemApiKeyDialog,
  CreateSystemApiKeyDialog,
  DeleteSystemApiKeyDialog,
  SystemApiKeysLoadingState,
} from "./SystemApiKeysTabDialogs";

type SystemApiKeyActions = ReturnType<typeof useSystemApiKeysTab>["actions"];

interface SystemApiKeysAccordionProps {
  apiKeys: SystemApiKey[];
  deletingId: string | null;
  togglingId: string | null;
  actions: SystemApiKeyActions;
}

export function SystemApiKeysAccordion({
  apiKeys,
  deletingId,
  togglingId,
  actions,
}: SystemApiKeysAccordionProps) {
  return (
    <Accordion type="multiple" defaultValue={["list", "usage"]} className="w-full">
      <SystemApiKeysListSection
        apiKeys={apiKeys}
        deletingId={deletingId}
        togglingId={togglingId}
        onDeleteClick={actions.setDeleteConfirmId}
        onToggleActive={actions.handleToggleActive}
      />
      <SystemApiKeysUsageSection />
    </Accordion>
  );
}

function AccordionSectionHeader({
  description,
  icon,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="text-left">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground font-normal">{description}</div>
      </div>
    </div>
  );
}

function SystemApiKeysUsageSection() {
  return (
    <AccordionItem value="usage" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <AccordionSectionHeader
          icon={<Shield className="h-5 w-5 text-primary" />}
          title="Usage Guide"
          description="How to use API keys for authentication"
        />
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">V2 API Login Endpoint</h4>
            <code className="block bg-muted p-3 rounded text-xs">POST /api/v2/auth/login</code>
          </div>

          <div>
            <h4 className="font-medium mb-2">Authentication Methods</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong>Header (Recommended for n8n):</strong>
                <code className="block bg-muted p-2 rounded text-xs mt-1">
                  Authorization: Bearer sk_live_your_api_key_here
                </code>
              </li>
              <li>
                <strong>X-API-Key Header:</strong>
                <code className="block bg-muted p-2 rounded text-xs mt-1">
                  X-API-Key: sk_live_your_api_key_here
                </code>
              </li>
              <li>
                <strong>Request Body:</strong>
                <code className="block bg-muted p-2 rounded text-xs mt-1">
                  {`{ "apiKey": "sk_live_your_api_key_here" }`}
                </code>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Response Format</h4>
            <p className="text-muted-foreground">
              The response matches V1 login format with an additional <code>isSystemUser: true</code> flag.
              Use the returned JWT token for subsequent API calls.
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
