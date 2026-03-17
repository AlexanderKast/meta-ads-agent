import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-3",
  lg: "w-16 h-16 border-4",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "border-primary/30 border-t-primary rounded-full animate-spin",
        sizeStyles[size],
        className
      )}
    />
  );
}
