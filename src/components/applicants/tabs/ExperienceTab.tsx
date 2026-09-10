import React from 'react';
import type { ExperienceEntry } from '@/lib/types';
import { sortExperienceByTimeline } from '../applicant-experience-utils';
import { getParsedExperienceEntries } from './experience-tab-utils';
import { ExperienceTabCustomFields } from './ExperienceTabCustomFields';
import { ExperienceTabEdit } from './ExperienceTabEdit';
import { ExperienceTabTimeline } from './ExperienceTabTimeline';
import type { ExperienceTabProps } from './ExperienceTabTypes';

export const ExperienceTab: React.FC<ExperienceTabProps> = ({
  applicant,
  isEditing,
  register,
  watch,
  setValue,
  experienceFields = [],
  appendExperience,
  removeExperience,
  calculateTotalExperienceDuration,
  onCustomFieldChange,
}) => {
  const experience = getParsedExperienceEntries(applicant.parsedData);
  const timelineExperience = sortExperienceByTimeline(experience as ExperienceEntry[]);
  const totalDuration = calculateTotalExperienceDuration ? calculateTotalExperienceDuration(experience) : '';

  return (
    <div className="space-y-4">
      {isEditing ? (
        <ExperienceTabEdit
          experienceFields={experienceFields}
          register={register}
          watch={watch}
          setValue={setValue}
          appendExperience={appendExperience}
          removeExperience={removeExperience}
        />
      ) : (
        <ExperienceTabTimeline
          experience={timelineExperience}
          totalDuration={totalDuration}
        />
      )}

      <ExperienceTabCustomFields
        applicant={applicant}
        isEditing={isEditing}
        onCustomFieldChange={onCustomFieldChange}
      />
    </div>
  );
};
