export function parseInitialInterviewDateTime(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date,
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

export function createInterviewDateTime(date: Date | undefined, time: string): Date | undefined {
  if (!date) {
    return undefined;
  }

  const [hours, minutes] = time.split(':').map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return nextDate;
}

export function buildEvaluationQrDownloadFilename(applicantName: string): string {
  return `evaluation-qr-${applicantName.trim().replace(/\s+/g, '_') || 'applicant'}.png`;
}
