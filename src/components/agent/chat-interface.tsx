"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useAccount } from "@/contexts/account-context";
import { MessageBubble } from "@/components/agent/message-bubble";
import { Button } from "@/components/ui/button";

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-surface border border-border rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
            Agente IA
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-text-dim rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

export function ChatInterface() {
  const { selectedAccountId } = useAccount();
  const { messages, isLoading, error, sendMessage, clearMessages } = useAgentChat(selectedAccountId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showTyping = isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.content;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  fillRule="evenodd"
                  d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Agente de Marketing IA
            </h3>
            <p className="text-text-muted text-sm max-w-md">
              Preguntame sobre tus campanas...
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg">
              {[
                "¿Como van mis campanas de Meta esta semana?",
                "Compara el rendimiento entre plataformas",
                "¿Que campanas tienen CPC mas alto?",
                "Genera copy para una campana de Google Ads",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="text-left text-xs text-text-muted bg-surface border border-border rounded-xl px-3 py-2 hover:border-border-hover hover:text-text-secondary transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {showTyping && <TypingIndicator />}
          </>
        )}

        {error && (
          <div className="flex justify-center mb-4">
            <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-2 text-sm text-error">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        {messages.length > 0 && (
          <div className="flex justify-end mb-2">
            <button
              onClick={clearMessages}
              className="text-[11px] text-text-dim hover:text-text-muted transition-colors"
            >
              Limpiar chat
            </button>
          </div>
        )}
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
            className={cn(
              "flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-dim",
              "focus:outline-none focus:border-primary resize-none",
              "min-h-[44px] max-h-[120px]"
            )}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="md"
            className="shrink-0 !px-3 !py-3 rounded-xl"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
