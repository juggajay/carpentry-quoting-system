import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface",
  {
    variants: {
      variant: {
        primary: "bg-electric-magenta hover:bg-electric-magenta/90 text-white shadow-md hover:shadow-lg hover:-translate-y-[1px]",
        secondary: "bg-transparent border border-gray-600 hover:border-gray-500 hover:bg-white/5 text-white",
        ghost: "hover:bg-royal-blue/10 text-royal-blue hover:text-royal-blue",
        destructive: "bg-critical-red hover:bg-critical-red/90 text-white shadow-md hover:shadow-lg",
        outline: "border border-gray-600 bg-transparent hover:bg-white/5 hover:border-gray-500 text-white",
        success: "bg-success-green hover:bg-success-green/90 text-white shadow-md hover:shadow-lg",
        warning: "bg-warning-orange hover:bg-warning-orange/90 text-white shadow-md hover:shadow-lg",
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