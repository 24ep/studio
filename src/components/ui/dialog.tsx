"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { useDynamicZIndex, useLayerInstanceId } from "@/contexts/ZIndexContext"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

interface DialogOverlayProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  dialogId?: string;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, dialogId, ...props }, ref) => {
  const { overlayZIndex } = useDynamicZIndex(dialogId || 'default-dialog', 'modal');

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 bg-black/45 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-black/60",
        className
      )}
      style={{ zIndex: overlayZIndex }}
      {...props}
    />
  );
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  dialogId?: string;
  hideCloseButton?: boolean;
  placement?: "center" | "right";
  overlayClassName?: string;
}

function hasDialogA11yChild(
  children: React.ReactNode,
  displayName?: string
): boolean {
  if (!displayName) {
    return false;
  }

  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) {
      return false;
    }

    const childType = child.type as React.ComponentType & { displayName?: string };
    if (childType.displayName === displayName) {
      return true;
    }

    return hasDialogA11yChild(
      (child.props as { children?: React.ReactNode }).children,
      displayName
    );
  });
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, dialogId, hideCloseButton = false, placement = "center", overlayClassName, style, ...props }, ref) => {
  const effectiveDialogId = useLayerInstanceId(dialogId, "dialog");
  const { contentZIndex } = useDynamicZIndex(effectiveDialogId, 'modal');
  const hasVisibleTitle = hasDialogA11yChild(children, DialogPrimitive.Title.displayName);
  const hasVisibleDescription = hasDialogA11yChild(children, DialogPrimitive.Description.displayName);
  const needsFallbackTitle = !hasVisibleTitle && !props['aria-label'] && !props['aria-labelledby'];
  const needsFallbackDescription = !hasVisibleDescription && props['aria-describedby'] === undefined;

  const isRightPanel = placement === "right";
  const isMobileModal = !isRightPanel && (className?.includes('bottom-0') || className?.includes('top-auto'));

  return (
    <DialogPortal>
      <DialogOverlay dialogId={effectiveDialogId} className={overlayClassName} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          !isMobileModal && !isRightPanel && "fixed left-[50%] top-[50%] grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto overscroll-contain rounded-xl border bg-background p-5 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:p-6",
          isMobileModal && "duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
          isRightPanel && "fixed inset-y-0 right-0 grid h-dvh max-h-dvh w-full gap-0 overflow-hidden border-l bg-background shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
          className
        )}
        style={{ zIndex: contentZIndex, ...style }}
        {...props}
      >
        {needsFallbackTitle && (
          <VisuallyHidden>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden>
        )}
        {needsFallbackDescription && (
          <VisuallyHidden>
            <DialogDescription>Dialog content</DialogDescription>
          </VisuallyHidden>
        )}
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 z-[1] inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm ring-offset-background transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <XMarkIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 pr-10 text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-base font-semibold leading-tight tracking-[-0.01em]",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-5 text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogClose = DialogPrimitive.Close

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
