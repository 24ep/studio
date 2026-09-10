export interface SelectedEvaluationItem {
  id: string;
  name: string;
}

export interface GroupableEvaluationItem extends SelectedEvaluationItem {
  description?: string;
  groupId?: string;
}

export interface EvaluationTemplateLike {
  templateGroups?: Array<{ group: { id: string } }>;
  templateSkills?: Array<{ skill: { id: string } }>;
  templatePersonalityGroups?: Array<{ group: { id: string } }>;
  templatePersonalityTraits?: Array<{ trait: { id: string } }>;
}

export interface EvaluationPreviewGroupLike {
  id: string;
  name: string;
  color?: string;
}

export interface EvaluationTemplatePreviewAssignment<TItem extends { id: string; name: string; groupId?: string }> {
  id: string;
  item?: TItem;
}

export interface EvaluationTemplatePreviewSection<TItem extends { id: string; name: string; groupId?: string }> {
  id: string;
  name: string;
  color?: string;
  items: Array<{ id: string; item: TItem }>;
  isUngrouped?: boolean;
}

export interface PositionSkillLike {
  skillId: string;
}

export interface PositionTraitLike {
  traitId: string;
}

export interface EvaluationTemplateApplyNamedItem {
  id: string;
  name: string;
}

export type EvaluationTemplateApplyTaskKind =
  | 'expertise-group'
  | 'expertise-skill'
  | 'personality-group'
  | 'personality-trait';

export interface EvaluationTemplateApplyTask {
  kind: EvaluationTemplateApplyTaskKind;
  id: string;
  name: string;
  payload: Record<string, unknown>;
  duplicateOkStatus: number;
}

export interface EvaluationTemplateApplyTaskResult {
  ok: boolean;
  status?: number;
  id: string;
  name: string;
}
