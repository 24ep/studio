"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cva, type VariantProps } from "class-variance-authority";

import { useDynamicZIndex, useLayerInstanceId } from "@/contexts/ZIndexContext";
import { useDrawerStyle } from "@/hooks/use-drawer-style";
import { cn } from "@/lib/utils";
import { SheetPortal } from "./sheet-root";

const sheetVariants = cva(
  "fixed gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetOverlayProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> {
  sheetId?: string;
  forceZIndex?: number;
}

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  SheetOverlayProps
>(({ className, sheetId, forceZIndex, ...props }, ref) => {
  const { overlayZIndex: contextOverlayZIndex } = useDynamicZIndex(sheetId || "default-sheet", "drawer");
  const overlayZIndex = forceZIndex !== undefined ? forceZIndex : contextOverlayZIndex;

  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "bg-black/70 dark:bg-black/80",
        className,
      )}
      style={{ zIndex: overlayZIndex }}
      {...props}
      ref={ref}
    />
  );
});
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> {
  sheetId?: string;
  hideCloseButton?: boolean;
  forceZIndex?: number;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, sheetId, style, hideCloseButton = false, forceZIndex, ...props }, ref) => {
  const effectiveSheetId = useLayerInstanceId(sheetId, "sheet");
  const { contentZIndex: contextContentZIndex } = useDynamicZIndex(effectiveSheetId, "drawer");
  const drawerStyle = useDrawerStyle();
  const contentZIndex = forceZIndex !== undefined ? forceZIndex : contextContentZIndex;
  const insetStyleClasses = getSheetInsetStyleClasses({
    className,
    isModern: drawerStyle === "modern",
    side,
  });

  return (
    <SheetPortal>
      <SheetOverlay sheetId={effectiveSheetId} forceZIndex={forceZIndex !== undefined ? forceZIndex - 1 : undefined} />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          sheetVariants({ side }),
          insetStyleClasses,
          className,
        )}
        style={{ zIndex: contentZIndex, ...style }}
        {...props}
      >
        <SheetPrimitive.Title className="sr-only">Sheet</SheetPrimitive.Title>
        {children}
        {!hideCloseButton && (
          <SheetPrimitive.Close className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm ring-offset-background transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XMarkIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

function getSheetInsetStyleClasses({
  className,
  isModern,
  side,
}: {
  className?: string;
  isModern: boolean;
  side: "top" | "bottom" | "left" | "right" | null | undefined;
}) {
  if (side !== "right") {
    return "";
  }

  const hasCustomWidth = className && /w-\[\d+v|w-1\/|w-2\/|w-3\/|w-4\/|w-5\/|max-w-\[/.test(className);
  const insetClasses = "!top-4 !bottom-4 !right-4 !left-auto !h-[calc(100vh-2rem)] rounded-lg";

  return isModern && !hasCustomWidth
    ? `${insetClasses} !w-96 sm:!max-w-md`
    : insetClasses;
}

export {
  SheetContent,
  SheetOverlay,
};
