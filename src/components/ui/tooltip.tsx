"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { useDynamicZIndex } from "@/contexts/ZIndexContext"

import { cn } from "@/lib/utils"
import { logIfInvalidSingleChild } from "./utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

// Wrap the trigger to debug children
const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>>(
  function TooltipTriggerWithDebug({ asChild, ...props }, ref) {
    logIfInvalidSingleChild(props.children, "TooltipTrigger");
    return (
      <TooltipPrimitive.Trigger asChild={asChild} {...props} ref={ref}>
        {props.children}
      </TooltipPrimitive.Trigger>
    );
  }
);

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const { contentZIndex } = useDynamicZIndex('tooltip-content', 'dropdown');
  
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
          "overflow-hidden !rounded-lg border bg-popover px-3 py-1.5 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      style={{ zIndex: contentZIndex }}
      {...props}
    />
  );
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
