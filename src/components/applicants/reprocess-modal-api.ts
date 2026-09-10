import { v4 as uuidv4 } from "uuid";

import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "@/lib/response-json";
import type { ReprocessAttachment } from "./reprocess-modal-utils";

async function readQueueError(response: Response) {
  let errorMessage = "Failed to add file to processing queue";

  const errorData = await readJsonObject(response.clone());
  if (Object.keys(errorData).length > 0) {
    return getJsonErrorMessage(errorData, errorMessage);
  }

  try {
    return await response.text() || errorMessage;
  } catch {
    return `${errorMessage} (Status: ${response.status} ${response.statusText})`;
  }
}

export async function addAttachmentToReprocessQueue({
  applicantId,
  applicantSourceId,
  selectedAttachmentData,
  selectedPositionId,
}: {
  applicantId: string;
  applicantSourceId?: string | null;
  selectedAttachmentData: ReprocessAttachment;
  selectedPositionId: string;
}) {
  const response = await fetch("/api/upload-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_path: selectedAttachmentData.filePath,
      file_name: selectedAttachmentData.fileName,
      file_size: 0,
      status: "queued",
      source: "reprocess",
      upload_id: uuidv4(),
      position_id: selectedPositionId,
      source_id: applicantSourceId,
      webhook_payload: {
        Applicant_id: applicantId,
        request_type: "update",
        source: "reprocess",
        attachment_id: selectedAttachmentData.id,
        sourceId: applicantSourceId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await readQueueError(response));
  }

  await readJsonOrFallback(response, null);
}
