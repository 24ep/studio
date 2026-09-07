"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon } from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"
import { useSelectIsMobile } from "./select-mobile"

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const isMobile = useSelectIsMobile()

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isMobile ? "py-4 pl-4 pr-12 text-base" : "py-2 pl-8 pr-3 text-[13px]",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute flex items-center justify-center",
          isMobile ? "left-3 h-5 w-5" : "left-2.5 h-4 w-4"
        )}
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

export { SelectItem }
