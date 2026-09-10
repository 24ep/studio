export function formatVerboseMonthDuration(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0 && months === 0) {
    return "";
  }

  return [
    years > 0 ? `${years} year${years > 1 ? "s" : ""}` : null,
    months > 0 ? `${months} month${months > 1 ? "s" : ""}` : null,
  ].filter(Boolean).join(" ");
}

export function formatCompactMonthDuration(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0 && months === 0) {
    return "";
  }

  return [
    years > 0 ? `${years}Y` : null,
    months > 0 ? `${months}M` : null,
  ].filter(Boolean).join(" ");
}
