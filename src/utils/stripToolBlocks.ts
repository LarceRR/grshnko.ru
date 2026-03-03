import { jsonrepair } from "jsonrepair";

export interface ExtractedToolCall {
  name: string;
  arguments?: Record<string, unknown>;
  callId?: string;
}

/** Matches ```tool optional-whitespace/newline then capture until next ``` */
const TOOL_BLOCK_RE = /```tool\s*[\r\n]*([\s\S]*?)```/g;
/** Incomplete block at end of string (no closing ```) */
const TOOL_BLOCK_OPEN_RE = /```tool\s*[\r\n]*([\s\S]*)$/;

/**
 * Attempt JSON.parse, falling back to jsonrepair for common LLM mistakes
 * (extra brackets, trailing commas, etc.).
 */
function safeParseJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // JSON.parse failed — try repairing
  }

  try {
    const repaired = jsonrepair(trimmed);
    const parsed = JSON.parse(repaired);
    console.debug("[stripToolBlocks] jsonrepair fixed malformed JSON");
    return parsed;
  } catch {
    console.warn("[stripToolBlocks] Failed to parse tool block JSON even after repair:", trimmed.slice(0, 200));
    return null;
  }
}

function parseOneToolBlock(raw: string): ExtractedToolCall | null {
  const obj = safeParseJson(raw) as { name?: string; arguments?: Record<string, unknown> } | null;
  if (obj && typeof obj.name === "string") {
    return {
      name: obj.name,
      arguments: obj.arguments && typeof obj.arguments === "object" ? obj.arguments : undefined,
      callId: undefined,
    };
  }
  return null;
}

/**
 * Extract tool call objects from message content (e.g. when backend saved tool in content but not in toolCalls).
 * Returns array of { name, arguments, callId } for each ```tool...``` block.
 */
export function extractToolCallsFromContent(text: string): ExtractedToolCall[] {
  if (!text || typeof text !== "string") return [];
  const out: ExtractedToolCall[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(TOOL_BLOCK_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    const parsed = parseOneToolBlock(match[1]);
    if (parsed) {
      out.push({ ...parsed, callId: `content-${out.length}` });
    }
  }
  if (out.length === 0) {
    const openMatch = text.match(TOOL_BLOCK_OPEN_RE);
    if (openMatch) {
      const parsed = parseOneToolBlock(openMatch[1]);
      if (parsed) {
        out.push({ ...parsed, callId: `content-${out.length}` });
      }
    }
  }
  return out;
}

/**
 * Strip tool-call blocks and tags from message content so they are never shown in the UI.
 * Handles: ```tool...```, raw JSON tool calls.
 */
export function stripToolBlocks(text: string): string {
  if (!text || typeof text !== "string") return "";
  let cleaned = text;
  
  // Remove ```...``` blocks (and incomplete) - iterate to handle nested cases
  let prevLength;
  do {
    prevLength = cleaned.length;
    cleaned = cleaned.replace(/```[\s\S]*?<\/tool_call>/gi, "");
    cleaned = cleaned.replace(/```[\s\S]*$/i, "");
    cleaned = cleaned.replace(/<\/?tool_call\s*>/gi, "");
  } while (cleaned.length !== prevLength);
  
  // Remove ```tool ... ``` blocks - iterate for nested
  do {
    prevLength = cleaned.length;
    cleaned = cleaned.replace(/```tool\s*[\r\n]+[\s\S]*?```/g, "");
    cleaned = cleaned.replace(/```tool\s*[\r\n]+[\s\S]*$/g, "");
  } while (cleaned.length !== prevLength);
  
  // Remove raw JSON tool call objects
  cleaned = cleaned.replace(/\{"name"\s*:\s*"[^"]*"\s*,\s*"arguments"\s*:\s*\{[\s\S]*?\}\s*\}/g, "");
  cleaned = cleaned.replace(/\{"name"\s*:\s*"[^"]*"[\s\S]*$/g, "");
  cleaned = cleaned.replace(/\{"name"\s*:[\s\S]*$/g, "");

  return cleaned.trim();
}
