"use client";

import { Button } from "./Button";

export function RetryButton({ children = "Retry", ...props }: { children?: React.ReactNode } & React.ComponentProps<typeof Button>) {
  return (
    <Button onClick={() => window.location.reload()} {...props}>
      {children}
    </Button>
  );
}