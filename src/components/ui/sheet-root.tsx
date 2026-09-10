"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { logIfInvalidSingleChild } from "./utils";

const Sheet = SheetPrimitive.Root;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>
>(function SheetTriggerWithDebug(props, ref) {
  logIfInvalidSingleChild(props.children, "SheetTrigger");

  return (
    <SheetPrimitive.Trigger {...props} ref={ref}>
      {props.children}
    </SheetPrimitive.Trigger>
  );
});

export {
  Sheet,
  SheetClose,
  SheetPortal,
  SheetTrigger,
};
