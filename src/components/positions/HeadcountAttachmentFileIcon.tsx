import { FileText } from 'lucide-react';

import { getHeadcountAttachmentIconClassName } from './headcount-attachment-utils';

export function HeadcountAttachmentFileIcon({ fileName }: { fileName: string }) {
  return <FileText className={`h-5 w-5 ${getHeadcountAttachmentIconClassName(fileName)}`} />;
}
