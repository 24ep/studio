import React, { forwardRef, useMemo } from "react";

import { cn } from "@/lib/utils";
import { OptimizedContainer } from "./optimized-container-core";
import type {
  ConditionalContainerProps,
  LayoutContainerProps,
  MemoizedContainerProps,
} from "./optimized-container-types";
import {
  getLayoutContainerClasses,
  getLayoutContainerStyle,
} from "./optimized-container-utils";

export const Fragment = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const ConditionalContainer = forwardRef<HTMLDivElement, ConditionalContainerProps>(
  ({ condition = true, fallback, children, ...props }, ref) => {
    if (!condition) {
      return fallback ? <>{fallback}</> : null;
    }

    return (
      <OptimizedContainer ref={ref} {...props}>
        {children}
      </OptimizedContainer>
    );
  },
);

ConditionalContainer.displayName = "ConditionalContainer";

export const MemoizedContainer = React.memo(
  forwardRef<HTMLDivElement, MemoizedContainerProps>(
    ({ memoKey, children, ...props }, ref) => {
      return (
        <OptimizedContainer ref={ref} {...props}>
          {children}
        </OptimizedContainer>
      );
    },
  ),
  (prevProps, nextProps) => (
    prevProps.memoKey === nextProps.memoKey &&
    prevProps.className === nextProps.className &&
    prevProps.style === nextProps.style &&
    prevProps.children === nextProps.children
  ),
);

MemoizedContainer.displayName = "MemoizedContainer";

export const LayoutContainer = forwardRef<HTMLDivElement, LayoutContainerProps>(
  ({
    layout = "flex",
    direction = "row",
    justify,
    align,
    gap,
    wrap = false,
    className,
    style,
    children,
    ...props
  }, ref) => {
    const layoutClasses = useMemo(() => getLayoutContainerClasses({
      align,
      direction,
      gap,
      justify,
      layout,
      wrap,
    }), [layout, direction, justify, align, gap, wrap]);

    const containerStyle = useMemo(() => (
      getLayoutContainerStyle(gap, style)
    ), [gap, style]);

    return (
      <OptimizedContainer
        ref={ref}
        className={cn(layoutClasses, className)}
        style={containerStyle}
        {...props}
      >
        {children}
      </OptimizedContainer>
    );
  },
);

LayoutContainer.displayName = "LayoutContainer";
