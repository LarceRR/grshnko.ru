import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chat";
import type { UpdateSessionDto } from "../types/chat.types";

export function useChatSessions(params?: {
  skip?: number;
  take?: number;
  agentId?: string;
  search?: string;
}) {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["chat", "sessions", params],
    queryFn: async () => {
      const res = await chatApi.getSessions(params);
      return res.data;
    },
    staleTime: 60 * 1000, // 1 min — не рефетчить при каждом фокусе окна
    refetchOnWindowFocus: false,
  });

  const createSession = useMutation({
    mutationFn: ({ agentId, title }: { agentId: string; title?: string }) =>
      chatApi.createSession(agentId, title).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
    },
  });

  const createDirectSession = useMutation({
    mutationFn: (targetUserId: string) =>
      chatApi.createDirectSession(targetUserId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
    },
  });

  const updateSession = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<UpdateSessionDto>;
    }) => chatApi.updateSession(id, data).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      queryClient.setQueryData(["chat", "session", updated.id], updated);
    },
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => chatApi.deleteSession(id).then(() => id),
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      // Remove cached messages & session data for the deleted session immediately
      queryClient.removeQueries({ queryKey: ["chat", "messages", deletedId] });
      queryClient.removeQueries({ queryKey: ["chat", "session", deletedId] });
    },
  });

  return {
    sessions: sessionsQuery.data,
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    refetch: sessionsQuery.refetch,
    createSession: createSession.mutateAsync,
    createDirectSession: createDirectSession.mutateAsync,
    updateSession: updateSession.mutateAsync,
    deleteSession: deleteSession.mutateAsync,
  };
}

export function useChatSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat", "session", sessionId],
    queryFn: () => chatApi.getSession(sessionId!).then((r) => r.data),
    enabled: !!sessionId,
  });
}
