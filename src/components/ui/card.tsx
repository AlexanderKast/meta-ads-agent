import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "bordered" | "highlighted";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-surface border border-border rounded-xl",
  bordered: "bg-surface border border-border rounded-xl hover:border-border-hover transition-all",
  highlighted:
    "bg-gradient-to-r from-primary-light to-pink-500/10 border border-primary-border rounded-xl",
};

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div className={cn(variantStyles[variant], "p-5", className)} {...props}>
      {children}
    </div>
  );
}
