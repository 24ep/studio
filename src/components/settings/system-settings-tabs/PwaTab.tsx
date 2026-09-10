"use client";

import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

import { PwaAccordionTitle, PwaEnabledSwitch, PwaMetadataFields } from './PwaTabParts';
import type { PwaTabProps } from './pwa-tab-types';

export default function PwaTab({
  pwaEnabled,
  setPwaEnabled,
  pwaName,
  setPwaName,
  pwaShortName,
  setPwaShortName,
  pwaDescription,
  setPwaDescription,
  pwaThemeColor,
  setPwaThemeColor,
  pwaBackgroundColor,
  setPwaBackgroundColor,
  pwaAppleMobileWebAppTitle,
  setPwaAppleMobileWebAppTitle,
  pwaAppleMobileWebAppStatusBarStyle,
  setPwaAppleMobileWebAppStatusBarStyle,
  isSaving
}: PwaTabProps) {
  return (
    <ScrollArea className="h-full">
      <Accordion type="multiple" defaultValue={['pwa']} className="w-full">
        <AccordionItem value="pwa" className="border-b">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
            <PwaAccordionTitle />
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 pt-2">
            <div className="space-y-6">
              <PwaEnabledSwitch
                pwaEnabled={pwaEnabled}
                setPwaEnabled={setPwaEnabled}
                isSaving={isSaving}
              />
              {pwaEnabled && (
                <PwaMetadataFields
                  pwaName={pwaName}
                  setPwaName={setPwaName}
                  pwaShortName={pwaShortName}
                  setPwaShortName={setPwaShortName}
                  pwaDescription={pwaDescription}
                  setPwaDescription={setPwaDescription}
                  pwaThemeColor={pwaThemeColor}
                  setPwaThemeColor={setPwaThemeColor}
                  pwaBackgroundColor={pwaBackgroundColor}
                  setPwaBackgroundColor={setPwaBackgroundColor}
                  pwaAppleMobileWebAppTitle={pwaAppleMobileWebAppTitle}
                  setPwaAppleMobileWebAppTitle={setPwaAppleMobileWebAppTitle}
                  pwaAppleMobileWebAppStatusBarStyle={pwaAppleMobileWebAppStatusBarStyle}
                  setPwaAppleMobileWebAppStatusBarStyle={setPwaAppleMobileWebAppStatusBarStyle}
                  isSaving={isSaving}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  );
}
