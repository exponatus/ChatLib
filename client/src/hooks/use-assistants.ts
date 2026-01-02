import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAssistant, InsertDocument } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useAssistants() {
  return useQuery({
    queryKey: [api.assistants.list.path],
    queryFn: async () => {
      const res = await fetch(api.assistants.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch assistants");
      return api.assistants.list.responses[200].parse(await res.json());
    },
  });
}

export function useAssistant(id: number) {
  return useQuery({
    queryKey: [api.assistants.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.assistants.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch assistant");
      return api.assistants.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateAssistant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAssistant) => {
      const validated = api.assistants.create.input.parse(data);
      const res = await fetch(api.assistants.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create assistant");
      }
      return api.assistants.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assistants.list.path] });
      toast({
        title: "Success",
        description: "Assistant created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAssistant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertAssistant>) => {
      const validated = api.assistants.update.input.parse(updates);
      const url = buildUrl(api.assistants.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update assistant");
      return api.assistants.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.assistants.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.assistants.get.path, variables.id] });
      toast({
        title: "Saved",
        description: "Assistant settings updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAssistant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.assistants.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete assistant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assistants.list.path] });
      toast({
        title: "Deleted",
        description: "Assistant removed successfully",
      });
    },
  });
}

// === DOCUMENT HOOKS ===

export function useDocuments(assistantId: number) {
  return useQuery({
    queryKey: [api.documents.list.path, assistantId],
    queryFn: async () => {
      const url = buildUrl(api.documents.list.path, { assistantId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return api.documents.list.responses[200].parse(await res.json());
    },
    enabled: !!assistantId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assistantId, ...data }: { assistantId: number } & Omit<InsertDocument, 'assistantId'>) => {
      const url = buildUrl(api.documents.create.path, { assistantId });
      // Schema omits assistantId from input as it's in the URL logic for this particular hook wrapper, 
      // but payload sends it as body in some designs. 
      // Based on route manifest: input is InsertDocument.omit({ assistantId: true })
      
      const validated = api.documents.create.input.parse(data);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add document");
      return api.documents.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path, variables.assistantId] });
      toast({
        title: "Added",
        description: "Document added to knowledge base",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, assistantId }: { id: number; assistantId: number }) => {
      const url = buildUrl(api.documents.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete document");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path, variables.assistantId] });
      toast({
        title: "Removed",
        description: "Document removed from knowledge base",
      });
    },
  });
}

export function useRetrainAssistant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/assistants/${id}/retrain`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to retrain assistant");
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.assistants.get.path, id] });
      toast({
        title: "Retraining Complete",
        description: "Your assistant has been updated with the latest knowledge base.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
