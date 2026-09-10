"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useDynamicZIndex, useLayerInstanceId } from "@/contexts/ZIndexContext"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

interface DrawerOverlayProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay> {
  drawerId?: string;
}

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  DrawerOverlayProps
>(({ className, drawerId, ...props }, ref) => {
  const { overlayZIndex } = useDynamicZIndex(drawerId || 'default-drawer', 'drawer');

  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      className={cn("fixed inset-0 z-50 bg-black/80", className)}
      style={{ zIndex: overlayZIndex }}
      {...props}
    />
  );
})
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  drawerId?: string;
  hideCloseButton?: boolean;
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ className, children, drawerId, hideCloseButton = false, style, ...props }, ref) => {
  const effectiveDrawerId = useLayerInstanceId(drawerId, "drawer");
  const { contentZIndex } = useDynamicZIndex(effectiveDrawerId, 'drawer');

  return (
    <DrawerPortal>
      <DrawerOverlay drawerId={effectiveDrawerId} />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
          className
        )}
        style={{ zIndex: contentZIndex, ...style }}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
        {!hideCloseButton && !hasDrawerClose(children) && (
          <DrawerPrimitive.Close className="absolute right-4 top-4 z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm ring-offset-background transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <XMarkIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
})
DrawerContent.displayName = "DrawerContent"

function hasDrawerClose(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) return false;
    const childType = child.type as React.ComponentType & { displayName?: string };
    if (childType.displayName === DrawerPrimitive.Close.displayName) return true;
    return hasDrawerClose((child.props as { children?: React.ReactNode }).children);
  });
}

function containsCancelLabel(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (typeof child === "string") return child.trim().toLowerCase() === "cancel";
    if (!React.isValidElement(child)) return false;
    return containsCancelLabel((child.props as { children?: React.ReactNode }).children);
  });
}

function isCancelButtonChild(child: React.ReactNode): boolean {
  if (!React.isValidElement(child)) return false;

  const childType = child.type as React.ComponentType & { displayName?: string };
  const childProps = child.props as {
    "aria-label"?: string;
    children?: React.ReactNode;
    title?: string;
  };
  const accessibleLabel = `${childProps["aria-label"] || ""} ${childProps.title || ""}`.trim();
  const isButton = child.type === "button" || childType.displayName === "Button";
  const isDrawerClose = childType.displayName === DrawerPrimitive.Close.displayName;

  return (isButton || isDrawerClose) && (
    accessibleLabel.toLowerCase() === "cancel" ||
    containsCancelLabel(childProps.children)
  );
}

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 border-b border-border/60 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const visibleChildren = React.Children.toArray(children).filter(
    (child) => !isCancelButtonChild(child)
  );

  return (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  >
    {visibleChildren}
  </div>
  );
}
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
