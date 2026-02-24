import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chat";

export function useChatMessages(
  sessionId: string | null,
  params?: { before?: string; limit?: number },
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat", "messages", sessionId, params],
    queryFn: () => chatApi.getMessages(sessionId!, params).then((r) => r.data),
    enabled: !!sessionId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["chat", "messages", sessionId],
    });

  return {
    messages: query.data?.data ?? [],
    hasMore: query.data?.hasMore ?? false,
    nextCursor: query.data?.nextCursor ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
