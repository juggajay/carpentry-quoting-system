'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined);

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open: openProp, onOpenChange, children, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(openProp ?? false);

    React.useEffect(() => {
      if (openProp !== undefined) {
        setOpen(openProp);
      }
    }, [openProp]);

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
      setOpen(newOpen);
      onOpenChange?.(newOpen);
    }, [onOpenChange]);

    return (
      <CollapsibleContext.Provider value={{ open, setOpen: handleOpenChange }}>
        <div
          ref={ref}
          className={className}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

Collapsible.displayName = "Collapsible";

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext);
  
  if (!context) {
    throw new Error("CollapsibleTrigger must be used within a Collapsible");
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.setOpen(!context.open);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={context.open}
      onClick={handleClick}
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </button>
  );
});

CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext);
  
  if (!context) {
    throw new Error("CollapsibleContent must be used within a Collapsible");
  }

  if (!context.open) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };