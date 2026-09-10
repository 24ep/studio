import type React from "react";

import { cn } from "@/lib/utils";
import type {
  LayoutContainerProps,
  OptimizedContainerProps,
} from "./optimized-container-types";

export function getOptimizedContainerClassName(
  minimal: OptimizedContainerProps["minimal"],
  className?: string,
) {
  return minimal ? cn("contents", className) : className;
}

export function getLayoutContainerClasses({
  align,
  direction,
  gap,
  justify,
  layout,
  wrap,
}: Pick<
  Required<LayoutContainerProps>,
  "direction" | "layout" | "wrap"
> & Pick<LayoutContainerProps, "align" | "gap" | "justify">) {
  const classes = [];

  if (layout === "flex") {
    classes.push("flex");
    if (direction === "column") classes.push("flex-col");
    if (wrap) classes.push("flex-wrap");
  } else if (layout === "grid") {
    classes.push("grid");
  }

  if (justify) {
    const justifyMap = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };
    classes.push(justifyMap[justify]);
  }

  if (align) {
    const alignMap = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    };
    classes.push(alignMap[align]);
  }

  if (gap) {
    classes.push(`gap-${gap}`);
  }

  return classes;
}

export function getLayoutContainerStyle(
  gap: LayoutContainerProps["gap"],
  style: React.CSSProperties | undefined,
) {
  if (gap && typeof gap === "number") {
    return { gap: `${gap * 0.25}rem`, ...style };
  }
  return style;
}
