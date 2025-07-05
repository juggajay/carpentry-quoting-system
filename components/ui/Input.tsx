import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-body-sm text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-body text-text-primary",
            "placeholder:text-text-secondary",
            "transition-all duration-200",
            "focus:outline-none focus:border-primary focus:shadow-focus",
            "hover:border-border-hover",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus:border-error focus:shadow-none",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };