"use client";

import { useState, useCallback } from "react";

interface UseCopyReturn {
  copy: (text: string) => Promise<void>;
  copied: boolean;
}

export function useCopy(timeout = 2000): UseCopyReturn {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    },
    [timeout]
  );

  return { copy, copied };
}
