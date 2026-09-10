"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clampColorPickerPercent,
  getGradientPositionAxisLabel,
  getGradientStopOpacity,
  normalizeHex,
  type GradientStop,
} from "./enhanced-color-picker-utils";

type GradientStopChangeHandler = (
  index: number,
  stop: Partial<GradientStop>,
  originalStop?: GradientStop,
) => void;

export function GradientStopEditorRow({
  canRemove,
  index,
  onGradientStopChange,
  onRemoveGradientStop,
  stop,
}: {
  canRemove: boolean;
  index: number;
  onGradientStopChange: GradientStopChangeHandler;
  onRemoveGradientStop: (index: number) => void;
  stop: GradientStop;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={100}
          value={getGradientStopOpacity(stop)}
          onChange={(event) => {
            const opacity = clampColorPickerPercent(event.target.value);
            onGradientStopChange(index, { opacity }, stop);
          }}
          className="w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
      <Input
        type="color"
        value={stop.color}
        onChange={(event) => {
          onGradientStopChange(index, { color: normalizeHex(event.target.value) }, stop);
        }}
        className="w-10 h-10 p-1 cursor-pointer"
        title={stop.color}
      />
      <Input
        type="text"
        value={stop.color}
        onChange={(event) => onGradientStopChange(index, { color: normalizeHex(event.target.value) }, stop)}
        placeholder="#000000"
        className="w-24 font-mono text-sm"
        maxLength={7}
      />
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={100}
          value={stop.position}
          onChange={(event) => onGradientStopChange(index, { position: parseInt(event.target.value) || 0 }, stop)}
          className="w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemoveGradientStop(index)}
          className="h-8 w-8 ml-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function GradientRangeControl({
  label,
  max = 100,
  onChange,
  value,
}: {
  label: string;
  max?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <Input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value))}
        className="w-full"
      />
    </div>
  );
}

export function GradientPositionControls({
  onGradientPositionChange,
  position,
}: {
  onGradientPositionChange: (x: number, y: number) => void;
  position: { x: number; y: number };
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium block">Position</Label>
      <div className="grid grid-cols-2 gap-2">
        <GradientPositionAxisControl
          axis="X"
          value={position.x}
          onChange={(value) => onGradientPositionChange(value, position.y)}
        />
        <GradientPositionAxisControl
          axis="Y"
          value={position.y}
          onChange={(value) => onGradientPositionChange(position.x, value)}
        />
      </div>
    </div>
  );
}

function GradientPositionAxisControl({
  axis,
  onChange,
  value,
}: {
  axis: "X" | "Y";
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">
        {getGradientPositionAxisLabel(axis, value)}
      </Label>
      <Input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value))}
        className="w-full"
      />
    </div>
  );
}
