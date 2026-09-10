import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import type { Position } from '@/lib/types';
import { getJsonString, isJsonObject, readJsonObject, type JsonObject } from '@/lib/response-json';
import type { EditPositionFormValues } from '../position-edit-form';
import { fetchDefaultPositionMatchCriteria } from '../position-system-settings-api';
import {
  getMissingJobDescriptionFields,
  getPositionEditFormDefaults,
} from '../position-detail-drawer-utils';

interface UsePositionEditActionsInput {
  form: UseFormReturn<EditPositionFormValues>;
  position: Position | null;
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
  setPosition: Dispatch<SetStateAction<Position | null>>;
}

function normalizePositionUpdateResponse(value: unknown): Position | null {
  if (!isJsonObject(value)) {
    return null;
  }

  const position = isJsonObject(value.position) ? value.position : value;
  return position as unknown as Position;
}

function getGenerateDescriptionErrorMessage(response: Response, data: JsonObject) {
  const error = getJsonString(data, 'error');
  if (response.status === 503 && error?.includes('API Key')) {
    return 'AI features are not configured. Please configure an AI provider and API key in System Settings > AI API Keys.';
  }

  return error || 'Failed to generate job description';
}

export function usePositionEditActions({
  form,
  position,
  setIsEditMode,
  setPosition,
}: UsePositionEditActionsInput) {
  const [defaultMatchCriteria, setDefaultMatchCriteria] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = useCallback(() => {
    if (position) {
      form.reset(getPositionEditFormDefaults(position));
    }
    setIsEditMode(true);
  }, [form, position, setIsEditMode]);

  const handleSave = useCallback(async (data: EditPositionFormValues) => {
    if (!position) return;

    setIsSaving(true);
    try {
      const {
        onboardingClientId,
        onboardingAssetTypes,
        location,
        employmentType,
        workModel,
        salaryRange,
        targetStartDate,
        hiringManagerName,
        successOutcomes,
        coreResponsibilities,
        requiredSkills,
        preferredSkills,
        matchCriteriaPreview,
        ...positionFields
      } = data;
      const existingCustomAttributes = position.custom_attributes || position.customAttributes || {};
      const normalizeList = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
      const customAttributes = {
        ...existingCustomAttributes,
        onboardingClientId: onboardingClientId || null,
        onboardingAssetTypes,
        location,
        employmentType,
        workModel,
        salaryRange,
        targetStartDate,
        hiringManagerName,
        successOutcomes: normalizeList(successOutcomes),
        coreResponsibilities: normalizeList(coreResponsibilities),
        requiredSkills: normalizeList(requiredSkills),
        preferredSkills: normalizeList(preferredSkills),
        matchCriteriaPreview: normalizeList(matchCriteriaPreview),
      };

      if (position.id === 'preview') {
        setPosition({
          ...position,
          ...positionFields,
          customAttributes,
          custom_attributes: customAttributes,
          updatedAt: new Date().toISOString(),
        });
        setIsEditMode(false);
        toast.success('Position updated successfully');
        return;
      }

      const response = await fetch(`/api/positions/${position.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...positionFields,
          custom_attributes: customAttributes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update position');

      const updatedPosition = normalizePositionUpdateResponse(await readJsonObject(response));
      if (updatedPosition) {
        setPosition(updatedPosition);
      }
      setIsEditMode(false);
      toast.success('Position updated successfully');
    } catch (error) {
      toast.error('Failed to update position');
    } finally {
      setIsSaving(false);
    }
  }, [position, setIsEditMode, setPosition]);

  const handleCancel = useCallback(() => {
    if (position) {
      form.reset(getPositionEditFormDefaults(position));
    }
    setIsEditMode(false);
  }, [form, position, setIsEditMode]);

  const performJobDescriptionGeneration = useCallback(async (
    title: string,
    department: string,
    positionLevel: string,
  ) => {
    setIsGeneratingDescription(true);
    try {
      const existingDescription = form.getValues('description');
      const response = await fetch('/api/ai/generate-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          department,
          positionLevel: positionLevel || 'Not specified',
          existingDescription: existingDescription || '',
        }),
      });

      const data = await readJsonObject(response);

      if (!response.ok) {
        throw new Error(getGenerateDescriptionErrorMessage(response, data));
      }

      const description = getJsonString(data, 'description');
      if (description) {
        form.setValue('description', description);
        toast.success('Job description generated successfully!');
      } else {
        throw new Error('No description generated');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate job description. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingDescription(false);
    }
  }, [form]);

  const generateJobDescription = useCallback(async () => {
    const title = form.getValues('title');
    const department = form.getValues('department');
    const positionLevel = form.getValues('positionLevel');

    const missingFields = getMissingJobDescriptionFields({ title, department, positionLevel });

    if (missingFields.length > 0) {
      toast.error(`Please fill in the following fields first: ${missingFields.join(', ')}`);
      return;
    }

    await performJobDescriptionGeneration(title, department, positionLevel || '');
  }, [form, performJobDescriptionGeneration]);

  const useDefaultCriteria = useCallback(() => {
    if (defaultMatchCriteria) {
      form.setValue('matchCriteria', defaultMatchCriteria);
      toast.success('Default match criteria applied');
    }
  }, [defaultMatchCriteria, form]);

  useEffect(() => {
    const fetchDefaultMatchCriteria = async () => {
      try {
        setDefaultMatchCriteria(await fetchDefaultPositionMatchCriteria());
      } catch (error) {
        // Keep edit forms usable when optional system defaults fail to load.
      }
    };

    fetchDefaultMatchCriteria();
  }, []);

  return {
    defaultMatchCriteria,
    generateJobDescription,
    handleCancel,
    handleEdit,
    handleSave,
    isGeneratingDescription,
    isSaving,
    useDefaultCriteria,
  };
}
