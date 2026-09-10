import { PlusCircleIcon as PlusCircle, TrashIcon as Trash2 } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  ApplicantSkillInfo,
  ContactTabProps,
} from './ContactTabTypes';
import { getContactSkillKey, getSkillLabels } from './contact-tab-utils';

interface ContactEditableSkillsCardProps {
  register: ContactTabProps['register'];
  skillsFields: NonNullable<ContactTabProps['skillsFields']>;
  appendSkill?: ContactTabProps['appendSkill'];
  removeSkill?: ContactTabProps['removeSkill'];
}

interface ContactEditableSkillRowProps extends Pick<ContactEditableSkillsCardProps, 'register' | 'removeSkill'> {
  field: NonNullable<ContactTabProps['skillsFields']>[number];
  index: number;
}

interface ContactReadSkillsCardProps {
  skills: ApplicantSkillInfo[];
}

function ContactEditableSkillRow({
  field,
  index,
  register,
  removeSkill,
}: ContactEditableSkillRowProps) {
  const segmentSkillPath = `parsedData.skills.${index}.segment_skill` as const;
  const skillStringPath = `parsedData.skills.${index}.skill_string` as const;

  return (
    <div key={getContactSkillKey(field, index)} className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Skill #{index + 1}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeSkill?.(index)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={segmentSkillPath}>Skill Category</Label>
          <Input
            id={segmentSkillPath}
            {...(register?.(segmentSkillPath) ?? {})}
            placeholder="e.g., Programming Languages, Soft Skills"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={skillStringPath}>Skills</Label>
          <Input
            id={skillStringPath}
            {...(register?.(skillStringPath) ?? {})}
            placeholder="e.g., JavaScript, React, Node.js"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

export function ContactEditableSkillsCard({
  register,
  skillsFields,
  appendSkill,
  removeSkill,
}: ContactEditableSkillsCardProps) {
  const handleAddSkill = () => {
    appendSkill?.({
      segment_skill: '',
      skill_string: '',
    });
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Skills</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSkill}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Skill
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {skillsFields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No skills entries yet.</p>
            <p className="text-sm">Click "Add Skill" to add your first entry.</p>
          </div>
        ) : (
          skillsFields.map((field, index) => (
            <ContactEditableSkillRow
              key={getContactSkillKey(field, index)}
              field={field}
              index={index}
              register={register}
              removeSkill={removeSkill}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ContactReadSkillsCard({ skills }: ContactReadSkillsCardProps) {
  if (skills.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {skills.map((skill, index) => (
          <div key={index} className="space-y-2">
            {skill.segment_skill && (
              <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-black rounded-full" />
                {skill.segment_skill}
              </h4>
            )}
            <div className="flex flex-wrap gap-2">
              {getSkillLabels(skill).map((trimmedSkill, skillIndex) => (
                <Badge
                  key={skillIndex}
                  variant="secondary"
                  className="px-3 py-1 rounded-full font-medium bg-black text-white hover:bg-black/90 border-none transition-transform hover:scale-105"
                >
                  {trimmedSkill}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
