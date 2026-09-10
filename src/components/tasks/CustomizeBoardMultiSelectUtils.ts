import type { BoardFieldOption } from "./CustomizeBoardMultiSelectParts";

export function getValidBoardFieldOptions(options: BoardFieldOption[]) {
  return options.filter((option) => (
    option &&
    typeof option.key === "string" &&
    option.key.trim() !== ""
  ));
}

export function filterBoardFieldOptions(
  options: BoardFieldOption[],
  searchTerm: string,
) {
  const normalizedSearchTerm = searchTerm.toLowerCase();

  return options.filter((option) => (
    option.label.toLowerCase().includes(normalizedSearchTerm) ||
    option.key.toLowerCase().includes(normalizedSearchTerm)
  ));
}

export function getNextBoardFieldSelection(selected: string[], value: string) {
  return selected.includes(value)
    ? selected.filter((selectedValue) => selectedValue !== value)
    : [...selected, value];
}

export function getSelectAllBoardFieldSelection(
  filteredOptions: BoardFieldOption[],
  selected: string[],
) {
  return selected.length === filteredOptions.length
    ? []
    : filteredOptions.map((option) => option.key);
}
