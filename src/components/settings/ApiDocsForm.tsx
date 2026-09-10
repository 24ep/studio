import React from 'react';
import { X } from 'lucide-react';

import type { ApiDocRecord } from './ApiDocsTable';

interface ApiDocsFormProps {
  open: boolean;
  doc: ApiDocRecord | null;
  onClose: () => void;
  onSubmit: (data: ApiDocRecord) => void;
}

const ApiDocsForm: React.FC<ApiDocsFormProps> = ({ open, doc, onClose, onSubmit }) => {
  if (!open) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Close API docs form"
      >
        <X className="h-4 w-4" />
      </button>
      <h2>API Docs Form</h2>
      <button type="button" onClick={() => onSubmit(doc ?? {})}>
        Save
      </button>
    </div>
  );
};

export default ApiDocsForm; 
