"use client";
import * as React from "react";
// Original import: import { Command as CommandPrimitive } from "cmdk"
// CMDK import removed to prevent "Module not found" error if cmdk cannot be resolved.
// This will make the Command component non-functional.
import { cn } from "@/lib/utils";
const Command = React.forwardRef(({ className, ...props }, ref) => (<div // Changed from CommandPrimitive
 ref={ref} className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)} {...props}/>));
Command.displayName = "Command"; // Original: CommandPrimitive.displayName
const CommandInput = React.forwardRef(({ className, ...props }, ref) => (<div className="flex items-center border-b px-3" data-cmdk-input-wrapper=""> {/* Kept data attribute for styling if any */}
    {/* Search icon removed as it was imported from lucide-react, can be re-added if needed and lucide is fine */}
    <input // Changed from CommandPrimitive.Input
 ref={ref} className={cn("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}/>
  </div>));
CommandInput.displayName = "CommandInput"; // Original: CommandPrimitive.Input.displayName
const CommandList = React.forwardRef(({ className, ...props }, ref) => (<div // Changed
 ref={ref} className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props}/>));
CommandList.displayName = "CommandList"; // Original: CommandPrimitive.List.displayName
const CommandEmpty = React.forwardRef((props, ref) => (<div // Changed
 ref={ref} className="py-6 text-center text-sm" {...props}/>));
CommandEmpty.displayName = "CommandEmpty"; // Original: CommandPrimitive.Empty.displayName
const CommandGroup = React.forwardRef(({ className, heading, ...props }, ref) => (<div // Changed
 ref={ref} className={cn("overflow-hidden p-1 text-foreground", className)} {...props}>
    {heading && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>}
    {props.children}
  </div>));
CommandGroup.displayName = "CommandGroup"; // Original: CommandPrimitive.Group.displayName
const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => (<hr // Changed
 ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props}/>));
CommandSeparator.displayName = "CommandSeparator"; // Original: CommandPrimitive.Separator.displayName
const CommandItem = React.forwardRef(({ className, disabled, onSelect, value, ...props }, ref) => (<div // Changed
 ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50", "aria-selected:bg-accent aria-selected:text-accent-foreground", // Simplified selection styling
    className)} data-disabled={disabled} onClick={disabled ? undefined : () => onSelect?.(value || '')} tabIndex={disabled ? -1 : 0} {...props}/>));
CommandItem.displayName = "CommandItem"; // Original: CommandPrimitive.Item.displayName
const CommandShortcut = ({ className, ...props }) => {
    return (<span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props}/>);
};
CommandShortcut.displayName = "CommandShortcut";
export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator, };
