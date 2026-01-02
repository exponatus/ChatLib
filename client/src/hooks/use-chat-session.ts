import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useState } from "react";
import { Message } from "@shared/schema";

export function useChatHistory(sessionId: number) {
  return useQuery({
    queryKey: [api.chat.history.path, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const url = buildUrl(api.chat.history.path, { id: sessionId });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.chat.history.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  return useMutation({
    mutationFn: async (assistantId: number) => {
      const res = await fetch(api.chat.createSession.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create chat session");
      return api.chat.createSession.responses[201].parse(await res.json());
    },
  });
}

// Custom hook for streaming chat response
export function useChatStream(sessionId: number) {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsStreaming(true);
      setStreamingContent("");

      // Optimistic update could happen here, but we'll wait for stream start
      
      const url = buildUrl(api.chat.sendMessage.path, { id: sessionId });
      
      // Note: We use fetch directly to handle SSE if the backend returned a stream,
      // OR handle standard JSON if backend just acknowledges.
      // The current backend implementation described in context suggests streaming via SSE 
      // is usually a separate endpoint or handled via response writing.
      // However, the provided chat routes in context use a POST that writes `data: ...`
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        // Parse SSE format: data: {...}
        const lines = chunkValue.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr.trim() === '') continue;
              
              const data = JSON.parse(jsonStr);
              
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
              if (data.done) {
                // Finalize
              }
            } catch (e) {
              console.error("Error parsing SSE chunk", e);
            }
          }
        }
      }
    },
    onSuccess: () => {
      setIsStreaming(false);
      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: [api.chat.history.path, sessionId] });
    },
    onError: () => {
      setIsStreaming(false);
    }
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    isPending: sendMessageMutation.isPending || isStreaming,
    streamingContent,
  };
}
