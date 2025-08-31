import { cn } from "@/lib/cn";
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("card-glass", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-xl font-semibold", className)} {...props} />;
}
export function CardDesc({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-gray-600", className)} {...props} />;
}
