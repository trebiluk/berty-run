import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[var(--radius-sm)] font-semibold tracking-wide uppercase text-sm transition-[opacity,transform,background-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange",
  {
    variants: {
      variant: {
        primary: "bg-orange text-ink border border-crate",
        navy: "bg-navy-2 text-fg border border-line",
        ghost: "bg-transparent text-fg border border-line",
        paper: "bg-paper text-ink border border-paper",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
  ),
);
Button.displayName = "Button";
