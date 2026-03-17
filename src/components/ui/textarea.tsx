import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charCount?: { current: number; max: number };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, charCount, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:border-primary text-sm resize-none",
            error && "border-error focus:border-error",
            className
          )}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {error && <span className="text-xs text-error">{error}</span>}
          {charCount && (
            <span
              className={cn(
                "text-xs ml-auto",
                charCount.current > charCount.max ? "text-error" : "text-text-dim"
              )}
            >
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
