"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

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
  const isSheetClose = childType.displayName === SheetPrimitive.Close.displayName;

  return (isButton || isSheetClose) && (
    accessibleLabel.toLowerCase() === "cancel" ||
    containsCancelLabel(childProps.children)
  );
}

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 border-b border-border/60 pb-4 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const visibleChildren = React.Children.toArray(children).filter(
    (child) => !isCancelButtonChild(child)
  );

  return (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  >
    {visibleChildren}
  </div>
  );
};
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
};
