import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    SidebarBackgroundType,
    SidebarColors,
    SidebarImageFit,
    SidebarImagePosition,
} from './constants';
import {
    SidebarBackgroundSettings,
    SidebarColorThemeSection,
} from './SidebarTabParts';

interface SidebarTabProps {
    canEdit: boolean;
    activeSidebarTab: string;
    setActiveSidebarTab: (value: string) => void;
    sidebarColors: SidebarColors;
    setSidebarColors: React.Dispatch<React.SetStateAction<SidebarColors>>;
    resetSidebarColors: () => void;
    sidebarBackgroundType: SidebarBackgroundType;
    setSidebarBackgroundType: (value: SidebarBackgroundType) => void;
    sidebarImagePreviewUrl: string | null;
    savedSidebarImageUrl: string | null;
    removeSelectedSidebarImage: (shouldRemoveSaved: boolean) => void;
    handleSidebarImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    sidebarImageFit: SidebarImageFit;
    setSidebarImageFit: (value: SidebarImageFit) => void;
    sidebarImagePosition: SidebarImagePosition;
    setSidebarImagePosition: (value: SidebarImagePosition) => void;
    sidebarBackgroundBlurPercent: number;
    setSidebarBackgroundBlurPercent: (value: number) => void;
    sidebarBackgroundTranslucencyPercent: number;
    setSidebarBackgroundTranslucencyPercent: (value: number) => void;
}

export function SidebarTab({
    canEdit,
    activeSidebarTab,
    setActiveSidebarTab,
    sidebarColors,
    setSidebarColors,
    resetSidebarColors,
    sidebarBackgroundType,
    setSidebarBackgroundType,
    sidebarImagePreviewUrl,
    savedSidebarImageUrl,
    removeSelectedSidebarImage,
    handleSidebarImageFileChange,
    sidebarImageFit,
    setSidebarImageFit,
    sidebarImagePosition,
    setSidebarImagePosition,
    sidebarBackgroundBlurPercent,
    setSidebarBackgroundBlurPercent,
    sidebarBackgroundTranslucencyPercent,
    setSidebarBackgroundTranslucencyPercent,
}: SidebarTabProps) {
    return (
        <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
                <SidebarBackgroundSettings
                    canEdit={canEdit}
                    sidebarBackgroundType={sidebarBackgroundType}
                    setSidebarBackgroundType={setSidebarBackgroundType}
                    sidebarImagePreviewUrl={sidebarImagePreviewUrl}
                    savedSidebarImageUrl={savedSidebarImageUrl}
                    removeSelectedSidebarImage={removeSelectedSidebarImage}
                    handleSidebarImageFileChange={handleSidebarImageFileChange}
                    sidebarImageFit={sidebarImageFit}
                    setSidebarImageFit={setSidebarImageFit}
                    sidebarImagePosition={sidebarImagePosition}
                    setSidebarImagePosition={setSidebarImagePosition}
                    sidebarBackgroundBlurPercent={sidebarBackgroundBlurPercent}
                    setSidebarBackgroundBlurPercent={setSidebarBackgroundBlurPercent}
                    sidebarBackgroundTranslucencyPercent={sidebarBackgroundTranslucencyPercent}
                    setSidebarBackgroundTranslucencyPercent={setSidebarBackgroundTranslucencyPercent}
                />
                <SidebarColorThemeSection
                    activeSidebarTab={activeSidebarTab}
                    canEdit={canEdit}
                    resetSidebarColors={resetSidebarColors}
                    setActiveSidebarTab={setActiveSidebarTab}
                    setSidebarColors={setSidebarColors}
                    sidebarColors={sidebarColors}
                />
            </div>
        </ScrollArea>
    );
}
