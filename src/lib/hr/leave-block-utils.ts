export interface LeaveBlockValues {
  name?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  scope?: unknown;
  targetValue?: unknown;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getLeaveBlockValidationError(values: LeaveBlockValues) {
  const startText = text(values.startDate);
  const endText = text(values.endDate);
  const scope = text(values.scope) || 'all';
  const targetValue = text(values.targetValue);

  if (startText && endText) {
    const startDate = new Date(startText);
    const endDate = new Date(endText);
    if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
      return 'Leave block dates are invalid';
    }
    if (endDate < startDate) {
      return 'End date must be on or after start date';
    }
  }

  if ((scope === 'department' || scope === 'location') && !targetValue) {
    return `Target ${scope} is required`;
  }

  return null;
}
