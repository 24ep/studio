import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { HeadcountFormSectionProps } from './HeadcountModalFormTypes';
import { HrEmployeeSearchSelect } from '@/components/hr/HrEmployeeSearchSelect';

export function HeadcountDateFields({
  formData,
  loading,
  setFormData,
}: HeadcountFormSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="requestDate">Request Date</Label>
        <Input
          id="requestDate"
          type="date"
          value={formData.requestDate}
          onChange={(event) => setFormData(prev => ({ ...prev, requestDate: event.target.value }))}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="onboardingDate">Onboarding Date</Label>
        <Input
          id="onboardingDate"
          type="date"
          value={formData.onboardingDate}
          onChange={(event) => setFormData(prev => ({ ...prev, onboardingDate: event.target.value }))}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export function HeadcountIdentifierFields({
  formData,
  loading,
  setFormData,
}: HeadcountFormSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="memoId">Memo ID</Label>
        <Input
          id="memoId"
          placeholder="Enter memo ID..."
          value={formData.memoId}
          onChange={(event) => setFormData(prev => ({ ...prev, memoId: event.target.value }))}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employeeId">Employee</Label>
        <HrEmployeeSearchSelect
          id="employeeId"
          value={formData.employeeId}
          valueMode="employeeNumber"
          onValueChange={(employeeId) => setFormData(prev => ({ ...prev, employeeId }))}
          disabled={loading}
        />
      </div>
    </div>
  );
}
