import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chat";

export function useBranching(sessionId: string | null) {
  const queryClient = useQueryClient();

  const activateBranch = useMutation({
    mutationFn: ({
      messageId,
      branchIndex,
    }: {
      messageId: string;
      branchIndex: number;
    }) => {
      if (!sessionId) throw new Error("No session");
      return chatApi.activateBranch(sessionId, messageId, branchIndex);
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: ["chat", "messages", sessionId],
        });
      }
    },
  });

  return {
    activateBranch: activateBranch.mutateAsync,
    isActivating: activateBranch.isPending,
  };
}
