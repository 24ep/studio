import type { ChangeEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BrandingLogoUploadTile,
  BrandingLogoVariantUpload,
  BrandingSettingsRow,
} from "./BrandingTabParts";
import { SectionHeading } from "./BrandingSectionShared";
import {
  LOGO_SIZE_INPUT,
  PRIMARY_LOGO_UPLOAD,
  formatLoginPageLogoSize,
  parseLoginPageLogoSize,
  type BrandingLogoUploadConfig,
  type SidebarLogoUploadConfig,
  type SidebarLogoUploadGroup,
} from "./branding-logo-management-utils";

export function PrimaryLogoRow({
  canEdit,
  logoPreviewUrl,
  onChange,
  onRemove,
}: {
  canEdit: boolean;
  logoPreviewUrl: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <BrandingSettingsRow
      label={(
        <div className="flex items-center gap-2">
          <Label className="text-base font-semibold">Primary Logo</Label>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Required
          </Badge>
        </div>
      )}
      description="Main company branding used in header, favicon, and as fallback"
    >
      <div className="flex items-center gap-4">
        <BrandingLogoUploadTile
          id={PRIMARY_LOGO_UPLOAD.id}
          previewUrl={logoPreviewUrl}
          alt={PRIMARY_LOGO_UPLOAD.alt}
          canEdit={canEdit}
          onChange={onChange}
          onRemove={onRemove}
          emptyText={PRIMARY_LOGO_UPLOAD.emptyText}
        />
        <div className="flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {PRIMARY_LOGO_UPLOAD.recommendation}
          </p>
        </div>
      </div>
    </BrandingSettingsRow>
  );
}

export function ContextualLogoRows({
  canEdit,
  loginLogoUploads,
  sidebarLogoUploads,
}: {
  canEdit: boolean;
  loginLogoUploads: BrandingLogoUploadConfig[];
  sidebarLogoUploads: SidebarLogoUploadGroup[];
}) {
  return (
    <div className="space-y-6">
      <SectionHeading badgeLabel="Optional" title="Contextual Logos" />

      <BrandingSettingsRow
        label="Login Page"
        description="Logos displayed on the authentication screen"
      >
        <div className="grid grid-cols-2 gap-4">
          {loginLogoUploads.map((upload) => (
            <BrandingLogoVariantUpload
              key={upload.id}
              label={upload.label}
              id={upload.id}
              previewUrl={upload.previewUrl}
              alt={upload.alt}
              canEdit={canEdit}
              onChange={upload.onChange}
              onRemove={upload.onRemove}
            />
          ))}
        </div>
      </BrandingSettingsRow>

      <BrandingSettingsRow
        label="Sidebar"
        description="Logos displayed in the navigation sidebar (collapsed & expanded)"
      >
        <div className="grid grid-cols-2 gap-4">
          {sidebarLogoUploads.map((upload) => (
            <SidebarLogoColumn
              key={upload.mode}
              canEdit={canEdit}
              modeLabel={upload.modeLabel}
              collapsed={upload.collapsed}
              expanded={upload.expanded}
            />
          ))}
        </div>
      </BrandingSettingsRow>
    </div>
  );
}

function SidebarLogoColumn({
  canEdit,
  collapsed,
  expanded,
  modeLabel,
}: {
  canEdit: boolean;
  collapsed: SidebarLogoUploadConfig;
  expanded: SidebarLogoUploadConfig;
  modeLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{modeLabel}</Label>
      <div className="space-y-2">
        <SidebarLogoUpload canEdit={canEdit} label="Collapsed" {...collapsed} />
        <SidebarLogoUpload canEdit={canEdit} label="Expanded" {...expanded} />
      </div>
    </div>
  );
}

function SidebarLogoUpload({
  canEdit,
  label,
  ...upload
}: SidebarLogoUploadConfig & {
  canEdit: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <BrandingLogoUploadTile
        {...upload}
        canEdit={canEdit}
        size="small"
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function LoginLogoSizeRow({
  canEdit,
  loginPageLogoSize,
  onLoginPageLogoSizeChange,
}: {
  canEdit: boolean;
  loginPageLogoSize: number;
  onLoginPageLogoSizeChange: (value: number) => void;
}) {
  return (
    <BrandingSettingsRow
      label="Logo Size"
      description="Adjust the width and height of the login page logo"
    >
      <div className="flex items-center gap-4">
        <Input
          type="range"
          min={LOGO_SIZE_INPUT.min}
          max={LOGO_SIZE_INPUT.max}
          step={LOGO_SIZE_INPUT.step}
          value={loginPageLogoSize}
          onChange={(event) => onLoginPageLogoSizeChange(parseLoginPageLogoSize(event.target.value))}
          disabled={!canEdit}
          className="flex-1"
        />
        <div className="w-16 text-center text-sm font-medium bg-muted py-1 rounded">
          {formatLoginPageLogoSize(loginPageLogoSize)}
        </div>
      </div>
    </BrandingSettingsRow>
  );
}
