"use client";

import { useState, useCallback } from "react";
import type { AdRequest, AdVariation, AdResponse } from "@/lib/types";

interface UseGenerateReturn {
  generate: (request: AdRequest) => Promise<void>;
  result: AdResponse | null;
  isStreaming: boolean;
  error: string | null;
  progress: number;
}

export function useGenerate(): UseGenerateReturn {
  const [result, setResult] = useState<AdResponse | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generate = useCallback(async (request: AdRequest) => {
    setIsStreaming(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const variations: AdVariation[] = [];
      let tips: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const chunk = JSON.parse(data);

            if (chunk.type === "variation") {
              variations.push(chunk.data as AdVariation);
              setProgress(variations.length / request.variations);
              setResult({
                platform: request.platform,
                variations: [...variations],
                tips,
              });
            } else if (chunk.type === "tips") {
              tips = chunk.data as string[];
              setResult({
                platform: request.platform,
                variations: [...variations],
                tips,
              });
            } else if (chunk.type === "error") {
              throw new Error(chunk.data as string);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setProgress(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { generate, result, isStreaming, error, progress };
}
