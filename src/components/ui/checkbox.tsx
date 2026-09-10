
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon, MinusIcon } from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-full border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
      "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white", // Green styling when checked
      "data-[state=indeterminate]:bg-green-400 data-[state=indeterminate]:border-green-400 data-[state=indeterminate]:text-white", // Green styling when indeterminate
      "hover:data-[state=checked]:bg-green-600 hover:data-[state=checked]:border-green-600", // Darker green on hover when checked
      "hover:data-[state=indeterminate]:bg-green-500 hover:data-[state=indeterminate]:border-green-500", // Darker green on hover when indeterminate
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current rounded-full")}
    >
      <CheckIcon className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Three-state checkbox component that cycles: unchecked → checked → indeterminate → unchecked
interface ThreeStateCheckboxProps extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange'> {
  value?: 'unchecked' | 'checked' | 'indeterminate';
  onValueChange?: (value: 'unchecked' | 'checked' | 'indeterminate') => void;
}

const ThreeStateCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  ThreeStateCheckboxProps
>(({ value = 'unchecked', onValueChange, className, ...props }, ref) => {
  const handleCheckedChange = () => {
    if (!onValueChange) return;

    // Cycle through states: unchecked → checked → indeterminate → unchecked
    if (value === 'unchecked') {
      onValueChange('checked');
    } else if (value === 'checked') {
      onValueChange('indeterminate');
    } else {
      onValueChange('unchecked');
    }
  };

  const checkedState = value === 'indeterminate' ? 'indeterminate' : value === 'checked';

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checkedState}
      onCheckedChange={handleCheckedChange}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-md border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white", // Green styling when checked
        "data-[state=indeterminate]:bg-green-400 data-[state=indeterminate]:border-green-400 data-[state=indeterminate]:text-white", // Green styling when indeterminate
        "hover:data-[state=checked]:bg-green-600 hover:data-[state=checked]:border-green-600", // Darker green on hover when checked
        "hover:data-[state=indeterminate]:bg-green-500 hover:data-[state=indeterminate]:border-green-500", // Darker green on hover when indeterminate
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {value === 'indeterminate' ? (
          <MinusIcon className="h-4 w-4" />
        ) : (
          <CheckIcon className="h-4 w-4" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
ThreeStateCheckbox.displayName = "ThreeStateCheckbox";

export { Checkbox, ThreeStateCheckbox }
