import type React from 'react';
import type { EvaluateHeaderBackgroundType } from './constants';

export interface EvaluateTabProps {
  canEdit: boolean;
  evaluateHeaderBackgroundType: EvaluateHeaderBackgroundType;
  setEvaluateHeaderBackgroundType: (value: EvaluateHeaderBackgroundType) => void;
  evaluateHeaderImagePreviewUrl: string | null;
  savedEvaluateHeaderImageDataUrl: string | null;
  removeSelectedEvaluateHeaderImage: (shouldRemoveSaved: boolean) => void;
  handleEvaluateHeaderImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  evaluateHeaderBackgroundGradient: string | null;
  setEvaluateHeaderBackgroundGradient: (value: string) => void;
  evaluateHeaderBackgroundColor: string;
  setEvaluateHeaderBackgroundColor: (value: string) => void;
  evaluateHeaderTextColor: string;
  setEvaluateHeaderTextColor: (value: string) => void;
}
