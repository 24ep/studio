import type { SystemPrompt } from "./generative-ai-modal-types";

export function buildGenerativeAIAttachmentFileName({
  applicantName,
  selectedPrompt,
  timestamp = new Date().toISOString().split("T")[0],
}: {
  applicantName?: string;
  selectedPrompt: SystemPrompt | null;
  timestamp?: string;
}) {
  const applicantLabel = applicantName || "applicant";

  return selectedPrompt
    ? `${selectedPrompt.name}-${applicantLabel}-${timestamp}.doc`
    : `AI-Generated-${applicantLabel}-${timestamp}.doc`;
}

export function normalizeGenerativeAIAttachmentFileName(fileName: string) {
  const trimmedFileName = fileName.trim();
  return trimmedFileName.endsWith(".doc") ? trimmedFileName : `${trimmedFileName}.doc`;
}
