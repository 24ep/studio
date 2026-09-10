import type {
  SidebarBackgroundType,
  SidebarImageFit,
  SidebarImagePosition,
} from "./constants";

interface SidebarSelectOption<TValue extends string> {
  label: string;
  value: TValue;
}

export const SIDEBAR_BACKGROUND_TYPE_OPTIONS: SidebarSelectOption<SidebarBackgroundType>[] = [
  { label: "Gradient / Solid Color", value: "gradient" },
  { label: "Background Image", value: "image" },
];

export const SIDEBAR_IMAGE_FIT_OPTIONS: SidebarSelectOption<SidebarImageFit>[] = [
  { label: "Cover (Fill)", value: "cover" },
  { label: "Contain", value: "contain" },
  { label: "Stretch", value: "fill" },
  { label: "Original Size", value: "none" },
];

export const SIDEBAR_IMAGE_POSITION_OPTIONS: SidebarSelectOption<SidebarImagePosition>[] = [
  { label: "Center", value: "center" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
];
