import type {
  AdvancedQueryShortcut,
  AdvancedQueryTip,
} from "./advanced-query-syntax-types";

export const ADVANCED_QUERY_SHORTCUT_GROUPS: AdvancedQueryShortcut[][] = [
  [
    { label: "Apply Query", keys: "Enter" },
    { label: "Clear Query", keys: "Ctrl+Backspace" },
    { label: "Open Syntax Guide", keys: "Ctrl+?" },
  ],
  [
    { label: "Quick Commands", keys: "Ctrl+Space" },
    { label: "Copy Query", keys: "Ctrl+C" },
    { label: "Paste Query", keys: "Ctrl+V" },
  ],
];

export const ADVANCED_QUERY_TIPS: AdvancedQueryTip[] = [
  { text: "Use comma-separated values for multiple options:", code: "status:Applied,Screening" },
  { text: "Combine multiple filters for precise searches" },
  { text: "Fit scores are percentages (0-100), not decimals" },
  { text: "Text searches are case-insensitive" },
  { text: "Use quotes for values with spaces:", code: 'name:"John Smith"' },
  { text: "Use this value to find records without assignment:", code: "unassigned" },
  { text: "Date format: YYYY-MM-DD", code: "2024-01-15" },
];

export function getAdvancedQueryExampleCopyKey(categoryName: string, exampleIndex: number) {
  return `${categoryName}-${exampleIndex}`;
}
