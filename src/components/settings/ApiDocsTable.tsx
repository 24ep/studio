import React from 'react';

export interface ApiDocRecord {
  id?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

interface ApiDocsTableProps {
  docs: ApiDocRecord[];
  isLoading: boolean;
  onEdit: (doc: ApiDocRecord) => void;
}

const ApiDocsTable: React.FC<ApiDocsTableProps> = ({ docs, isLoading, onEdit }) => {
  if (isLoading) {
    return <div>Loading API docs...</div>;
  }

  return (
    <div>
      <h2>API Docs Table</h2>
      {docs.map((doc, index) => (
        <button
          key={doc.id ?? index}
          type="button"
          onClick={() => onEdit(doc)}
        >
          {doc.title ?? doc.id ?? `API doc ${index + 1}`}
        </button>
      ))}
    </div>
  );
};

export default ApiDocsTable; 
