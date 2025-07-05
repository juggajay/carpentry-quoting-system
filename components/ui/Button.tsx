import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]",
  {
    variants: {
      variant: {
        primary: "bg-[#22C55E] hover:bg-[#16A34A] text-[#0A0A0B] shadow-md hover:shadow-lg hover:-translate-y-[1px]",
        secondary: "bg-transparent border border-[#3A3A3F] hover:border-[#71717A] hover:bg-white/5 text-[#FAFAFA]",
        ghost: "hover:bg-white/5 text-[#A1A1AA] hover:text-[#FAFAFA]",
        destructive: "bg-[#EF4444] hover:bg-[#DC2626] text-[#FAFAFA] shadow-md hover:shadow-lg",
        outline: "border border-[#2A2A2E] bg-transparent hover:bg-white/5 hover:border-[#3A3A3F] text-[#FAFAFA]",
        success: "bg-[#10B981] hover:bg-[#059669] text-[#FAFAFA] shadow-md hover:shadow-lg",
        warning: "bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0B] shadow-md hover:shadow-lg",
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-xs": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };