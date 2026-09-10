export interface AdvancedQueryFieldDefinition {
  field: string;
  description: string;
  example: string;
}

export interface AdvancedQueryExample {
  query: string;
  description: string;
}

export interface AdvancedQueryExampleCategory {
  name: string;
  description: string;
  examples: AdvancedQueryExample[];
}

export interface AdvancedQuerySpecialValue {
  value: string;
  description: string;
}

export interface AdvancedQueryShortcut {
  label: string;
  keys: string;
}

export interface AdvancedQueryTip {
  text: string;
  code?: string;
}
