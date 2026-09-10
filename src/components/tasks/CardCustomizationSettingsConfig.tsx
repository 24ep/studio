import {
  Briefcase,
  Eye,
  HardDrive,
  Mail,
  Monitor,
  Target,
  User,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';

import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';

export type CardCustomizationTab = 'width' | 'fields';
export type TaskBoardCardWidth = TaskBoardPreferences['cardWidth'];
export type TaskBoardCardVisibilityKey =
  | 'showAvatar'
  | 'showName'
  | 'showEmail'
  | 'showFitScore'
  | 'showAssignee'
  | 'showSkills'
  | 'showJobApplied';

export interface CardFieldConfig {
  key: TaskBoardCardVisibilityKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  defaultEnabled: boolean;
}

export const CARD_CUSTOMIZATION_TABS = [
  { value: 'width', label: 'Card Width', icon: Monitor },
  { value: 'fields', label: 'Visible Fields', icon: Eye },
] satisfies Array<{
  value: CardCustomizationTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}>;

export const cardFieldConfigs: CardFieldConfig[] = [
  { key: 'showAvatar', label: 'Avatar', icon: User, defaultEnabled: true },
  { key: 'showName', label: 'Name', icon: User, defaultEnabled: true },
  { key: 'showEmail', label: 'Email', icon: Mail, defaultEnabled: true },
  { key: 'showFitScore', label: 'Fit Score', icon: Target, defaultEnabled: true },
  { key: 'showAssignee', label: 'Assignee', icon: Users, defaultEnabled: false },
  { key: 'showSkills', label: 'Skills', icon: HardDrive, defaultEnabled: false },
  { key: 'showJobApplied', label: 'Job Applied', icon: Briefcase, defaultEnabled: false },
];

export const cardWidthOptions = [
  { value: 'narrow', label: 'Narrow (200px)', width: 200 },
  { value: 'medium', label: 'Medium (256px)', width: 256 },
  { value: 'wide', label: 'Wide (320px)', width: 320 },
  { value: 'custom', label: 'Custom', width: null },
] satisfies Array<{ value: TaskBoardCardWidth; label: string; width: number | null }>;
