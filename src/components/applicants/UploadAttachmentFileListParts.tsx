import {
  DocumentIcon as FileIcon,
  DocumentTextIcon as FileText,
  PhotoIcon as ImageIcon,
  TagIcon as Tag,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatAttachmentSize,
  getAttachmentIconKind,
  PREDEFINED_ATTACHMENT_TAGS,
} from "./upload-attachments-modal-utils";

interface UploadAttachmentFileRowProps {
  file: File;
  tag: string;
  index: number;
  isUploading: boolean;
  onRemoveFile: (index: number) => void;
  onUpdateFileTag: (index: number, tag: string) => void;
}

interface AttachmentTagSelectProps {
  value: string;
  isUploading: boolean;
  onValueChange: (value: string) => void;
}

export function UploadAttachmentFileRow({
  file,
  tag,
  index,
  isUploading,
  onRemoveFile,
  onUpdateFileTag,
}: UploadAttachmentFileRowProps) {
  return (
    <div className="p-3 bg-muted rounded-md text-sm border border-border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AttachmentFileIcon file={file} />
          <span className="truncate font-medium">{file.name}</span>
          <span className="text-muted-foreground text-xs">
            ({formatAttachmentSize(file.size)})
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveFile(index)}
          disabled={isUploading}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <AttachmentTagSelect
        value={tag}
        isUploading={isUploading}
        onValueChange={(value) => onUpdateFileTag(index, value)}
      />
    </div>
  );
}

export function UploadAttachmentEmptyTagHint() {
  return (
    <div className="space-y-2">
      <Label>File Tags (select files first)</Label>
      <div className="p-3 bg-muted/50 rounded-md text-sm border border-dashed border-border">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <Select disabled>
            <SelectTrigger className="h-8 text-sm w-full bg-background border border-border">
              <SelectValue placeholder="Select files to add tags" />
            </SelectTrigger>
            <SelectContent selectId="upload-attachments-bulk-tag-select">
              {PREDEFINED_ATTACHMENT_TAGS.map((tagOption) => (
                <SelectItem key={tagOption.value} value={tagOption.value}>
                  {tagOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function AttachmentTagSelect({
  value,
  isUploading,
  onValueChange,
}: AttachmentTagSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Tag className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onValueChange} disabled={isUploading}>
        <SelectTrigger className="h-8 text-sm w-full bg-background border border-border hover:bg-accent hover:text-accent-foreground">
          <SelectValue placeholder="Select file type" />
        </SelectTrigger>
        <SelectContent selectId="upload-attachments-file-type-select">
          {PREDEFINED_ATTACHMENT_TAGS.map((tagOption) => (
            <SelectItem key={tagOption.value} value={tagOption.value}>
              {tagOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AttachmentFileIcon({ file }: { file: File }) {
  const iconKind = getAttachmentIconKind(file);

  if (iconKind === "image") {
    return <ImageIcon className="w-4 h-4 text-blue-500" />;
  }

  if (iconKind === "pdf") {
    return <FileText className="w-4 h-4 text-red-500" />;
  }

  return <FileIcon className="w-4 h-4 text-gray-500" />;
}
