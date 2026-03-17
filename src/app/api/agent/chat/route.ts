import { NextRequest } from "next/server";
import {
  GoogleGenAI,
  Type,
  FunctionCallingConfigMode,
} from "@google/genai";
import type { Content, Part, FunctionDeclaration } from "@google/genai";
import { AGENT_SYSTEM_PROMPT } from "@/lib/agent/prompts";
import { agentTools, executeTool } from "@/lib/agent/tools";
import type { ToolSchema } from "@/lib/ai-provider";

// ---------- Helpers ----------

function getGeminiClient() {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY o GEMINI_API_KEY no configurada");
  return new GoogleGenAI({ apiKey: key });
}

function toGeminiType(t: string): Type {
  const map: Record<string, Type> = {
    string: Type.STRING,
    number: Type.NUMBER,
    boolean: Type.BOOLEAN,
    array: Type.ARRAY,
    object: Type.OBJECT,
  };
  return map[t] || Type.STRING;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertProp(prop: { type: string; description?: string; items?: any; properties?: any; required?: string[]; enum?: string[] }): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = { type: toGeminiType(prop.type) };
  if (prop.description) result.description = prop.description;
  if (prop.enum) result.enum = prop.enum;
  if (prop.items) result.items = convertProp(prop.items);
  if (prop.properties) {
    result.properties = Object.fromEntries(
      Object.entries(prop.properties).map(([k, v]) => [k, convertProp(v as typeof prop)])
    );
  }
  if (prop.required) result.required = prop.required;
  return result;
}

function toolsToGeminiFunctions(tools: ToolSchema[]): FunctionDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: convertProp({
      type: "object",
      properties: tool.properties,
      required: tool.required,
    }),
  }));
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function messagesToGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// ---------- Route ----------

export async function POST(request: NextRequest) {
  let body: { messages: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Se requiere al menos un mensaje" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key no configurada" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const client = getGeminiClient();
        const geminiTools = [{
          functionDeclarations: toolsToGeminiFunctions(agentTools),
        }];

        const contents = messagesToGeminiContents(body.messages);

        // Initial call
        let response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: AGENT_SYSTEM_PROMPT,
            tools: geminiTools,
            toolConfig: {
              functionCallingConfig: {
                mode: FunctionCallingConfigMode.AUTO,
              },
            },
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        });

        // Tool-calling loop (max 5 iterations to prevent infinite loops)
        let iterations = 0;
        const maxIterations = 5;
        const conversationContents: Content[] = [...contents];

        while (iterations < maxIterations) {
          const parts = response.candidates?.[0]?.content?.parts || [];
          const functionCalls = parts.filter((p: Part) => p.functionCall);

          if (functionCalls.length === 0) break;

          // Add model response to conversation
          conversationContents.push({
            role: "model",
            parts: parts,
          });

          // Execute each function call
          const functionResponses: Part[] = [];
          for (const part of functionCalls) {
            const fnCall = part.functionCall!;
            send({
              type: "tool_call",
              data: { name: fnCall.name, args: fnCall.args },
            });

            const result = await executeTool(
              fnCall.name!,
              (fnCall.args as Record<string, unknown>) || {}
            );

            functionResponses.push({
              functionResponse: {
                name: fnCall.name!,
                response: { result: JSON.parse(result) },
              },
            });
          }

          // Add function responses to conversation
          conversationContents.push({
            role: "user",
            parts: functionResponses,
          });

          // Continue the conversation
          response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: conversationContents,
            config: {
              systemInstruction: AGENT_SYSTEM_PROMPT,
              tools: geminiTools,
              toolConfig: {
                functionCallingConfig: {
                  mode: FunctionCallingConfigMode.AUTO,
                },
              },
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          });

          iterations++;
        }

        // Extract final text response
        const finalParts = response.candidates?.[0]?.content?.parts || [];
        const textPart = finalParts.find((p: Part) => p.text);
        const text = textPart?.text || "No pude generar una respuesta.";

        // Stream the text in chunks for a typing effect
        const chunkSize = 20;
        for (let i = 0; i < text.length; i += chunkSize) {
          const chunk = text.slice(i, i + chunkSize);
          send({ type: "chunk", data: chunk });
        }

        send({ type: "done", data: "" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error en el agente";
        send({ type: "error", data: message });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
