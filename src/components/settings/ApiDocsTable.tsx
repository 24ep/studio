import React from 'react';

interface ApiDocsTableProps {
  docs: any[];
  isLoading: boolean;
  onEdit: (doc: any) => void;
}

const ApiDocsTable: React.FC<ApiDocsTableProps> = ({ docs, isLoading, onEdit }) => {
  return (
    <div>
      <h2>API Docs Table</h2>
      {/* Render API docs in a table here */}
    </div>
  );
};

export default ApiDocsTable; 