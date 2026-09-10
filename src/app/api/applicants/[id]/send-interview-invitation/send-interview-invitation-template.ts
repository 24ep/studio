import QRCode from 'qrcode';

export function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return result;
}

export function getInterviewDateTimes(interviewDate: string, interviewTime: string, duration: number) {
  const interviewDateTime = new Date(interviewDate);
  const [hours, minutes] = interviewTime.split(':').map(Number);
  interviewDateTime.setHours(hours, minutes, 0, 0);

  return {
    interviewDateTime,
    endDateTime: new Date(interviewDateTime.getTime() + duration * 60 * 1000),
  };
}

export function formatInterviewDateTime(interviewDateTime: Date) {
  return {
    interviewDateFormatted: interviewDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    interviewTimeFormatted: interviewDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

export async function buildEvaluationQrImageHtml(evaluationLink: string | null): Promise<string> {
  if (!evaluationLink) {
    return '';
  }

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(evaluationLink, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return `<img src="${qrCodeDataUrl}" alt="QR Code" style="display: block; margin: 10px auto; max-width: 200px; border: 2px solid #ddd; border-radius: 8px; padding: 10px; background: white;" />`;
  } catch (qrError) {
    console.error('[SendInvitation] Failed to generate QR code:', qrError);
    return '';
  }
}
