export interface GeminiModelOption {
  name: string;
  displayName: string;
  fullName?: string;
}

export interface GeminiApiModel {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}

export interface GeminiModelsResponse {
  models?: unknown;
  error?: unknown;
}

export const DEFAULT_GEMINI_MODEL = "gemini-1.0-pro";

const GEMINI_MODEL_PRIORITY = ["gemini-2.0", "gemini-1.5", "gemini-1.0"];
const SAFE_MODEL_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export function isGeminiApiModel(value: unknown): value is GeminiApiModel {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as { name?: unknown }).name === "string"
  );
}

export function getGeminiApiModels(data: GeminiModelsResponse) {
  return Array.isArray(data.models) ? data.models.filter(isGeminiApiModel) : [];
}

export function extractModelName(fullModelName: string): string {
  if (!fullModelName) return "";

  return fullModelName.startsWith("models/")
    ? fullModelName.replace("models/", "")
    : fullModelName;
}

export function formatAvailableGeminiModels(models: GeminiApiModel[]): GeminiModelOption[] {
  return models
    .filter(isGenerativeGeminiModel)
    .map((model): GeminiModelOption => ({
      name: extractModelName(model.name),
      displayName: model.displayName || extractModelName(model.name),
      fullName: model.name,
    }))
    .sort(compareGeminiModels);
}

export function getFallbackModels(): GeminiModelOption[] {
  return [
    { name: DEFAULT_GEMINI_MODEL, displayName: "Gemini 1.0 Pro" },
    { name: "gemini-1.0-pro-latest", displayName: "Gemini 1.0 Pro Latest" },
    { name: "gemini-1.5-flash", displayName: "Gemini 1.5 Flash" },
    { name: "gemini-1.5-flash-latest", displayName: "Gemini 1.5 Flash Latest" },
    { name: "gemini-2.0-flash-exp", displayName: "Gemini 2.0 Flash Experimental" },
  ];
}

export function isSafeGeminiModelName(modelName: string) {
  return SAFE_MODEL_NAME_PATTERN.test(modelName) &&
    !modelName.includes("..") &&
    !modelName.includes("/") &&
    !modelName.includes("\\");
}

function isGenerativeGeminiModel(model: GeminiApiModel) {
  return model.supportedGenerationMethods?.includes("generateContent") &&
    model.name.includes("gemini");
}

function compareGeminiModels(a: GeminiModelOption, b: GeminiModelOption) {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();
  const aPriority = getGeminiModelPriority(aName);
  const bPriority = getGeminiModelPriority(bName);

  return aPriority === bPriority
    ? aName.localeCompare(bName)
    : aPriority - bPriority;
}

function getGeminiModelPriority(modelName: string) {
  const priorityIndex = GEMINI_MODEL_PRIORITY.findIndex((prefix) => modelName.includes(prefix));
  return priorityIndex === -1 ? GEMINI_MODEL_PRIORITY.length : priorityIndex;
}
