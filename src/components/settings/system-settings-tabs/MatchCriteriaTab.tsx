"use client";

import React from 'react';
import { BrainCircuit, DownloadCloud, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    getJsonArray,
    getJsonErrorMessage,
    getJsonString,
    isJsonObject,
    readJsonObject,
} from '@/lib/response-json';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';

interface MatchCriteriaTabProps {
    defaultMatchCriteria: string;
    setDefaultMatchCriteria: (val: string) => void;
    isSaving: boolean;
    isEditorReady: boolean;
}

export default function MatchCriteriaTab({
    defaultMatchCriteria,
    setDefaultMatchCriteria,
    isSaving,
    isEditorReady,
}: MatchCriteriaTabProps) {
    const [isLoadingAppKit, setIsLoadingAppKit] = React.useState(false);
    const [appKitLoadPercent, setAppKitLoadPercent] = React.useState(0);
    const [appKitLoadMessage, setAppKitLoadMessage] = React.useState('Initializing AppKit request');

    const loadDefaultFromAppKit = async () => {
        setIsLoadingAppKit(true);
        setAppKitLoadPercent(10);
        setAppKitLoadMessage('Connecting to AppKit');

        try {
            const response = await fetch('/api/settings/platform-default-settings/import-appkit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    environment: 'production',
                    keys: ['defaultMatchCriteria'],
                }),
            });
            setAppKitLoadPercent(50);
            setAppKitLoadMessage('Loading match criteria');
            const payload = await readJsonObject(response);

            if (!response.ok) {
                throw new Error(getJsonErrorMessage(payload, 'Failed to load match criteria from AppKit'));
            }

            const importedSetting = getJsonArray(payload, 'settings')?.find((setting) => (
                isJsonObject(setting) && getJsonString(setting, 'key') === 'defaultMatchCriteria'
            ));
            const importedValue = isJsonObject(importedSetting)
                ? getJsonString(importedSetting, 'value')
                : undefined;

            if (!importedValue) {
                throw new Error('AppKit did not return default match criteria.');
            }

            setAppKitLoadPercent(85);
            setAppKitLoadMessage('Applying defaults');
            setDefaultMatchCriteria(importedValue);
            toast.success('Default match criteria loaded from AppKit');
        } catch (error) {
            console.error('Failed to load match criteria from AppKit:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load match criteria from AppKit');
        } finally {
            setIsLoadingAppKit(false);
            setAppKitLoadPercent(0);
            setAppKitLoadMessage('Initializing AppKit request');
        }
    };

    return (
        <ScrollArea className="h-full">
            <div className="space-y-6 px-6 py-5">
                <div className="flex items-start gap-2">
                    <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                        <h2 className="font-semibold">Match Criteria</h2>
                        <p className="text-xs font-normal text-muted-foreground">
                            Configure the default match criteria template for new positions. This will be used when creating new positions if no specific criteria are provided.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Label htmlFor="default-match-criteria">Default Match Criteria Template</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSaving || isLoadingAppKit}
                            onClick={() => void loadDefaultFromAppKit()}
                        >
                            {isLoadingAppKit ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {`${appKitLoadPercent}% · ${appKitLoadMessage}`}
                                </>
                            ) : (
                                <DownloadCloud className="mr-2 h-4 w-4" />
                            )}
                            {!isLoadingAppKit && 'Load from AppKit'}
                        </Button>
                    </div>
                    <div className="min-h-[200px] rounded-md border">
                        {!isEditorReady ? (
                            <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Loading editor...
                            </div>
                        ) : (
                            <div className={`relative ${isSaving ? 'pointer-events-none opacity-50' : ''}`}>
                                <TiptapEditor
                                    key={`default-match-criteria-editor-${isEditorReady}`}
                                    value={defaultMatchCriteria}
                                    onChange={setDefaultMatchCriteria}
                                    placeholder="Enter default match criteria template for new positions..."
                                    className="min-h-[200px]"
                                    isOpen={isEditorReady}
                                />
                                {isSaving && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/50">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This template will be used as the default match criteria when creating new positions. You can include requirements, skills, experience levels, and other criteria.
                    </p>
                </div>
            </div>
        </ScrollArea>
    );
}
