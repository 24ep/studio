import { Button } from "@/components/ui/button";
import {
    DEFAULT_PRIMARY_GRADIENT_END,
    DEFAULT_PRIMARY_GRADIENT_START,
    type HeaderBackgroundType,
} from "./constants";
import { BrandingLogoUploadTile, BrandingSettingsRow } from "./BrandingTabParts";
import type { BrandingTabProps } from "./BrandingTabTypes";
import {
    ColorSettingsRow,
    GradientColorPicker,
    SectionHeading,
} from "./BrandingSectionShared";
import { gradientStringToHslGradient, hslGradientToGradientString } from "./utils";

export function HeaderBrandingSection({
    canEdit,
    handleHeaderImageFileChange,
    headerBackgroundColor,
    headerBackgroundGradient,
    headerBackgroundType,
    headerImagePreviewUrl,
    headerTextColor,
    removeSelectedHeaderImage,
    setHeaderBackgroundColor,
    setHeaderBackgroundGradient,
    setHeaderBackgroundType,
    setHeaderTextColor,
}: BrandingTabProps) {
    const headerGradient = gradientStringToHslGradient(headerBackgroundGradient || "") || {
        start: DEFAULT_PRIMARY_GRADIENT_START,
        end: DEFAULT_PRIMARY_GRADIENT_END,
    };

    return (
        <section className="space-y-6 py-5 sm:py-6">
            <SectionHeading
                badgeClassName="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                badgeLabel="New"
                description="Configure the background and appearance of the application header"
                title="Header Branding"
            />

            <div className="grid gap-8">
                <BrandingSettingsRow
                    label="Background Style"
                    description="Choose the background style for the header"
                >
                    <div className="inline-flex flex-wrap gap-1 rounded-[5px] border border-border bg-muted/40 p-1">
                        {(["solid", "gradient", "image"] as HeaderBackgroundType[]).map((type) => (
                            <Button
                                key={type}
                                variant={headerBackgroundType === type ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setHeaderBackgroundType(type)}
                                className="h-8 min-w-20 rounded-[3px] capitalize"
                                disabled={!canEdit}
                            >
                                {type}
                            </Button>
                        ))}
                    </div>
                </BrandingSettingsRow>

                {headerBackgroundType === "solid" && (
                    <ColorSettingsRow
                        canEdit={canEdit}
                        color={headerBackgroundColor}
                        description="Pick a solid color for the header background"
                        label="Background Color"
                        onColorChange={setHeaderBackgroundColor}
                    />
                )}

                {headerBackgroundType === "gradient" && (
                    <BrandingSettingsRow
                        label="Background Gradient"
                        description="Define a custom gradient for the header"
                    >
                        <div className="space-y-4">
                            <div className="flex gap-4 items-center">
                                <GradientColorPicker
                                    label="Start Color"
                                    color={headerGradient.start}
                                    canEdit={canEdit}
                                    onColorChange={(color) => setHeaderBackgroundGradient(
                                        hslGradientToGradientString(color, headerGradient.end),
                                    )}
                                />
                                <GradientColorPicker
                                    label="End Color"
                                    color={headerGradient.end}
                                    canEdit={canEdit}
                                    onColorChange={(color) => setHeaderBackgroundGradient(
                                        hslGradientToGradientString(headerGradient.start, color),
                                    )}
                                />
                            </div>
                            <div
                                className="w-full h-12 rounded-lg border shadow-inner"
                                style={{ background: `linear-gradient(to right, hsl(${headerGradient.start}), hsl(${headerGradient.end}))` }}
                            />
                        </div>
                    </BrandingSettingsRow>
                )}

                {headerBackgroundType === "image" && (
                    <BrandingSettingsRow
                        label="Background Image"
                        description="Upload an image to use as the header background"
                    >
                        <div className="flex items-center gap-4">
                            <BrandingLogoUploadTile
                                id="header-bg-upload"
                                previewUrl={headerImagePreviewUrl}
                                alt="Header background preview"
                                canEdit={canEdit}
                                onChange={handleHeaderImageFileChange}
                                onRemove={() => removeSelectedHeaderImage(true)}
                                emptyText="Upload Image"
                                imageClassName="w-full h-full object-cover rounded p-1"
                            />
                        </div>
                    </BrandingSettingsRow>
                )}

                <ColorSettingsRow
                    canEdit={canEdit}
                    color={headerTextColor}
                    description="Adjust text/icon color for readability on background"
                    label="Text & Icon Color"
                    onColorChange={setHeaderTextColor}
                />
            </div>
        </section>
    );
}
