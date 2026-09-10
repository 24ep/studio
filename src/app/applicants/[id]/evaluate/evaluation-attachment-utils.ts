import type { EvaluationAttachment } from './types';

export const buildPreviewUrl = (
  att: EvaluationAttachment,
  applicantId: string,
  thumbnail: boolean = false
): string => {
  if (att.filePath) {
    const params = new URLSearchParams({ filePath: att.filePath });
    if (att.fileName) params.set('fileName', att.fileName);
    if (applicantId) params.set('applicantId', applicantId);
    if (thumbnail) params.set('thumbnail', 'true');
    return `/api/secure-file/preview?${params.toString()}`;
  }

  let url = att.url || '';
  if (url.includes('/api/secure-file/stream')) {
    url = url.replace('/api/secure-file/stream', '/api/secure-file/preview');
  }

  if (thumbnail && url.includes('/api/secure-file/preview')) {
    try {
      const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8021');
      urlObj.searchParams.set('thumbnail', 'true');
      return urlObj.toString();
    } catch {
      return `${url}${url.includes('?') ? '&' : '?'}thumbnail=true`;
    }
  }

  return url;
};

export const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName || '');
};

export const isPdfFile = (fileName: string): boolean => {
  return /\.pdf$/i.test(fileName || '');
};

export const isDocumentFile = (fileName: string): boolean => {
  return /\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/i.test(fileName || '');
};

export const getScoreColor = (score: number) => {
  if (!score) return { bg: 'bg-muted', text: 'text-white', border: 'border-muted-foreground/20', bgColor: '#6b7280', borderColor: '#6b7280' };
  switch (score) {
    case 1:
      return { bg: 'bg-[#E84040]', text: 'text-white', border: 'border-[#E84040]', bgColor: '#E84040', borderColor: '#E84040' };
    case 2:
      return { bg: 'bg-[#F4A340]', text: 'text-white', border: 'border-[#F4A340]', bgColor: '#F4A340', borderColor: '#F4A340' };
    case 3:
      return { bg: 'bg-[#F1D24A]', text: 'text-white', border: 'border-[#F1D24A]', bgColor: '#F1D24A', borderColor: '#F1D24A' };
    case 4:
      return { bg: 'bg-[#63E25F]', text: 'text-white', border: 'border-[#63E25F]', bgColor: '#63E25F', borderColor: '#63E25F' };
    case 5:
      return { bg: 'bg-[#2E7D32]', text: 'text-white', border: 'border-[#2E7D32]', bgColor: '#2E7D32', borderColor: '#2E7D32' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground/20', bgColor: '#6b7280', borderColor: '#6b7280' };
  }
};
