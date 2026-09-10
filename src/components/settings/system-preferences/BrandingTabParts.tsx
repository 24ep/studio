import React from 'react';
import { ImageUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SystemPreferenceRow } from './SystemPreferenceRows';
import {
    getBrandingLogoUploadTileClasses,
    type BrandingLogoUploadTileSize,
} from './branding-logo-upload-utils';

export function BrandingSettingsRow({
    label,
    description,
    children,
}: {
    label: React.ReactNode;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <SystemPreferenceRow label={label} description={description}>
            {children}
        </SystemPreferenceRow>
    );
}

export function BrandingLogoUploadTile({
    id,
    previewUrl,
    alt,
    canEdit,
    onChange,
    onRemove,
    size = 'large',
    emptyText,
    imageClassName,
}: {
    id: string;
    previewUrl: string | null;
    alt: string;
    canEdit: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    size?: BrandingLogoUploadTileSize;
    emptyText?: string;
    imageClassName?: string;
}) {
    const classes = getBrandingLogoUploadTileClasses(size);
    const [previewFailed, setPreviewFailed] = React.useState(false);

    React.useEffect(() => {
        setPreviewFailed(false);
    }, [previewUrl]);

    return (
        <div className="flex-shrink-0">
            <Input
                type="file"
                accept="image/*"
                onChange={onChange}
                disabled={!canEdit}
                className="hidden"
                id={id}
            />
            <Label htmlFor={id} className="cursor-pointer block">
                <div className={`${classes.containerClassName} group flex items-center justify-center border border-[#dfe3ea] bg-[#f8f9fb] transition-[border-color,background-color,box-shadow] hover:border-[#b9c8dc] hover:bg-[#f3f6fa] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:border-zinc-700 dark:bg-zinc-800/70 dark:hover:border-zinc-600 dark:hover:bg-zinc-800`}>
                    {previewUrl && !previewFailed ? (
                        <div className={classes.previewWrapperClassName}>
                            <img
                                src={previewUrl}
                                alt={alt}
                                className={imageClassName ?? classes.imageClassName}
                                onError={() => setPreviewFailed(true)}
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className={classes.removeButtonClassName}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onRemove();
                                }}
                                disabled={!canEdit}
                            >
                                <X className={classes.removeIconClassName} />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <ImageUp className={classes.emptyIconClassName} />
                            <p className={classes.emptyTextClassName}>
                                {previewFailed ? 'Preview unavailable — upload to replace' : emptyText}
                            </p>
                        </div>
                    )}
                </div>
            </Label>
        </div>
    );
}

export function BrandingLogoVariantUpload({
    label,
    id,
    previewUrl,
    alt,
    canEdit,
    onChange,
    onRemove,
}: {
    label: string;
    id: string;
    previewUrl: string | null;
    alt: string;
    canEdit: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium">{label}</Label>
            <div className="flex items-center gap-3">
                <BrandingLogoUploadTile
                    id={id}
                    previewUrl={previewUrl}
                    alt={alt}
                    canEdit={canEdit}
                    onChange={onChange}
                    onRemove={onRemove}
                    size="small"
                />
            </div>
        </div>
    );
}
