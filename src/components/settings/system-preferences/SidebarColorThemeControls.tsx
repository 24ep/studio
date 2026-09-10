import type React from "react";
import { RotateCcw } from "lucide-react";

import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { SidebarColors } from "./constants";
import { convertHslStringToHex, hexToHslString } from "./utils";
import {
  SIDEBAR_COLOR_LABELS,
  applySidebarGradientChange,
  getSidebarColorControlKeys,
  getSidebarGradientPickerValue,
  type SidebarColorTheme,
} from "./sidebar-tab-utils";

export interface SidebarColorThemeTabsProps {
  activeSidebarTab: string;
  canEdit: boolean;
  resetSidebarColors: () => void;
  setActiveSidebarTab: (value: string) => void;
  setSidebarColors: React.Dispatch<React.SetStateAction<SidebarColors>>;
  sidebarColors: SidebarColors;
}

export function SidebarColorThemeTabs({
  activeSidebarTab,
  canEdit,
  resetSidebarColors,
  setActiveSidebarTab,
  setSidebarColors,
  sidebarColors,
}: SidebarColorThemeTabsProps) {
  return (
    <Tabs value={activeSidebarTab} onValueChange={setActiveSidebarTab} className="w-full">
      <SidebarColorThemeTabsHeader
        canEdit={canEdit}
        resetSidebarColors={resetSidebarColors}
      />

      <TabsContent value="light" className="mt-0">
        <SidebarColorInputs
          canEdit={canEdit}
          setSidebarColors={setSidebarColors}
          sidebarColors={sidebarColors}
          theme="Light"
        />
      </TabsContent>

      <TabsContent value="dark" className="mt-0">
        <SidebarColorInputs
          canEdit={canEdit}
          setSidebarColors={setSidebarColors}
          sidebarColors={sidebarColors}
          theme="Dark"
        />
      </TabsContent>
    </Tabs>
  );
}

interface SidebarColorThemeTabsHeaderProps {
  canEdit: boolean;
  resetSidebarColors: () => void;
}

function SidebarColorThemeTabsHeader({
  canEdit,
  resetSidebarColors,
}: SidebarColorThemeTabsHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <TabsList variant="subnav">
        <TabsTrigger value="light" className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border border-gray-300 bg-white" />
          Light Mode
        </TabsTrigger>
        <TabsTrigger value="dark" className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border border-gray-600 bg-slate-900" />
          Dark Mode
        </TabsTrigger>
      </TabsList>

      <Button
        variant="outline"
        size="sm"
        onClick={resetSidebarColors}
        disabled={!canEdit}
        title="Reset to defaults"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}

interface SidebarColorInputsProps {
  canEdit: boolean;
  setSidebarColors: React.Dispatch<React.SetStateAction<SidebarColors>>;
  sidebarColors: SidebarColors;
  theme: SidebarColorTheme;
}

function SidebarColorInputs({
  canEdit,
  setSidebarColors,
  sidebarColors,
  theme,
}: SidebarColorInputsProps) {
  const {
    suffix,
    bgStartKey,
    bgEndKey,
    activeBgStartKey,
    activeBgEndKey,
    otherKeys,
    buttonTextKey,
  } = getSidebarColorControlKeys(theme);
  const [fontColorKey, activeTextKey, ...advancedColorKeys] = otherKeys;

  return (
    <div className="space-y-6 pt-4">
      <SidebarGradientControl
        canEdit={canEdit}
        endKey={bgEndKey}
        label="Background Gradient"
        setSidebarColors={setSidebarColors}
        sidebarColors={sidebarColors}
        startKey={bgStartKey}
      />
      <SidebarGradientControl
        canEdit={canEdit}
        endKey={activeBgEndKey}
        label="Active Background Gradient"
        setSidebarColors={setSidebarColors}
        sidebarColors={sidebarColors}
        startKey={activeBgStartKey}
        syncSolidEnd
      />

      {[fontColorKey, activeTextKey].map((key) => (
        <SidebarColorControl
          key={key}
          canEdit={canEdit}
          colorKey={key}
          label={SIDEBAR_COLOR_LABELS[String(key)]}
          setSidebarColors={setSidebarColors}
          sidebarColors={sidebarColors}
        />
      ))}

      <details className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
        <summary
          className="cursor-pointer select-none text-sm font-medium text-foreground"
          data-autosave-ignore
        >
          Advanced colors
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Hover, border, and button text
          </span>
        </summary>
        <div className="mt-5 space-y-6 border-t border-border/60 pt-5">
          {advancedColorKeys.map((key) => (
            <SidebarColorControl
              key={key}
              canEdit={canEdit}
              colorKey={key}
              label={SIDEBAR_COLOR_LABELS[String(key)]}
              setSidebarColors={setSidebarColors}
              sidebarColors={sidebarColors}
            />
          ))}
          <SidebarColorControl
            canEdit={canEdit}
            colorKey={buttonTextKey}
            label="Button Text Color"
            labelId={`buttonTextColor${suffix}`}
            setSidebarColors={setSidebarColors}
            sidebarColors={sidebarColors}
          />
        </div>
      </details>
    </div>
  );
}

interface SidebarGradientControlProps {
  canEdit: boolean;
  endKey: keyof SidebarColors;
  label: string;
  setSidebarColors: React.Dispatch<React.SetStateAction<SidebarColors>>;
  sidebarColors: SidebarColors;
  startKey: keyof SidebarColors;
  syncSolidEnd?: boolean;
}

function SidebarGradientControl({
  canEdit,
  endKey,
  label,
  setSidebarColors,
  sidebarColors,
  startKey,
  syncSolidEnd = false,
}: SidebarGradientControlProps) {
  return (
    <SidebarColorPickerRow label={label}>
      <ColorPicker
        value={getSidebarGradientPickerValue(sidebarColors, startKey, endKey)}
        onChange={(gradientString) => {
          setSidebarColors((prev: SidebarColors) =>
            applySidebarGradientChange({
              sidebarColors: prev,
              startKey,
              endKey,
              gradientString,
              syncSolidEnd,
            }),
          );
        }}
        className="w-full"
        disabled={!canEdit}
      />
    </SidebarColorPickerRow>
  );
}

interface SidebarColorControlProps {
  canEdit: boolean;
  colorKey: keyof SidebarColors;
  label: string;
  labelId?: string;
  setSidebarColors: React.Dispatch<React.SetStateAction<SidebarColors>>;
  sidebarColors: SidebarColors;
}

function SidebarColorControl({
  canEdit,
  colorKey,
  label,
  labelId,
  setSidebarColors,
  sidebarColors,
}: SidebarColorControlProps) {
  return (
    <SidebarColorPickerRow label={label} labelId={labelId || String(colorKey)}>
      <ColorPicker
        value={convertHslStringToHex(sidebarColors[colorKey])}
        onChange={(hex) =>
          setSidebarColors((prev: SidebarColors) => ({
            ...prev,
            [colorKey]: hexToHslString(hex),
          }))
        }
        className="w-full"
        disabled={!canEdit}
      />
    </SidebarColorPickerRow>
  );
}

interface SidebarColorPickerRowProps {
  children: React.ReactNode;
  label: string;
  labelId?: string;
}

function SidebarColorPickerRow({
  children,
  label,
  labelId,
}: SidebarColorPickerRowProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
      <div className="md:col-span-4">
        <Label htmlFor={labelId} className="text-sm font-medium">
          {label}
        </Label>
      </div>
      <div className="md:col-span-8">{children}</div>
    </div>
  );
}
