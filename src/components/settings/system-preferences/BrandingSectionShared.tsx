import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PersonalColorPicker } from "@/components/settings/PersonalColorPicker";
import { BrandingSettingsRow } from "./BrandingTabParts";

export function SectionHeading({
    badgeClassName,
    badgeLabel,
    description,
    title,
}: {
    badgeClassName?: string;
    badgeLabel: string;
    description?: string;
    title: string;
}) {
    return (
        <>
            <div className="flex items-center gap-2">
                <Label className="text-[15px] font-semibold tracking-[-0.01em]">{title}</Label>
                <Badge variant="outline" className={`h-5 rounded-[3px] px-1.5 text-[10px] font-medium ${badgeClassName ?? ""}`}>{badgeLabel}</Badge>
            </div>
            {description && (
                <p className="-mt-4 mb-4 text-[13px] leading-5 text-muted-foreground">{description}</p>
            )}
        </>
    );
}

export function clearPreviewAndSaved(
    setPreviewUrl: (url: string | null) => void,
    setSavedUrl: (url: string | null) => void,
) {
    setPreviewUrl(null);
    setSavedUrl(null);
}

export function ColorSettingsRow({
    canEdit,
    color,
    description,
    label,
    onColorChange,
}: {
    canEdit?: boolean;
    color: string;
    description: string;
    label: string;
    onColorChange: (color: string) => void;
}) {
    return (
        <BrandingSettingsRow label={label} description={description}>
            <PersonalColorPicker
                personalColor={color}
                onColorChange={onColorChange}
                className="w-full max-w-sm"
                disabled={canEdit === false}
            />
        </BrandingSettingsRow>
    );
}

export function GradientColorPicker({
    canEdit,
    color,
    label,
    onColorChange,
}: {
    canEdit: boolean;
    color: string;
    label: string;
    onColorChange: (color: string) => void;
}) {
    return (
        <div className="flex-1">
            <Label className="text-xs mb-2 block">{label}</Label>
            <PersonalColorPicker
                personalColor={color}
                onColorChange={onColorChange}
                disabled={!canEdit}
            />
        </div>
    );
}
