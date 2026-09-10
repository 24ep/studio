"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  canRemoveGradientStopByCount,
  getGradientAngleLabel,
  getGradientAngleValue,
  getGradientPositionValue,
  getGradientSizeLabel,
  getGradientSizeValue,
  getGradientStopKey,
  shouldShowGradientAngleControl,
  shouldShowGradientPositionControl,
  type GradientStop,
  type GradientType,
  type GradientValue,
} from "./enhanced-color-picker-utils";
import {
  GradientPositionControls,
  GradientRangeControl,
  GradientStopEditorRow,
} from "./enhanced-color-picker-gradient-control-parts";

export function GradientTypeSelector({
  gradient,
  onGradientTypeChange,
}: {
  gradient: GradientValue;
  onGradientTypeChange: (type: GradientType) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Gradient Type</Label>
      <Select
        value={gradient.type || "linear"}
        onValueChange={(value) => onGradientTypeChange(value as GradientType)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="linear">Linear</SelectItem>
          <SelectItem value="radial">Radial</SelectItem>
          <SelectItem value="conic">Angular (Conic)</SelectItem>
          <SelectItem value="diamond">Diamond</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function GradientStopsEditor({
  gradient,
  onAddGradientStop,
  onGradientStopChange,
  onRemoveGradientStop,
}: {
  gradient: GradientValue;
  onAddGradientStop: () => void;
  onGradientStopChange: (index: number, stop: Partial<GradientStop>, originalStop?: GradientStop) => void;
  onRemoveGradientStop: (index: number) => void;
}) {
  const canRemoveStops = canRemoveGradientStopByCount(gradient.stops.length);

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Gradient Stops</Label>
      <div className="space-y-3">
        {gradient.stops.map((stop, index) => (
          <div key={getGradientStopKey(stop, index)} className="p-2 border rounded-md">
            <GradientStopEditorRow
              canRemove={canRemoveStops}
              index={index}
              onGradientStopChange={onGradientStopChange}
              onRemoveGradientStop={onRemoveGradientStop}
              stop={stop}
            />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAddGradientStop} className="w-full mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Add Stop
      </Button>
    </div>
  );
}

export function GradientGeometryControls({
  gradient,
  onGradientAngleChange,
  onGradientPositionChange,
  onGradientSizeChange,
}: {
  gradient: GradientValue;
  onGradientAngleChange: (angle: number) => void;
  onGradientPositionChange: (x: number, y: number) => void;
  onGradientSizeChange: (size: number) => void;
}) {
  const showAngle = shouldShowGradientAngleControl(gradient);
  const showPosition = shouldShowGradientPositionControl(gradient);
  const angleValue = getGradientAngleValue(gradient);
  const position = getGradientPositionValue(gradient);
  const sizeValue = getGradientSizeValue(gradient);

  return (
    <>
      {showAngle && (
        <GradientRangeControl
          label={getGradientAngleLabel(angleValue)}
          max={360}
          value={angleValue}
          onChange={onGradientAngleChange}
        />
      )}

      {showPosition && (
        <GradientPositionControls
          position={position}
          onGradientPositionChange={onGradientPositionChange}
        />
      )}

      {gradient.type === "radial" && (
        <GradientRangeControl
          label={getGradientSizeLabel(sizeValue)}
          value={sizeValue}
          onChange={onGradientSizeChange}
        />
      )}
    </>
  );
}
