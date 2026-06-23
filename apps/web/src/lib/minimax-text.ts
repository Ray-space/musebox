type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | unknown;
};

interface ChatCompletionOptions {
  messages: ChatMessage[];
  jsonMode?: boolean;
  timeoutMs?: number;
}

interface ChatCompletionResult {
  content: string;
  provider: "minimax" | "openai";
}

function getMiniMaxApiBase(): string {
  const base = process.env.MINIMAX_API_BASE || "https://api.minimaxi.com";
  return base.replace(/\/$/, "");
}

function getMiniMaxTextModel(): string {
  return process.env.MINIMAX_TEXT_MODEL || "MiniMax-M3";
}

export function hasMiniMaxTextKey(): boolean {
  return Boolean(process.env.MINIMAX_API_KEY?.trim());
}

export function hasOpenAITextKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResult | null> {
  if (hasMiniMaxTextKey()) {
    const result = await callMiniMaxChat(options);
    if (result) return { content: result, provider: "minimax" };
  }

  if (hasOpenAITextKey()) {
    const result = await callOpenAIChat(options);
    if (result) return { content: result, provider: "openai" };
  }

  return null;
}

async function callMiniMaxChat(
  options: ChatCompletionOptions,
): Promise<string | null> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return null;

  try {
    const body: Record<string, unknown> = {
      model: getMiniMaxTextModel(),
      messages: options.messages,
      temperature: 0.8,
    };

    if (options.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${getMiniMaxApiBase()}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[minimax-text] HTTP ${response.status}: ${errorText.slice(0, 300)}`,
      );
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (error) {
    console.error("[minimax-text] request failed:", error);
    return null;
  }
}

async function callOpenAIChat(
  options: ChatCompletionOptions,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const body: Record<string, unknown> = {
      model: "gpt-4o-mini",
      messages: options.messages,
    };

    if (options.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[openai-text] HTTP ${response.status}: ${errorText.slice(0, 300)}`,
      );
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (error) {
    console.error("[openai-text] request failed:", error);
    return null;
  }
}

export function parseJsonContent<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

export function buildMultimodalUserContent(
  payload: Record<string, unknown>,
  imageDataUrl?: string,
  instruction?: string,
): string | unknown[] {
  if (!imageDataUrl) {
    return JSON.stringify(payload);
  }

  return [
    {
      type: "text",
      text: JSON.stringify({
        ...payload,
        instruction: instruction || "结合文字与图片理解用户输入",
      }),
    },
    {
      type: "image_url",
      image_url: { url: imageDataUrl },
    },
  ];
}
