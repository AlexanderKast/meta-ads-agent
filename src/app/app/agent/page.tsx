"use client";

import { ChatInterface } from "@/components/agent/chat-interface";

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">Agente IA</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Tu asistente de marketing digital con acceso a tus campanas
        </p>
      </div>

      {/* Chat area - fills remaining height */}
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}
