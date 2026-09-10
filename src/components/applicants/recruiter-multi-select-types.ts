export interface RecruiterMultiSelectOption {
  id: string;
  name: string;
  avatarUrl?: string;
  personalColor?: string;
}

export interface RecruiterMultiSelectDropdownProps {
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  recruiters: RecruiterMultiSelectOption[];
}
