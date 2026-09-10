"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { logIfInvalidSingleChild } from "./utils"
import { useDynamicZIndex, useLayerInstanceId } from "@/contexts/ZIndexContext"
import { syncPopoverWrapperZIndex } from "./popover-z-index-utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>>(
  function PopoverTriggerWithDebug(props, ref) {
    logIfInvalidSingleChild(props.children, "PopoverTrigger");
    return (
      <PopoverPrimitive.Trigger {...props} ref={ref}>
        {props.children}
      </PopoverPrimitive.Trigger>
    );
  }
);

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  popoverId?: string;
  zIndexType?: 'modal' | 'drawer' | 'overlay' | 'dropdown';
  container?: HTMLElement;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 4, popoverId, zIndexType = 'overlay', style, container, ...props }, ref) => {
  const effectivePopoverId = useLayerInstanceId(popoverId, "popover");
  const { contentZIndex } = useDynamicZIndex(effectivePopoverId, zIndexType);
  const [isMobile, setIsMobile] = React.useState(false);
  const contentRef = React.useRef<React.ElementRef<typeof PopoverPrimitive.Content> | null>(null);

  // Fallback to a high z-index if context registry isn't ready or returned 0
  const effectiveZIndex = contentZIndex || 50;

  const setContentRef = React.useCallback((node: React.ElementRef<typeof PopoverPrimitive.Content> | null) => {
    contentRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<React.ElementRef<typeof PopoverPrimitive.Content> | null>).current = node;
    }
  }, [ref]);

  React.useLayoutEffect(
    () => syncPopoverWrapperZIndex(contentRef.current, effectiveZIndex),
    [effectiveZIndex],
  );
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={setContentRef}
        data-radix-popover-content=""
        align={align}
        sideOffset={sideOffset}
        className={cn(
          isMobile
            ? "fixed left-0 right-0 bottom-0 top-[20%] max-h-[80vh] !rounded-t-2xl !rounded-b-none border-t border-l border-r bg-card p-4 text-card-foreground shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom pointer-events-auto"
            : "w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 pointer-events-auto",
          className
        )}
        style={{ 
          zIndex: effectiveZIndex, 
          ...style,
          ...(isMobile ? { 
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            top: '20%'
          } : {})
        }}
        side={isMobile ? "bottom" : undefined}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
