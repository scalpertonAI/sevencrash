import { cn } from "@/lib/cn";
import { ComponentProps, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input(
  { className, ...props }, ref
) {
  return <input ref={ref} className={cn("input", className)} {...props} />;
});
