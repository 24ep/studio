import { toast } from "react-hot-toast";

import { getJsonErrorMessage, getJsonString, readJsonObject, readJsonOrFallback } from "@/lib/response-json";
import { sanitizeHtml, sanitizeUrl } from "@/lib/security";
import type { SystemPrompt } from "./generative-ai-modal-types";
import {
  buildGenerativeAIPdfHtml,
  buildGenerativeAIWordHtml,
} from "./generative-ai-modal-download-content";

export async function fetchGenerativeAISystemPrompts() {
  const response = await fetch("/api/settings/system-prompts", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch system prompts");
  }

  const data = await readJsonOrFallback<unknown>(response, []);
  return Array.isArray(data) ? data as SystemPrompt[] : [];
}

export async function fetchGenerativeAICanvasModeEnabled() {
  const response = await fetch("/api/settings/system-settings", {
    credentials: "include",
  });

  if (!response.ok) {
    return false;
  }

  const data = await readJsonObject(response);
  return data.generativeAICanvasMode === "true" || data.generativeAICanvasMode === true;
}

export async function generateApplicantAIContent({
  applicantId,
  selectedPrompt,
}: {
  applicantId?: string;
  selectedPrompt: SystemPrompt;
}) {
  const response = await fetch("/api/ai/generate-content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      applicantId,
      systemPrompt: selectedPrompt.content,
      promptName: selectedPrompt.name,
      promptCategory: selectedPrompt.categoryName,
    }),
  });

  const data = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(data, "Failed to generate content"));
  }

  if (data.unavailable || data.success === false) {
    throw new Error(getJsonErrorMessage(data, "AI content generation is temporarily unavailable"));
  }

  return getJsonString(data, "content") || "";
}

export async function copyGenerativeAIContentToClipboard(generatedContent: string) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = sanitizeHtml(generatedContent);
  const plainText = tempDiv.textContent || tempDiv.innerText || "";

  await navigator.clipboard.writeText(plainText);
}

export function downloadGenerativeAIContentAsPdf(generatedContent: string) {
  const blob = new Blob([buildGenerativeAIPdfHtml(generatedContent)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const safeUrl = sanitizeUrl(url);

  if (safeUrl) {
    const printWindow = window.open(safeUrl, "_blank", "noopener,noreferrer");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  toast.success("PDF download initiated - use browser print dialog to save as PDF");
}

export function downloadGenerativeAIContentAsWord(generatedContent: string) {
  const blob = new Blob([buildGenerativeAIWordHtml(generatedContent)], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const safeUrl = sanitizeUrl(url);

  if (safeUrl) {
    const link = document.createElement("a");
    link.href = safeUrl;
    link.download = `generated-content-${new Date().toISOString().split("T")[0]}.doc`;
    link.click();
  }

  URL.revokeObjectURL(url);
}

export async function saveGenerativeAIContentToAttachment({
  applicantId,
  content,
  fileName,
  promptName,
}: {
  applicantId?: string;
  content: string;
  fileName: string;
  promptName?: string;
}) {
  const response = await fetch("/api/ai/save-word-to-attachment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      applicantId,
      content,
      fileName,
      promptName: promptName || "Generated Content",
    }),
  });

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), "Failed to save to attachments"));
  }
}
