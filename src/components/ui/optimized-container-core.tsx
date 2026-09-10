import React, { forwardRef, useMemo } from "react";

import { cn } from "@/lib/utils";
import {
  type OptimizedChildProps,
  type OptimizedContainerProps,
} from "./optimized-container-types";
import { getOptimizedContainerClassName } from "./optimized-container-utils";

export const OptimizedContainer = forwardRef<HTMLDivElement, OptimizedContainerProps>(
  ({
    children,
    as: Component = "div",
    noWrapper = false,
    minimal = false,
    className,
    style,
    ...props
  }, ref) => {
    const containerClassName = useMemo(() => (
      getOptimizedContainerClassName(minimal, className)
    ), [minimal, className]);

    if (noWrapper && React.Children.count(children) === 1) {
      try {
        const child = React.Children.only(children);
        if (React.isValidElement(child)) {
          const childElement = child as React.ReactElement<OptimizedChildProps>;
          return React.cloneElement(childElement, {
            ...child.props,
            className: cn(child.props.className, className),
            style: { ...child.props.style, ...style },
            ref,
          });
        }
      } catch (error) {
        console.warn("OptimizedContainer: React.Children.only failed, falling back to wrapper:", error);
      }
    }

    if (minimal && !className && !style) {
      return <>{children}</>;
    }

    const AnyComponent: React.ElementType = Component;
    return (
      <AnyComponent
        ref={ref}
        className={containerClassName}
        style={style}
        {...props}
      >
        {children}
      </AnyComponent>
    );
  },
);

OptimizedContainer.displayName = "OptimizedContainer";
