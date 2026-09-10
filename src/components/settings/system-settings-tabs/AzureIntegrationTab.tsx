"use client";

import { UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { testAzureMeetingRoomsConnection } from './azure-integration-tab-api';
import {
    AzureCredentialsSection,
    AzureMeetingRoomsSection,
} from './AzureIntegrationTabParts';
import type { AzureIntegrationTabProps } from './azure-integration-tab-types';
import { getAzureMeetingRoomsTestToast } from './azure-integration-tab-utils';

export default function AzureIntegrationTab(props: AzureIntegrationTabProps) {
    const handleTestAzureConnection = async () => {
        props.setTestingAzureRooms(true);
        try {
            const result = await testAzureMeetingRoomsConnection();
            const toastResult = getAzureMeetingRoomsTestToast(result);
            if (toastResult.type === 'success') {
                toast.success(toastResult.message);
            } else {
                toast.error(toastResult.message);
            }
        } catch {
            toast.error('Failed to test Azure connection');
        } finally {
            props.setTestingAzureRooms(false);
        }
    };

    return (
        <ScrollArea className="h-full">
            <Accordion type="multiple" defaultValue={['azure']} className="w-full">
                <AccordionItem value="azure" className="border-b">
                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold">Azure Integration</div>
                                <div className="text-xs text-muted-foreground font-normal">Configure Azure AD integration settings</div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-2">
                        <div className="space-y-6">
                            <AzureCredentialsSection {...props} />
                            <AzureMeetingRoomsSection
                                {...props}
                                onTestAzureConnection={handleTestAzureConnection}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </ScrollArea>
    );
}
