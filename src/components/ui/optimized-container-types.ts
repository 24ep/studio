import type React from "react";

export interface OptimizedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  noWrapper?: boolean;
  minimal?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type OptimizedChildProps = {
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>;
};

export interface ConditionalContainerProps extends OptimizedContainerProps {
  condition?: boolean;
  fallback?: React.ReactNode;
}

export interface MemoizedContainerProps extends OptimizedContainerProps {
  memoKey?: string | number;
}

export interface LayoutContainerProps extends OptimizedContainerProps {
  layout?: "flex" | "grid" | "block" | "inline";
  direction?: "row" | "column";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  gap?: number | string;
  wrap?: boolean;
}
