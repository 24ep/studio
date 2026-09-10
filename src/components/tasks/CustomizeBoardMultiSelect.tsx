import { useState } from 'react';
import {
  type BoardFieldOption,
  CustomizeBoardMultiSelectBackdrop,
  CustomizeBoardMultiSelectDropdown,
  CustomizeBoardMultiSelectTrigger,
} from './CustomizeBoardMultiSelectParts';
import {
  filterBoardFieldOptions,
  getNextBoardFieldSelection,
  getSelectAllBoardFieldSelection,
  getValidBoardFieldOptions,
} from './CustomizeBoardMultiSelectUtils';

export type { BoardFieldOption } from './CustomizeBoardMultiSelectParts';

interface CustomizeBoardMultiSelectProps {
  options: BoardFieldOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxHeight?: string;
}

export function CustomizeBoardMultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  maxHeight = '200px',
}: CustomizeBoardMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const validOptions = getValidBoardFieldOptions(options);
  const filteredOptions = filterBoardFieldOptions(validOptions, searchTerm);

  const handleSelect = (value: string) => {
    onChange(getNextBoardFieldSelection(selected, value));
  };

  const handleSelectAll = () => {
    onChange(getSelectAllBoardFieldSelection(filteredOptions, selected));
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((selectedValue) => selectedValue !== value));
  };

  return (
    <div className="relative">
      <CustomizeBoardMultiSelectTrigger
        open={open}
        placeholder={placeholder}
        selected={selected}
        validOptions={validOptions}
        onRemove={handleRemove}
        onToggle={() => setOpen((currentOpen) => !currentOpen)}
      />

      {open && (
        <CustomizeBoardMultiSelectDropdown
          filteredOptions={filteredOptions}
          maxHeight={maxHeight}
          searchTerm={searchTerm}
          selected={selected}
          validOptions={validOptions}
          onSearchChange={setSearchTerm}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />
      )}

      {open && <CustomizeBoardMultiSelectBackdrop onClose={() => setOpen(false)} />}
    </div>
  );
}
