import { Eye } from 'lucide-react';

import { CustomizeBoardMultiSelect } from './CustomizeBoardMultiSelect';
import type { CardFieldsSectionProps } from './CustomizeBoardModalTypes';
import { useLocalization } from '@/contexts/LocalizationContext';

export function CardFieldsSection({
  cardFields,
  setVisibleFields,
  visibleFields,
}: CardFieldsSectionProps) {
  const { t } = useLocalization();

  return (
    <div className="bg-muted/40 rounded-xl p-6 shadow-sm border flex flex-col gap-4">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
        <Eye className="w-5 h-5" /> {t("tasks.customizeBoard.cardFieldsTitle", "Card Fields to Show")}
      </h2>
      <CustomizeBoardMultiSelect
        options={cardFields.map((field) => ({ key: field.key, label: field.label, icon: field.icon }))}
        selected={visibleFields}
        onChange={setVisibleFields}
        placeholder={t("tasks.customizeBoard.cardFieldsPlaceholder", "Select fields to show on each card...")}
        maxHeight="400px"
      />
      <p className="text-xs text-muted-foreground mt-2">
        {t(
          "tasks.customizeBoard.cardFieldsHint",
          "Choose which fields are visible on each Applicant card in the board view. Drag to reorder in the future.",
        )}
      </p>
    </div>
  );
}
