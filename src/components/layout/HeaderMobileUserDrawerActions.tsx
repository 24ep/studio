import {
  ComputerDesktopIcon as Monitor,
  MoonIcon as Moon,
  SunIcon as Sun,
  TrashIcon as Trash2,
  ArrowRightOnRectangleIcon as LogOut,
  LanguageIcon as Languages,
} from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/version";
import { LocaleFlag } from "./locale-flags";
import type {
  HeaderMobileUserDrawerProps,
  MobileThemeOption,
} from "./HeaderMobileUserDrawerTypes";
import type { HeaderThemePreference } from "./HeaderTypes";

type HeaderMobileUserDrawerAppearanceProps = Pick<
  HeaderMobileUserDrawerProps,
  "currentTheme" | "themePreference" | "currentLocale" | "onThemeChange" | "onLocaleChange" | "labels"
>;

export function HeaderMobileUserDrawerAppearance({
  currentTheme,
  themePreference,
  currentLocale,
  onThemeChange,
  onLocaleChange,
  labels,
}: HeaderMobileUserDrawerAppearanceProps) {
  const mobileThemeOptions: MobileThemeOption[] = [
    { id: "light", label: labels.light, icon: Sun },
    { id: "dark", label: labels.dark, icon: Moon },
    { id: "system", label: labels.system, icon: Monitor },
  ];
  return (
    <div className="space-y-3 p-1">
      <h4 className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        {labels.appearance}
      </h4>
      <div className="flex items-center gap-2 px-1">
        {mobileThemeOptions.map((themeOption) => (
          <ThemeOptionButton
            key={themeOption.id}
            currentTheme={currentTheme}
            themePreference={themePreference}
            themeOption={themeOption}
            onThemeChange={onThemeChange}
          />
        ))}
      </div>
      <div className="px-1 pt-2">
        <div className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground">
          <Languages className="h-4 w-4" />
          <span>{labels.localization}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["en-US", "th-TH"] as const).map((locale) => (
            <button
              key={locale}
              type="button"
              aria-pressed={currentLocale === locale}
              onClick={() => onLocaleChange(locale)}
              className={cn(
                "min-h-11 rounded-xl border px-3 text-xs font-bold transition-colors",
                currentLocale === locale
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted",
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <LocaleFlag locale={locale} className="h-3.5 w-6" />
                <span>{locale === "en-US" ? labels.english : labels.thai}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type HeaderMobileUserDrawerSessionActionsProps = Pick<
  HeaderMobileUserDrawerProps,
  "onClearCache" | "onSignOut" | "labels"
>;

export function HeaderMobileUserDrawerSessionActions({
  onClearCache,
  onSignOut,
  labels,
}: HeaderMobileUserDrawerSessionActionsProps) {
  return (
    <>
      <div className="space-y-1">
        <button
          type="button"
          onClick={onClearCache}
          className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-warning transition-colors hover:bg-warning/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold">{labels.clearCache}</span>
            <span className="text-[11px] opacity-70">
              {labels.clearCacheDescription}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-destructive transition-colors hover:bg-destructive/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <LogOut className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold tracking-tight">{labels.signOut}</span>
            <span className="text-[11px] opacity-70">
              {labels.signOutDescription}
            </span>
          </div>
        </button>
      </div>

      <div className="pt-2 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
          {labels.version} {APP_VERSION}
        </span>
      </div>
    </>
  );
}

function ThemeOptionButton({
  currentTheme,
  themePreference,
  themeOption,
  onThemeChange,
}: {
  currentTheme: "light" | "dark";
  themePreference: HeaderThemePreference;
  themeOption: MobileThemeOption;
  onThemeChange: (theme: HeaderThemePreference) => void | Promise<void>;
}) {
  const Icon = themeOption.icon;
  const selected = themePreference === themeOption.id;
  const resolvedLabel = themeOption.id === "system"
    ? ` (${currentTheme})`
    : "";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => void onThemeChange(themeOption.id)}
      className={cn(
        "flex flex-1 flex-col items-center gap-1.5 rounded-2xl border py-3 transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {themeOption.label}{resolvedLabel}
      </span>
    </button>
  );
}
