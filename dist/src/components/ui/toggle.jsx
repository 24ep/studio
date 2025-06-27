"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
const Toggle = React.forwardRef(({ id, checked = false, onCheckedChange, disabled = false, className, size = "md", ...props }, ref) => {
    const handleClick = () => {
        if (!disabled && onCheckedChange) {
            onCheckedChange(!checked);
        }
    };
    const sizeClasses = {
        sm: "h-4 w-7",
        md: "h-6 w-11",
        lg: "h-8 w-14"
    };
    const thumbSizeClasses = {
        sm: "h-3 w-3",
        md: "h-5 w-5",
        lg: "h-6 w-6"
    };
    return (<button ref={ref} id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} data-state={checked ? "checked" : "unchecked"} onClick={handleClick} className={cn("peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", sizeClasses[size], checked
            ? "bg-primary border-primary"
            : "bg-muted border-muted-foreground/20", className)} {...props}>
        <span className={cn("pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out", thumbSizeClasses[size], checked ? "translate-x-full" : "translate-x-0")} style={{
            transform: checked ? `translateX(calc(100% - ${size === 'sm' ? '12px' : size === 'md' ? '20px' : '24px'}))` : 'translateX(2px)'
        }}/>
      </button>);
});
Toggle.displayName = "Toggle";
export { Toggle };
