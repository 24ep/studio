"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700",
      className
    )}
    style={{ borderRadius: '9999px' }}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
      style={{ borderRadius: '9999px' }}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

// Three-state switch component that cycles: off → on → indeterminate → off
export interface ThreeStateSwitchProps extends Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, 'checked' | 'onCheckedChange'> {
  value?: 'off' | 'on' | 'indeterminate';
  onValueChange?: (value: 'off' | 'on' | 'indeterminate') => void;
}

const ThreeStateSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  ThreeStateSwitchProps
>(({ value = 'off', onValueChange, className, ...props }, ref) => {
  const handleCheckedChange = () => {
    if (!onValueChange) return;
    // Cycle through states: off → on → indeterminate → off
    if (value === 'off') {
      onValueChange('on');
    } else if (value === 'on') {
      onValueChange('indeterminate');
    } else {
      onValueChange('off');
    }
  };

  // For visual: checked = 'on', indeterminate = special color, unchecked = 'off'
  const isChecked = value === 'on';
  const isIndeterminate = value === 'indeterminate';

  return (
    <SwitchPrimitives.Root
      ref={ref}
      checked={isChecked}
      onCheckedChange={handleCheckedChange}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        isChecked && "data-[state=checked]:bg-green-600",
        isIndeterminate && "data-[state=checked]:bg-yellow-400",
        !isChecked && !isIndeterminate && "data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700",
        className
      )}
      style={{ borderRadius: '9999px' }}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
          isChecked && "data-[state=checked]:translate-x-4",
          isIndeterminate && "data-[state=checked]:translate-x-2",
          !isChecked && !isIndeterminate && "data-[state=unchecked]:translate-x-0"
        )}
        style={{ borderRadius: '9999px' }}
      />
    </SwitchPrimitives.Root>
  );
});
ThreeStateSwitch.displayName = "ThreeStateSwitch";

export { Switch, ThreeStateSwitch } 
