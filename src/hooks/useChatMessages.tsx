import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { chatApi } from "../api/chat";
import type { MessagesListResponse } from "../types/chat.types";

export function useChatMessages(
  sessionId: string | null,
  params?: { limit?: number },
) {
  const queryClient = useQueryClient();
  const limit = params?.limit ?? 100;

  const query = useInfiniteQuery<
    MessagesListResponse,
    Error,
    InfiniteData<MessagesListResponse>,
    string[],
    number | undefined
  >({
    queryKey: ["chat", "messages", sessionId ?? ""],
    queryFn: ({ pageParam }) =>
      chatApi
        .getMessages(sessionId!, {
          limit,
          ...(pageParam != null ? { before: pageParam } : {}),
        })
        .then((r) => r.data),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor != null
        ? Number(lastPage.nextCursor)
        : undefined,
    enabled: !!sessionId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["chat", "messages", sessionId],
    });

  // Page 0 = newest (initial load), page N = oldest.
  // Reverse so the flattened array is chronological (oldest → newest).
  const messages =
    query.data?.pages
      .slice()
      .reverse()
      .flatMap((p: MessagesListResponse) => p.data) ?? [];

  return {
    messages,
    hasMore: query.hasNextPage ?? false,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    invalidate,
  };
}
