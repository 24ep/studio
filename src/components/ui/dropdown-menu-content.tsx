"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

import { useDynamicZIndex, useLayerInstanceId } from "@/contexts/ZIndexContext";
import { cn } from "@/lib/utils";
import { menuContentAnimationClass } from "./menu-shared";

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center !rounded-lg px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const layerId = useLayerInstanceId(undefined, "dropdown-submenu");
  const { contentZIndex } = useDynamicZIndex(layerId, "dropdown");

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={cn(
          "min-w-[8rem] overflow-hidden !rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg",
          menuContentAnimationClass,
          className,
        )}
        style={{ zIndex: contentZIndex }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const layerId = useLayerInstanceId(undefined, "dropdown-menu");
  const { contentZIndex } = useDynamicZIndex(layerId, "dropdown");

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "min-w-[8rem] overflow-hidden !rounded-lg border bg-popover p-1 text-popover-foreground shadow-md pointer-events-auto",
          menuContentAnimationClass,
          className,
        )}
        style={{ zIndex: contentZIndex }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export {
  DropdownMenuContent,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
};
