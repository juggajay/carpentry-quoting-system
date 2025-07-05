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
          <label className="block text-sm text-slate-400 mb-1.5">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white",
            "placeholder:text-slate-400",
            "transition-all duration-200",
            "focus:outline-none focus:border-green-500 focus:shadow-focus",
            "hover:border-slate-700",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-600 focus:border-red-600 focus:shadow-none",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };