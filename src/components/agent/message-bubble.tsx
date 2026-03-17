"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-agent-chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatContent(content: string): React.ReactNode {
  // Split into lines and process each
  const lines = content.split("\n");

  return lines.map((line, i) => {
    // Bold: **text**
    let processed: React.ReactNode = line;

    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    if (boldParts.length > 1) {
      processed = boldParts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold text-text-primary">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    }

    // List items: - text or * text
    const isListItem = line.match(/^[\s]*[-*]\s/);
    if (isListItem) {
      return (
        <li key={i} className="ml-4 list-disc">
          {typeof processed === "string" ? processed.replace(/^[\s]*[-*]\s/, "") : processed}
        </li>
      );
    }

    // Numbered list: 1. text
    const isNumberedItem = line.match(/^[\s]*\d+\.\s/);
    if (isNumberedItem) {
      return (
        <li key={i} className="ml-4 list-decimal">
          {typeof processed === "string" ? processed.replace(/^[\s]*\d+\.\s/, "") : processed}
        </li>
      );
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      return <br key={i} />;
    }

    return (
      <p key={i} className="mb-1">
        {processed}
      </p>
    );
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary/10 border border-primary/20 text-text-primary"
            : "bg-surface border border-border text-text-secondary"
        )}
      >
        {/* Role indicator */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              isUser ? "text-primary" : "text-secondary"
            )}
          >
            {isUser ? "Tu" : "Agente IA"}
          </span>
          <span className="text-[10px] text-text-dim">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Tool calls indicator */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1">
            {message.toolCalls.map((tc, i) => (
              <div
                key={i}
                className="text-[11px] text-text-dim bg-background/50 rounded-lg px-2 py-1 font-mono"
              >
                Consultando: {tc.name}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="text-sm leading-relaxed">{formatContent(message.content)}</div>
      </div>
    </div>
  );
}
