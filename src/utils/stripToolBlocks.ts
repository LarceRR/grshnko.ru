/**
 * Strip tool-call blocks and tags from message content so they are never shown in the UI.
 * Handles: <tool_call>...</tool_call>, ```tool...```, raw JSON tool calls.
 */
export function stripToolBlocks(text: string): string {
  if (!text || typeof text !== "string") return "";
  let cleaned = text;
  // Remove <tool_call> ... </tool_call> (and incomplete)
  cleaned = cleaned.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "");
  cleaned = cleaned.replace(/<tool_call>[\s\S]*$/i, "");
  cleaned = cleaned.replace(/<\/?tool_call\s*>/gi, "");
  // Remove ```tool ... ``` blocks
  cleaned = cleaned.replace(/```tool\s*\n[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/```tool\s*\n[\s\S]*$/, "");
  // Remove raw JSON tool call objects
  cleaned = cleaned.replace(/\{"name"\s*:\s*"[^"]*"\s*,\s*"arguments"\s*:\s*\{[\s\S]*?\}\s*\}/g, "");
  cleaned = cleaned.replace(/\{"name"\s*:\s*"[^"]*"[\s\S]*$/, "");
  cleaned = cleaned.replace(/\{"name"\s*:[\s\S]*$/, "");
  return cleaned.trim();
}
