import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { HeadcountFormSectionProps } from './HeadcountModalFormTypes';

export function HeadcountNotesField({
  formData,
  setFormData,
}: Pick<HeadcountFormSectionProps, 'formData' | 'setFormData'>) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        placeholder="Add any additional notes..."
        value={formData.notes}
        onChange={(event) => setFormData(prev => ({ ...prev, notes: event.target.value }))}
        rows={3}
      />
    </div>
  );
}
