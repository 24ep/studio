export interface HeadcountTypeOption {
  value: string;
  label: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

export function createDefaultHeadcountTypeOption(sortOrder: number): HeadcountTypeOption {
  return {
    value: "",
    label: "",
    color: "#3B82F6",
    sortOrder,
    isActive: true,
  };
}
