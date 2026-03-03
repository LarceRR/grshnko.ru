import type { ChatMessage } from "../types/chat.types";
import { extractToolCallsFromContent } from "./stripToolBlocks";

/**
 * Groups messages by date for display as separators.
 */
export function groupMessagesByDate(messages: ChatMessage[]) {
    const groups: { dateLabel: string; messages: ChatMessage[] }[] = [];
    let currentGroup: { dateLabel: string; messages: ChatMessage[] } | null = null;

    messages.forEach((msg) => {
        const label = formatDateLabel(msg.createdAt);
        if (!currentGroup || currentGroup.dateLabel !== label) {
            currentGroup = { dateLabel: label, messages: [] };
            groups.push(currentGroup);
        }
        currentGroup.messages.push(msg);
    });

    return groups;
}

function formatDateLabel(iso: string): string {
    try {
        const d = new Date(iso);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDays = Math.round(
            (today.getTime() - msgDay.getTime()) / 86_400_000,
        );

        if (diffDays === 0) return "Сегодня";
        if (diffDays === 1) return "Вчера";
        return d.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: now.getFullYear() !== d.getFullYear() ? "numeric" : undefined,
        });
    } catch {
        return "";
    }
}

/**
 * Associates helper data for assistant messages (e.g. tool results from subsequent TOOL messages).
 * Looks ahead through the message history to match callIds.
 */
export function associateToolResults(messages: ChatMessage[]) {
    return messages.map((msg, idx) => {
        if (msg.role !== "ASSISTANT") {
            return msg;
        }

        // Parse tool calls: from message.toolCalls or extract from content (e.g. ```tool...```)
        let toolCalls: any[] = [];
        try {
            const rawCalls = (msg as any).toolCalls;
            toolCalls = typeof rawCalls === 'string'
                ? JSON.parse(rawCalls)
                : (Array.isArray(rawCalls) ? rawCalls : []);
        } catch {
            // ignore
        }
        if (!toolCalls || toolCalls.length === 0) {
            const fromContent = extractToolCallsFromContent((msg as any).content ?? "");
            toolCalls = fromContent.length > 0 ? fromContent : [];
        }
        if (!toolCalls || toolCalls.length === 0) return msg;

        // Collect all results for these callIds from subsequent messages
        const results: any[] = [];
        const callIds = toolCalls.map(tc => tc.callId || tc.id).filter(Boolean);

        for (let j = idx + 1; j < messages.length; j++) {
            const nextMsg = messages[j];
            if (nextMsg.role === "TOOL") {
                let toolResults: any[] = [];
                try {
                    const rawResults = (nextMsg as any).toolResults;
                    toolResults = typeof rawResults === 'string'
                        ? JSON.parse(rawResults)
                        : (Array.isArray(rawResults) ? rawResults : []);
                } catch {
                    continue;
                }

                if (Array.isArray(toolResults)) {
                    toolResults.forEach(res => {
                        const resId = res.callId || res.id;
                        if (resId && callIds.includes(resId)) {
                            results.push(res);
                        }
                    });
                }
            }
        }

        if (results.length > 0) {
            return {
                ...msg,
                associatedToolResults: results,
            };
        }

        return msg;
    });
}
