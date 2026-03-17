import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, Type, FunctionCallingConfigMode } from "@google/genai";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

// ---------- Types ----------

export interface ToolSchema {
  name: string;
  description: string;
  properties: Record<string, SchemaProperty>;
  required: string[];
}

interface SchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  enum?: string[];
}

type Provider = "gemini" | "anthropic";

// ---------- Config ----------

function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (p === "anthropic" || p === "claude") return "anthropic";
  return "gemini";
}

// ---------- Gemini ----------

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
function convertSchemaToGemini(prop: SchemaProperty): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = { type: toGeminiType(prop.type) };
  if (prop.description) result.description = prop.description;
  if (prop.items) result.items = convertSchemaToGemini(prop.items);
  if (prop.properties) {
    result.properties = Object.fromEntries(
      Object.entries(prop.properties).map(([k, v]) => [k, convertSchemaToGemini(v)])
    );
  }
  if (prop.required) result.required = prop.required;
  if (prop.enum) result.enum = prop.enum;
  return result;
}

async function callGemini(prompt: string, tool: ToolSchema, options?: GeminiOptions): Promise<Record<string, unknown>> {
  const client = getGeminiClient();

  const geminiTool = {
    functionDeclarations: [{
      name: tool.name,
      description: tool.description,
      parameters: convertSchemaToGemini({
        type: "object",
        properties: tool.properties,
        required: tool.required,
      }),
    }],
  };

  // Use gemini-2.5-flash for the best quality/cost ratio
  // Features: thinking, grounding, structured output, 1M context
  const model = options?.model || "gemini-2.5-flash";

  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [geminiTool],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: [tool.name],
        },
      },
      // Enable thinking for better reasoning on complex prompts
      thinkingConfig: options?.thinking ? { thinkingBudget: options.thinking } : undefined,
      // Temperature for creativity (ads need creativity)
      temperature: options?.temperature ?? 1.0,
      // Top-p for diversity
      topP: options?.topP ?? 0.95,
      // Max output tokens
      maxOutputTokens: options?.maxTokens ?? 8192,
    },
  });

  // Extract function call from response
  const parts = response.candidates?.[0]?.content?.parts || [];
  const fnCall = parts.find((p) => p.functionCall);

  if (fnCall?.functionCall?.args) {
    return fnCall.functionCall.args as Record<string, unknown>;
  }

  // Fallback: try to parse text as JSON
  const text = parts.find((p) => p.text)?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("No se obtuvo respuesta estructurada de Gemini");
}

// ---------- Anthropic ----------

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY no configurada");
  return new Anthropic();
}

function convertSchemaToAnthropic(tool: ToolSchema): Anthropic.Tool {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function convertProp(prop: SchemaProperty): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = { type: prop.type };
    if (prop.description) result.description = prop.description;
    if (prop.items) result.items = convertProp(prop.items);
    if (prop.properties) {
      result.properties = Object.fromEntries(
        Object.entries(prop.properties).map(([k, v]) => [k, convertProp(v)])
      );
    }
    if (prop.required) result.required = prop.required;
    return result;
  }

  return {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: "object" as const,
      properties: Object.fromEntries(
        Object.entries(tool.properties).map(([k, v]) => [k, convertProp(v)])
      ),
      required: tool.required,
    },
  };
}

async function callAnthropic(prompt: string, tool: ToolSchema, maxTokens = 4096): Promise<Record<string, unknown>> {
  const client = getAnthropicClient();
  const anthropicTool = convertSchemaToAnthropic(tool);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    tools: [anthropicTool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: prompt }],
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude no uso la herramienta esperada");
  }

  return toolBlock.input as Record<string, unknown>;
}

// ---------- Public API ----------

interface GeminiOptions {
  model?: string;
  thinking?: number;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export interface AiCallOptions {
  maxTokens?: number;
  /** Enable Gemini thinking mode with token budget (e.g. 1024) */
  thinking?: number;
  /** Temperature 0-2 (default 1.0 for creative ads) */
  temperature?: number;
}

export async function aiCall(prompt: string, tool: ToolSchema, optionsOrMaxTokens?: number | AiCallOptions): Promise<Record<string, unknown>> {
  const provider = getProvider();

  // Normalize options
  const opts: AiCallOptions = typeof optionsOrMaxTokens === "number"
    ? { maxTokens: optionsOrMaxTokens }
    : optionsOrMaxTokens || {};

  if (provider === "gemini") {
    return callGemini(prompt, tool, {
      maxTokens: opts.maxTokens ?? 8192,
      thinking: opts.thinking,
      temperature: opts.temperature ?? 1.0,
      topP: 0.95,
    });
  }
  return callAnthropic(prompt, tool, opts.maxTokens ?? 4096);
}

export function getProviderName(): string {
  return getProvider() === "gemini" ? "Gemini" : "Claude";
}

export function isConfigured(): boolean {
  const provider = getProvider();
  if (provider === "gemini") {
    return !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  }
  return !!process.env.ANTHROPIC_API_KEY;
}
