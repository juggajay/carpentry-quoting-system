'use client';

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value = "", onValueChange = () => {}, children }: SelectProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  
  if (!context) {
    throw new Error("SelectTrigger must be used within a Select");
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});

SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const context = React.useContext(SelectContext);
  
  if (!context) {
    throw new Error("SelectValue must be used within a Select");
  }

  return (
    <span className={cn(!context.value && "text-muted-foreground")}>
      {context.value || placeholder}
    </span>
  );
};

type SelectContentProps = React.HTMLAttributes<HTMLDivElement>

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    
    if (!context) {
      throw new Error("SelectContent must be used within a Select");
    }

    if (!context.open) return null;

    return (
      <>
        <div
          className="fixed inset-0 z-50"
          onClick={() => context.setOpen(false)}
        />
        <div
          ref={ref}
          className={cn(
            "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
            "absolute top-full mt-1 w-full",
            className
          )}
          {...props}
        >
          <div className="p-1">
            {children}
          </div>
        </div>
      </>
    );
  }
);

SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, onClick, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    
    if (!context) {
      throw new Error("SelectItem must be used within a Select");
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      context.onValueChange(value);
      context.setOpen(false);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
          context.value === value && "bg-accent text-accent-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };