import React from 'react';

interface StagesTableProps {
  stages: any[];
  isLoading: boolean;
  onEdit: (stage: any) => void;
}

const StagesTable: React.FC<StagesTableProps> = ({ stages, isLoading, onEdit }) => {
  return (
    <div>
      <h2>Stages Table</h2>
      {/* Render stages in a table here */}
    </div>
  );
};

export default StagesTable; 