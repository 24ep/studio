"use client";

import {
  ComputerDesktopIcon as Monitor,
  MoonIcon as Moon,
  SunIcon as Sun,
  TrashIcon as Trash2,
  LanguageIcon as Languages,
} from "@heroicons/react/24/outline";
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { HeaderUserMenuSharedProps, HeaderThemePreference } from "./HeaderTypes";
import { LocaleFlag } from "./locale-flags";

type HeaderDesktopMenuProps = HeaderUserMenuSharedProps;

export function HeaderDesktopAppearanceSection({
  currentTheme,
  themePreference,
  currentLocale,
  onThemeChange,
  onLocaleChange,
  onClearCache,
  labels,
}: Pick<HeaderDesktopMenuProps, "currentTheme" | "themePreference" | "currentLocale" | "onThemeChange" | "onLocaleChange" | "onClearCache" | "labels">) {
  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <div className="p-2">
        <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{labels.appearance}</p>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            {currentTheme === "dark" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            <span>{labels.appearance}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-[160px] rounded-xl border-border bg-popover p-1 text-popover-foreground shadow-xl backdrop-blur-xl">
            <DropdownMenuRadioGroup
              value={themePreference}
              onValueChange={(value) => void onThemeChange(value as HeaderThemePreference)}
            >
              <DropdownMenuRadioItem value="light" className="cursor-pointer rounded-lg py-2 pl-8 pr-3 text-xs font-medium">
                <Sun className="mr-2 h-3.5 w-3.5" />
                {labels.light}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="cursor-pointer rounded-lg py-2 pl-8 pr-3 text-xs font-medium">
                <Moon className="mr-2 h-3.5 w-3.5" />
                {labels.dark}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="cursor-pointer rounded-lg py-2 pl-8 pr-3 text-xs font-medium">
                <Monitor className="mr-2 h-3.5 w-3.5" />
                {labels.system}
                <span className="ml-auto text-[10px] text-muted-foreground">{currentTheme}</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <Languages className="mr-2 h-4 w-4" />
            <span>{labels.localization}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-[170px] rounded-xl border-border bg-popover p-1 text-popover-foreground shadow-xl backdrop-blur-xl">
            <DropdownMenuRadioGroup
              value={currentLocale}
              onValueChange={(value) => onLocaleChange(value as "en-US" | "th-TH")}
            >
              <DropdownMenuRadioItem
                value="en-US"
                className="cursor-pointer py-2 pl-8 pr-3 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <LocaleFlag locale="en-US" className="h-4 w-6" />
                  <span>{labels.english}</span>
                </div>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="th-TH"
                className="cursor-pointer py-2 pl-8 pr-3 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <LocaleFlag locale="th-TH" className="h-4 w-6" />
                  <span>{labels.thai}</span>
                </div>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={onClearCache} className="mt-0.5 flex items-center rounded-lg px-3 py-2 text-sm font-medium text-warning transition-colors hover:bg-warning/10 focus:bg-warning/10 focus:text-warning">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>{labels.clearCache}</span>
        </DropdownMenuItem>
      </div>
    </>
  );
}
