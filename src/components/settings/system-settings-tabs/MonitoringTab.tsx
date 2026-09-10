'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MonitoringTab() {
    return (
        <ScrollArea className="h-full">
            <div className="p-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Monitoring</h3>
                <p className="text-muted-foreground">General monitoring tools and statistics will appear here.</p>
            </div>
        </ScrollArea>
    );
};
