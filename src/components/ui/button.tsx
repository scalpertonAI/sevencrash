"use client";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";
import { ComponentProps, forwardRef } from "react";

type Props = ComponentProps<"button"> & { loading?: boolean; };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, loading, children, ...props }, ref
) {
  return (
    <button
      ref={ref}
      className={cn("btn-primary", className)}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-5 w-5 inline-block animate-spin" />}
      {children}
    </button>
  );
});
