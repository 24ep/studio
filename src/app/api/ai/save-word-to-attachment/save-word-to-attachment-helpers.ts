import { v4 as uuidv4 } from "uuid";

import { minioClient } from "@/lib/minio";
import { MINIO_BUCKET } from "@/lib/minio-constants";
import { canEditApplicant, hasAnyPermission } from "@/lib/permissions";

type PermissionUser = Parameters<typeof hasAnyPermission>[0];

export interface SaveWordToAttachmentBody {
  applicantId: string;
  content: string;
  fileName?: string;
  promptName?: string;
}

export function getSaveWordAttachmentPermissionFlags(user: PermissionUser) {
  return {
    hasGlobalEditPermission: hasAnyPermission(user, ["applicantS_EDIT_BASIC", "applicantS_EDIT_SENSITIVE"]),
    hasOwnEditPermission: hasAnyPermission(user, ["applicantS_EDIT_BASIC_OWN", "applicantS_EDIT_SENSITIVE_OWN"]),
  };
}

export function canAttemptSaveWordAttachment({
  hasGlobalEditPermission,
  hasOwnEditPermission,
}: ReturnType<typeof getSaveWordAttachmentPermissionFlags>) {
  return hasGlobalEditPermission || hasOwnEditPermission;
}

export function parseSaveWordToAttachmentBody(body: unknown): SaveWordToAttachmentBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const value = body as Record<string, unknown>;
  if (typeof value.applicantId !== "string" || typeof value.content !== "string") {
    return null;
  }

  return {
    applicantId: value.applicantId,
    content: value.content,
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
    promptName: typeof value.promptName === "string" ? value.promptName : undefined,
  };
}

export function getSaveWordOwnershipFailure({
  applicantRecruiterId,
  hasGlobalEditPermission,
  user,
}: {
  applicantRecruiterId: string | null;
  hasGlobalEditPermission: boolean;
  user: PermissionUser & { id: string };
}) {
  if (hasGlobalEditPermission) {
    return null;
  }

  const editPermission = canEditApplicant(user, applicantRecruiterId, user.id);
  return editPermission.canEdit ? null : editPermission.reason;
}

export function buildWordAttachmentContent({
  content,
  title,
}: {
  content: string;
  title: string;
}) {
  return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowRevisions/>
            <w:DoNotPrintRevisions/>
            <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
            <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
            <w:UseMarginsForDrawingGridOrigin/>
            <w:ValidateAgainstSchemas/>
            <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
            <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
            <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
            <w:Compatibility>
              <w:BreakWrappedTables/>
              <w:SnapToGridInCell/>
              <w:WrapTextWithPunct/>
              <w:UseAsianBreakRules/>
              <w:DontGrowAutofit/>
            </w:Compatibility>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: var(--font-dm-sans), 'DM Sans', 'IBM Plex Sans Thai', sans-serif; line-height: 1.6; font-size: 11pt; }
          h1, h2, h3 { color: #333; font-weight: 600; }
          h1 { font-size: 18pt; margin: 20px 0 10px 0; }
          h2 { font-size: 16pt; margin: 18px 0 8px 0; }
          h3 { font-size: 14pt; margin: 16px 0 6px 0; }
          ul, ol { margin: 10px 0; padding-left: 20px; }
          li { margin: 5px 0; }
          p { margin: 10px 0; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10pt; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: 600; }
          blockquote { border-left: 4px solid #ddd; margin: 10px 0; padding-left: 20px; font-style: italic; }
          code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
          strong { font-weight: 600; }
          em { font-style: italic; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
}

export function buildWordAttachmentNames({
  applicantId,
  fileName,
  promptName,
}: {
  applicantId: string;
  fileName?: string;
  promptName?: string;
}) {
  const timestamp = new Date().toISOString().split("T")[0];
  return {
    finalFileName: fileName || `AI-Generated-${promptName || "Content"}-${timestamp}.doc`,
    objectName: `attachments/${applicantId}/${uuidv4()}.doc`,
  };
}

export async function uploadWordAttachmentObject({
  objectName,
  wordContent,
}: {
  objectName: string;
  wordContent: string;
}) {
  const buffer = Buffer.from(wordContent, "utf-8");
  await minioClient.putObject(
    MINIO_BUCKET,
    objectName,
    buffer,
    undefined,
    { "Content-Type": "application/msword" },
  );
}
