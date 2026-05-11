"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ComponentRef <typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    color?: string;
    height?: string; 
    rounded?: boolean; 
    roundedStyle?: "full" | "slight" | "none"; 
  }
>(({ className, value, color, height = "8px", roundedStyle = "full", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative w-full overflow-hidden bg-primary/20",
      roundedStyle === "full" && "rounded-full", 
      roundedStyle === "slight" && "rounded-sm", 
      roundedStyle === "none" && "rounded-none", 
      className
    )}
    style={{ height }} 
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full transition-all",
        className
      )}
      style={{
        backgroundColor: color || 'currentColor',
        transform: `translateX(-${100 - (value || 0)}%)`,
      }}
    />
  </ProgressPrimitive.Root>
));

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };