import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, label, charCount, ...props }: React.ComponentProps<"textarea"> & { label?: string; charCount?: { current: number; max: number } }) {
  const textarea = (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )

  if (label || charCount) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          {label && <label className="text-sm font-medium text-foreground">{label}</label>}
          {charCount && (
            <span className={cn("text-xs", charCount.current > charCount.max ? "text-destructive" : "text-muted-foreground")}>
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
        {textarea}
      </div>
    )
  }

  return textarea
}

export { Textarea }
