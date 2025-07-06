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
          <label className="block text-sm text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-gray-700 bg-dark-surface px-4 py-3 text-base text-white",
            "placeholder:text-gray-500",
            "transition-all duration-200",
            "focus:outline-none focus:border-royal-blue focus:ring-1 focus:ring-royal-blue",
            "hover:border-gray-600",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-critical-red focus:border-critical-red focus:ring-critical-red",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-critical-red">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };