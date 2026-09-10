import { NextResponse, type NextRequest } from "next/server";
import { readRequestJsonResult } from "@/lib/request-json";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function validateJsonBodySize(request: NextRequest) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return null;
  }

  const { securityConfig } = await import("@/lib/securityConfig");
  const maxSize = securityConfig.requestBody?.maxJsonSize || 10 * 1024 * 1024;
  const size = parseInt(contentLength, 10);

  return size > maxSize
    ? NextResponse.json({
      message: `Request body too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
    }, { status: 413 })
    : null;
}

async function addMultipartImageSetting(
  formData: FormData,
  settingsToSave: unknown[],
  formKey: string,
  settingKey: string,
) {
  const file = formData.get(formKey);
  if (!file || typeof file === "string") {
    return;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  settingsToSave.push({
    key: settingKey,
    value: `data:${file.type};base64,${buffer.toString("base64")}`,
  });
}

async function parseMultipartSettings(formData: FormData) {
  const settingsToSave: unknown[] = [];

  for (const entry of formData.getAll("preferences")) {
    if (typeof entry !== "string") {
      continue;
    }

    try {
      const parsed = JSON.parse(entry);
      if (Array.isArray(parsed)) {
        settingsToSave.push(...parsed);
      } else {
        settingsToSave.push(parsed);
      }
    } catch (parseError) {
      console.error("Failed to parse preferences entry:", entry, parseError);
      throw parseError;
    }
  }

  await addMultipartImageSetting(formData, settingsToSave, "logo", "appLogoDataUrl");
  await addMultipartImageSetting(formData, settingsToSave, "favicon", "appFaviconDataUrl");
  await addMultipartImageSetting(formData, settingsToSave, "loginBackgroundImage", "loginPageBackgroundImageUrl");
  await addMultipartImageSetting(formData, settingsToSave, "loginPageBackgroundImageMobile", "loginPageBackgroundImageUrlMobile");
  await addMultipartImageSetting(formData, settingsToSave, "splashLogoImage", "splashLogoDataUrl");

  return settingsToSave;
}

export async function parseSettingsToSave(request: NextRequest): Promise<unknown[] | NextResponse> {
  try {
    if ((request.headers.get("content-type") || "").includes("multipart/form-data")) {
      return parseMultipartSettings(await request.formData());
    }

    const bodySizeError = await validateJsonBodySize(request);
    if (bodySizeError) {
      return bodySizeError;
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      throw bodyResult.error;
    }

    return Array.isArray(bodyResult.value) ? bodyResult.value : [];
  } catch (error) {
    return NextResponse.json(
      { message: "Error parsing request body", error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

export { getErrorMessage };
