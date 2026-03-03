import type { ChatMessage } from "../types/chat.types";

export type ChatArtifact =
  | { type: "animation"; id: string; data: Record<string, unknown>; createdAt: string }
  | { type: "theme"; id: string; data: Record<string, unknown>; createdAt: string };

/**
 * Collects artifacts (animation and theme tool results) from chat messages.
 * TOOL messages contain toolResults; we take those with displayType "animation" or "theme".
 */
export function extractArtifactsFromMessages(messages: ChatMessage[]): ChatArtifact[] {
  const artifacts: ChatArtifact[] = [];
  for (const msg of messages) {
    if (msg.role !== "TOOL") continue;
    const raw = (msg as { toolResults?: unknown }).toolResults;
    let results: Array<{ displayType?: string; displayData?: unknown; callId?: string }> = [];
    try {
      results = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
    } catch {
      continue;
    }
    const createdAt = msg.createdAt ?? new Date().toISOString();
    for (const r of results) {
      if (r.displayType === "animation" && r.displayData && typeof r.displayData === "object") {
        const data = r.displayData as Record<string, unknown>;
        const id = data.animationId as string | undefined;
        if (id) {
          artifacts.push({ type: "animation", id, data, createdAt });
        }
      }
      if (r.displayType === "theme" && r.displayData && typeof r.displayData === "object") {
        const data = r.displayData as Record<string, unknown>;
        const id = (data.themeId as string) ?? (data.id as string) ?? (data._id as string);
        if (id) {
          artifacts.push({ type: "theme", id, data, createdAt });
        }
      }
    }
  }
  return artifacts;
}
