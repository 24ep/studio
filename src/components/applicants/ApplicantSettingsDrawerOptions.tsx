"use client";

import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApplicantSettings } from './applicant-settings-types';
import {
  ApplicantSettingsOptionCard,
  ApplicantSettingsRadioOption,
  ApplicantSettingsSwitchRow,
} from './ApplicantSettingsDrawerOptionParts';

interface ApplicantSettingsDrawerOptionsProps {
  settings: ApplicantSettings;
  isJobMatchEnabled: boolean;
  onSettingChange: (key: keyof ApplicantSettings, value: boolean | string | number) => void;
}

export function ApplicantSettingsDrawerOptions({
  settings,
  isJobMatchEnabled,
  onSettingChange,
}: ApplicantSettingsDrawerOptionsProps) {
  return (
    <>
      <ApplicantSettingsOptionCard
        title="Horizontal Fit Score Filters"
        description="Show horizontal fit score filter tabs above the Applicant table"
      >
        <ApplicantSettingsSwitchRow
          id="showHorizontalFitScoreFilters"
          label="Show Horizontal Fit Score Filters"
          checked={settings.showHorizontalFitScoreFilters}
          onCheckedChange={(checked) => onSettingChange('showHorizontalFitScoreFilters', checked)}
        />
      </ApplicantSettingsOptionCard>

      <ApplicantSettingsOptionCard
        title="Fit Score Preference"
        description="Choose which fit score type to prioritize"
      >
        <RadioGroup
          value={settings.fitScoreType}
          onValueChange={(value: 'applied' | 'matching') => onSettingChange('fitScoreType', value)}
          className="space-y-3"
        >
          <ApplicantSettingsRadioOption value="applied" id="applied" label="Applied Job Fit Score" />
          {isJobMatchEnabled && (
            <ApplicantSettingsRadioOption value="matching" id="matching" label="Job Match Fit Score" />
          )}
        </RadioGroup>
      </ApplicantSettingsOptionCard>

      <ApplicantSettingsOptionCard
        title="Fit Score Filter Mode"
        description="Configure how fit score filters behave when selecting grades"
      >
        <RadioGroup
          value={settings.fitScoreFilterMode}
          onValueChange={(value: 'single' | 'multi') => onSettingChange('fitScoreFilterMode', value)}
          className="space-y-3"
        >
          <ApplicantSettingsRadioOption
            value="single"
            id="single"
            label="Single Select"
            description="Only one fit score grade can be selected at a time"
          />
          <ApplicantSettingsRadioOption
            value="multi"
            id="multi"
            label="Multi Select"
            description="Multiple fit score grades can be selected simultaneously"
          />
        </RadioGroup>
      </ApplicantSettingsOptionCard>

      <ApplicantSettingsOptionCard
        title="Row Height"
        description="Adjust the height of table rows for better readability"
      >
        <div className="space-y-2">
          <Label htmlFor="rowHeight" className="text-sm font-medium">
            Row Height
          </Label>
          <Select
            value={settings.rowHeight || 'normal'}
            onValueChange={(value: 'compact' | 'normal' | 'comfortable') => onSettingChange('rowHeight', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Choose the spacing between table rows
          </div>
        </div>
      </ApplicantSettingsOptionCard>

      <ApplicantSettingsOptionCard
        title="Pin Section"
        description="Control how pinned Applicants are displayed in the table"
      >
        <ApplicantSettingsSwitchRow
          id="showPinSection"
          label="Show Pin Section"
          checked={settings.showPinSection}
          onCheckedChange={(checked) => onSettingChange('showPinSection', checked)}
          description="When enabled, pinned Applicants appear in a separate section at the top. When disabled, pinned Applicants are mixed with regular Applicants but still show pin icons."
        />
      </ApplicantSettingsOptionCard>
    </>
  );
}
