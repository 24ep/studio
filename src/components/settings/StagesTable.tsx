import React, { useCallback } from 'react';
import { ColorPicker } from '@/components/ui/color-picker';
import type { RecruitmentStageColorField, RecruitmentStageRow } from './recruitment-stage-ui-types';

interface StagesTableProps {
  stages: RecruitmentStageRow[];
  isLoading: boolean;
  onEdit: (stage: RecruitmentStageRow) => void;
  onColorChange: (stage: RecruitmentStageRow, colorType: RecruitmentStageColorField, newColor: string) => void;
}

const StagesTable: React.FC<StagesTableProps> = ({ stages, isLoading, onEdit, onColorChange }) => {
  const handleEdit = useCallback((stage: RecruitmentStageRow) => {
    onEdit(stage);
  }, [onEdit]);

  const handleColorChange = useCallback((stage: RecruitmentStageRow, colorType: RecruitmentStageColorField, newColor: string) => {
    onColorChange(stage, colorType, newColor);
  }, [onColorChange]);
  return (
    <div>
      <h2>Stages Table</h2>
      <table className="min-w-full border text-sm mt-4">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Sort Order</th>
            <th className="px-4 py-2 text-left">Complete Color</th>
            <th className="px-4 py-2 text-left">Badge Color</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => (
            <tr key={stage.id}>
              <td className="px-4 py-2">{stage.name}</td>
              <td className="px-4 py-2">{stage.description}</td>
              <td className="px-4 py-2">{stage.sort_order}</td>
              <td className="px-4 py-2">
                <ColorPicker
                  value={stage.color_complete || "#ffffff"}
                  onChange={(color) => handleColorChange(stage, "color_complete", color)}
                  className="w-32"
                />
              </td>
              <td className="px-4 py-2">
                <ColorPicker
                  value={stage.color_badge || "#ffffff"}
                  onChange={(color) => handleColorChange(stage, "color_badge", color)}
                  className="w-32"
                />
              </td>
              <td className="px-4 py-2">
                <button type="button" className="text-blue-600 hover:underline" onClick={() => handleEdit(stage)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StagesTable; 
