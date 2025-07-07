import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variantClasses = {
      default: "bg-gray-600/20 text-gray-400",
      primary: "bg-electric-magenta/20 text-electric-magenta",
      success: "bg-lime-green/20 text-lime-green",
      warning: "bg-warning-orange/20 text-warning-orange",
      error: "bg-critical-red/20 text-critical-red",
      info: "bg-info-blue/20 text-info-blue",
    };

    const sizeClasses = {
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-3 py-1",
      lg: "text-sm px-4 py-1.5",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium transition-colors",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };