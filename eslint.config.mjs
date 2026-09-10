import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "@next/next/no-img-element": "error",
      "@next/next/no-before-interactive-script-outside-document": "off",
      "react-hooks/rules-of-hooks": "error",
      // Surface dependency mistakes without breaking the existing quiet lint path.
      // `npm run lint:strict` promotes warnings to a failing quality gate.
      "react-hooks/exhaustive-deps": "warn",
      "import/no-anonymous-default-export": "off",
      "jsx-a11y/alt-text": "error",
      // Warn about console.log to encourage using logger utility.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**"],
              message: "Shared modules must not depend on Next.js route modules. Move shared contracts into src/features or src/lib.",
            },
          ],
        },
      ],
    },
  },
  {
    // These native images render dynamic user uploads, object URLs, or data URLs.
    // Keep exceptions explicit so new raw image usage is rejected everywhere else.
    files: [
      "src/app/applicants/*/evaluate/components/AttachmentImagePreview.tsx",
      "src/app/applicants/*/evaluate/components/AttachmentThumbnailButton.tsx",
      "src/app/apply/PublicApplyPage.tsx",
      "src/app/settings/applicant-sources/ApplicantSourcesTableRow.tsx",
      "src/app/settings/data-configuration/ApplicantSourcesTabParts.tsx",
      "src/app/settings/data-configuration/CompanyReferencesTabParts.tsx",
      "src/components/applicants/ApplicantCommentAttachmentList.tsx",
      "src/components/applicants/ApplicantCommentsTimelineContent.tsx",
      "src/components/applicants/ApplicantEvaluationAssets.tsx",
      "src/components/applicants/ApplicantHeaderAvatarDialog.tsx",
      "src/components/applicants/ApplicantImportQueueBasicFilters.tsx",
      "src/components/applicants/ApplicantImportQueueTableRowCells.tsx",
      "src/components/applicants/ApplicantResumesSectionParts.tsx",
      "src/components/applicants/ApplicantSourceCellPopover.tsx",
      "src/components/applicants/ProcessQueueJobDetailsDialogParts.tsx",
      "src/components/applicants/ProcessQueueSourceAnalyticsTab.tsx",
      "src/components/applicants/tabs/JobMatchTabParts.tsx",
      "src/components/company-portal/CompanyPortalRenderer.tsx",
      "src/components/settings/ApplicantSourceModalParts.tsx",
      "src/components/settings/BaseItemFormFields.tsx",
      "src/components/settings/SortableBaseItem.tsx",
      "src/components/settings/SystemPreferencesLogoSettingsCard.tsx",
      "src/components/settings/SystemSettingImageValueField.tsx",
      "src/components/settings/TreeItemIconFields.tsx",
      "src/components/settings/system-preferences/AppearanceLoginBackgroundControls.tsx",
      "src/components/settings/system-preferences/BrandingTabParts.tsx",
      "src/components/settings/system-preferences/EvaluateTabParts.tsx",
      "src/components/settings/system-preferences/SidebarBackgroundSettingsParts.tsx",
      "src/components/settings/system-settings-tabs/OrganizationTabParts.tsx",
      "src/components/shift/ShiftShared.tsx",
      "src/components/ui/enhanced-color-picker-media-panel.tsx",
      "src/components/ui/file-viewer-modal-preview.tsx",
      "src/components/ui/image-upload-parts.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
