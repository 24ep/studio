import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "border inline-flex items-center justify-center whitespace-nowrap !rounded-md text-[13px] font-medium leading-5 ring-offset-background transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:transform-none max-sm:min-h-11 max-sm:text-sm [border-radius:0.375rem!important]",
  {
    variants: {
      variant: {
        default: "btn-primary-gradient text-primary-foreground shadow-sm shadow-primary/15 motion-safe:hover:-translate-y-px hover:shadow",
        destructive:
          "btn-destructive-gradient text-destructive-foreground motion-safe:hover:-translate-y-px hover:shadow-sm",
        outline:
          "btn-secondary-gradient border-secondary text-secondary-foreground motion-safe:hover:-translate-y-px hover:shadow-sm",
        secondary:
          "btn-secondary-gradient text-secondary-foreground motion-safe:hover:-translate-y-px hover:shadow-sm",
        ghost: "text-foreground shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-8 !rounded-md px-3 py-1.5 text-[12px] [border-radius:0.375rem!important] shadow-none hover:shadow-sm",
        lg: "h-10 !rounded-md px-5 [border-radius:0.375rem!important] shadow-sm hover:shadow",
        icon: "h-9 w-9 !rounded-md max-sm:min-w-11 [border-radius:0.375rem!important] shadow-none hover:shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const buttonProps = asChild ? props : { type: "button" as const, ...props }
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...buttonProps}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
