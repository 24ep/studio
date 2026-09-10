"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const menuContentAnimationClass =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";

export const menuLabelClass = "px-2 py-1.5 text-sm font-semibold";
export const menuSeparatorClass = "-mx-1 my-1 h-px bg-muted";
export const menuIndicatorClass = "absolute left-2 flex h-3.5 w-3.5 items-center justify-center";
export const menuShortcutClass = "ml-auto text-xs tracking-widest";

export function MenuItemIndicator({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className={menuIndicatorClass}>
      {children}
    </span>
  );
}

export function MenuShortcutText({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(menuShortcutClass, className)}
      {...props}
    />
  );
}
