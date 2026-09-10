import { Controller } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import {
  MobileSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/mobile-select';
import { Switch } from '@/components/ui/switch';
import { RecruiterAvatar } from '@/components/ui/recruiter-avatar';

import {
  PositionGradeDisplay,
  PositionStatusDisplay,
  UnassignedRecruiterBadge,
} from './PositionDetailsDisplays';
import { DetailsFieldRow } from './PositionDetailsFieldRowPrimitives';
import type { PositionDetailsRowOptions } from './PositionDetailsFieldRowTypes';

export function PositionLevelFieldRow({
  form,
  isEditMode,
  isLoadingLevels,
  position,
  positionLevels,
}: Pick<PositionDetailsRowOptions, 'form' | 'isEditMode' | 'isLoadingLevels' | 'position' | 'positionLevels'>) {
  return (
    <DetailsFieldRow fieldId="positionLevel" label="Position Level">
      {isEditMode ? (
        <Controller
          name="positionLevel"
          control={form.control}
          render={({ field }) => (
            <MobileSelect
              onValueChange={(value: string) => field.onChange(value === 'none' ? null : value)}
              value={field.value || 'none'}
              placeholder="Select Position Level"
              selectId="position-level-select"
            >
              <SelectTrigger className="bg-background" disabled={isLoadingLevels}>
                <SelectValue placeholder={isLoadingLevels ? 'Loading levels...' : 'Select level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Level</SelectItem>
                {positionLevels.map(level => (
                  <SelectItem key={level.id} value={level.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: level.color || '#6B7280' }}
                      />
                      {level.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </MobileSelect>
          )}
        />
      ) : (
        <div className="text-base text-foreground">{position.positionLevel || 'Not specified'}</div>
      )}
    </DetailsFieldRow>
  );
}

export function PositionGradeFieldRow({
  form,
  grades,
  isEditMode,
  position,
}: Pick<PositionDetailsRowOptions, 'form' | 'grades' | 'isEditMode' | 'position'>) {
  return (
    <DetailsFieldRow fieldId="gradeId" label="Grade">
      {isEditMode ? (
        <Controller
          name="gradeId"
          control={form.control}
          render={({ field }) => (
            <MobileSelect
              onValueChange={(value: string) => field.onChange(value === 'none' ? null : value)}
              value={field.value || 'none'}
              placeholder="Select Grade"
              selectId="grade-select"
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grade</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.label || grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </MobileSelect>
          )}
        />
      ) : (
        <PositionGradeDisplay position={position} />
      )}
    </DetailsFieldRow>
  );
}

export function PositionRecruiterFieldRow({
  availableRecruiters,
  form,
  isEditMode,
  position,
}: Pick<PositionDetailsRowOptions, 'availableRecruiters' | 'form' | 'isEditMode' | 'position'>) {
  return (
    <DetailsFieldRow fieldId="recruiterId" label="Assigned Recruiter">
      {isEditMode ? (
        <Controller
          name="recruiterId"
          control={form.control}
          render={({ field }) => (
            <MobileSelect
              onValueChange={(value: string) => field.onChange(value === 'none' ? null : value)}
              value={field.value || 'none'}
              placeholder="Select Recruiter"
              selectId="recruiter-select"
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select recruiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {availableRecruiters.map(recruiter => (
                  <SelectItem key={recruiter.id} value={recruiter.id}>
                    <span className="flex items-center gap-2.5"><RecruiterAvatar user={recruiter} size="xs" showBorder={false} /><span>{recruiter.name}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </MobileSelect>
          )}
        />
      ) : position.recruiterName ? (
        <div className="text-base text-foreground">{position.recruiterName}</div>
      ) : (
        <UnassignedRecruiterBadge />
      )}
    </DetailsFieldRow>
  );
}

export function PositionStatusFieldRow({
  form,
  isEditMode,
  position,
}: Pick<PositionDetailsRowOptions, 'form' | 'isEditMode' | 'position'>) {
  return (
    <DetailsFieldRow fieldId="isOpen" label="Status" isLast>
      {isEditMode ? (
        <Controller
          name="isOpen"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center space-x-3">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Badge variant={field.value ? 'success' : 'secondary'}>
                {field.value ? 'Open' : 'Closed'}
              </Badge>
            </div>
          )}
        />
      ) : (
        <PositionStatusDisplay position={position} />
      )}
    </DetailsFieldRow>
  );
}
