import { Button } from "@/components/ui/button";
import { BrandingLogoUploadTile, BrandingSettingsRow } from "./BrandingTabParts";
import type { BrandingTabProps } from "./BrandingTabTypes";
import { ColorSettingsRow, SectionHeading } from "./BrandingSectionShared";

export function SplashScreenSection({
    canEdit,
    handleSplashLogoChange,
    removeSplashLogo,
    setSplashAnimationType,
    setSplashBackgroundColor,
    splashAnimationType,
    splashBackgroundColor,
    splashLogoPreviewUrl,
}: BrandingTabProps) {
    return (
        <section className="space-y-6 py-5 sm:py-6">
            <SectionHeading
                badgeClassName="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                badgeLabel="New"
                description="Customize the loading screen shown during a full page load or reload"
                title="Splash Screen"
            />

            <div className="grid gap-8">
                <ColorSettingsRow
                    canEdit={canEdit}
                    color={splashBackgroundColor}
                    description="The solid background color of the loading screen"
                    label="Background Color"
                    onColorChange={setSplashBackgroundColor}
                />

                <BrandingSettingsRow
                    label="Animation Style"
                    description="The loading indicator style"
                >
                    <div className="inline-flex flex-wrap gap-1 rounded-[5px] border border-border bg-muted/40 p-1">
                        {["spinner", "pulse", "bar", "dots", "none"].map((type) => (
                            <Button
                                key={type}
                                variant={splashAnimationType === type ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSplashAnimationType(type)}
                                className="h-8 min-w-16 rounded-[3px] capitalize"
                                disabled={!canEdit}
                            >
                                {type}
                            </Button>
                        ))}
                    </div>
                </BrandingSettingsRow>

                <BrandingSettingsRow
                    label="Splash Logo (Optional)"
                    description="Overrides primary logo if set"
                >
                    <div className="flex items-center gap-4">
                        <BrandingLogoUploadTile
                            id="splash-logo-upload"
                            previewUrl={splashLogoPreviewUrl}
                            alt="Splash logo preview"
                            canEdit={canEdit}
                            onChange={handleSplashLogoChange}
                            onRemove={() => removeSplashLogo(true)}
                            emptyText="Upload"
                        />
                    </div>
                </BrandingSettingsRow>
            </div>
        </section>
    );
}
