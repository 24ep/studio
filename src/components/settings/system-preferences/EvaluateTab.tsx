import { ScrollArea } from '@/components/ui/scroll-area';
import {
  EvaluateHeaderBackgroundTypeSelect,
  EvaluateHeaderGradientSection,
  EvaluateHeaderImageSection,
  EvaluateHeaderSolidColorSection,
  EvaluateHeaderTextColorSection,
} from './EvaluateTabParts';
import {
  getDefaultEvaluateHeaderGradient,
  getEvaluateHeaderPreviewImageSrc,
} from './evaluate-tab-utils';
import type { EvaluateTabProps } from './EvaluateTabTypes';
import { SystemPreferenceSection } from './SystemPreferenceRows';

export function EvaluateTab(props: EvaluateTabProps) {
  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <EvaluateSettingsContent {...props} />
      </div>
    </ScrollArea>
  );
}

export function EvaluateSettingsContent({
  canEdit,
  evaluateHeaderBackgroundType,
  setEvaluateHeaderBackgroundType,
  evaluateHeaderImagePreviewUrl,
  savedEvaluateHeaderImageDataUrl,
  removeSelectedEvaluateHeaderImage,
  handleEvaluateHeaderImageFileChange,
  evaluateHeaderBackgroundGradient,
  setEvaluateHeaderBackgroundGradient,
  evaluateHeaderBackgroundColor,
  setEvaluateHeaderBackgroundColor,
  evaluateHeaderTextColor,
  setEvaluateHeaderTextColor,
}: EvaluateTabProps) {
  const defaultEvaluateHeaderGradient = getDefaultEvaluateHeaderGradient();
  const evaluateHeaderPreviewImageSrc = getEvaluateHeaderPreviewImageSrc(
    evaluateHeaderImagePreviewUrl,
    savedEvaluateHeaderImageDataUrl
  );

  return (
    <SystemPreferenceSection
      title="Evaluate Page Settings"
      description="Customize the appearance of the Applicants evaluation page."
    >
      <EvaluateHeaderBackgroundTypeSelect
        canEdit={canEdit}
        value={evaluateHeaderBackgroundType}
        onChange={setEvaluateHeaderBackgroundType}
      />

      {evaluateHeaderBackgroundType === 'image' && (
        <EvaluateHeaderImageSection
          canEdit={canEdit}
          previewImageSrc={evaluateHeaderPreviewImageSrc}
          onRemoveImage={removeSelectedEvaluateHeaderImage}
          onImageFileChange={handleEvaluateHeaderImageFileChange}
        />
      )}

      {evaluateHeaderBackgroundType === 'gradient' && (
        <EvaluateHeaderGradientSection
          canEdit={canEdit}
          value={evaluateHeaderBackgroundGradient}
          defaultGradient={defaultEvaluateHeaderGradient}
          onChange={setEvaluateHeaderBackgroundGradient}
        />
      )}

      {evaluateHeaderBackgroundType === 'solid' && (
        <EvaluateHeaderSolidColorSection
          canEdit={canEdit}
          value={evaluateHeaderBackgroundColor}
          onChange={setEvaluateHeaderBackgroundColor}
        />
      )}

      <EvaluateHeaderTextColorSection
        canEdit={canEdit}
        value={evaluateHeaderTextColor}
        onChange={setEvaluateHeaderTextColor}
      />
    </SystemPreferenceSection>
  );
}
