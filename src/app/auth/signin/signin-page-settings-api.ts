import { readJsonOrFallback } from "../../../lib/response-json";
import { normalizeAppName } from "../../../lib/branding";
import {
  buildSignInAuthConfigState,
  normalizeSignInSettingsPayload,
} from "./signin-page-utils";
import {
  APP_CONFIG_APP_NAME_KEY,
  APP_LOGO_DATA_URL_KEY,
  DEFAULT_APP_NAME,
  buildFetchedSignInPageSettings,
  type FetchedSignInPageSettings,
} from "./signin-page-fetched-settings";

type SignInPageFetch = typeof fetch;

interface LoadSignInPageSettingsOptions {
  fetcher?: SignInPageFetch;
  isMobile: boolean;
  isThemeDark: boolean;
  onError?: (error: unknown) => void;
  storage?: Pick<Storage, "getItem">;
}

export interface LoadedSignInPageSettings {
  appName: string;
  logoUrl: string | null;
  pageSettings: FetchedSignInPageSettings | null;
}

export async function loadSignInPageSettings({
  fetcher = fetch,
  isMobile,
  isThemeDark,
  onError,
  storage,
}: LoadSignInPageSettingsOptions): Promise<LoadedSignInPageSettings> {
  try {
    const response = await fetcher("/api/settings/system-settings");
    if (!response.ok) {
      return getDefaultSignInPageSettings();
    }

    const data = await readJsonOrFallback<unknown>(response, {});
    const settings = normalizeSignInSettingsPayload(data);
    const pageSettings = buildFetchedSignInPageSettings({
      isMobile,
      isThemeDark,
      settings,
    });

    return {
      appName: pageSettings.currentAppName,
      logoUrl: pageSettings.appLogoUrl,
      pageSettings,
    };
  } catch (error) {
    onError?.(error);
    return getLocalSignInPageSettings(storage);
  }
}

export async function loadSignInAuthConfigState(fetcher: SignInPageFetch = fetch) {
  try {
    const response = await fetcher("/api/settings/system-settings");
    if (response.ok) {
      return buildSignInAuthConfigState(await readJsonOrFallback<unknown>(response, {}));
    }
  } catch {
    return getDefaultSignInAuthConfigState();
  }

  return getDefaultSignInAuthConfigState();
}

function getDefaultSignInPageSettings(): LoadedSignInPageSettings {
  return {
    appName: DEFAULT_APP_NAME,
    logoUrl: null,
    pageSettings: null,
  };
}

function getLocalSignInPageSettings(
  storage: Pick<Storage, "getItem"> | undefined,
): LoadedSignInPageSettings {
  return {
    appName: normalizeAppName(storage?.getItem(APP_CONFIG_APP_NAME_KEY), DEFAULT_APP_NAME),
    logoUrl: storage?.getItem(APP_LOGO_DATA_URL_KEY) || null,
    pageSettings: null,
  };
}

function getDefaultSignInAuthConfigState() {
  return {
    settings: {},
    isAzureAdConfigured: false,
    basicAuthEnabled: true,
  };
}
