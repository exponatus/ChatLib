import { LayoutShell } from "@/components/layout-shell";
import { useAssistants, useCreateAssistant } from "@/hooks/use-assistants";
import { AssistantCard } from "@/components/assistant-card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssistantSchema } from "@shared/schema";
import { z } from "zod";

const createSchema = insertAssistantSchema.pick({
  name: true,
  description: true,
  systemPrompt: true,
});

type CreateForm = z.infer<typeof createSchema>;

export default function Dashboard() {
  const { data: assistants, isLoading } = useAssistants();
  const { mutateAsync: createAssistant, isPending: isCreating } = useCreateAssistant();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      description: "",
      systemPrompt: "You are a helpful library assistant. Answer questions based on the provided documents.",
    }
  });

  const onSubmit = async (data: CreateForm) => {
    await createAssistant(data);
    setOpen(false);
    reset();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-gradient w-fit">My Assistants</h1>
          <p className="text-muted-foreground text-lg">Manage your AI library chatbots.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              <Plus className="w-5 h-5 mr-2" />
              Create New Assistant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create AI Assistant</DialogTitle>
              <DialogDescription>
                Set up a new chatbot for your library. You can add documents later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Science Library Helper" 
                  {...register("name")}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Briefly describe what this assistant does" 
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea 
                  id="prompt" 
                  placeholder="Instructions for the AI..." 
                  className="h-24 resize-none"
                  {...register("systemPrompt")}
                />
                <p className="text-xs text-muted-foreground">
                  Define the personality and constraints for your assistant.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating} className="min-w-[100px]">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assistants && assistants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <AssistantCard key={assistant.id} assistant={assistant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No assistants yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Create your first AI library assistant to start answering user queries automatically.
          </p>
          <Button onClick={() => setOpen(true)} variant="outline" className="border-primary text-primary hover:bg-primary/5">
            Create your first assistant
          </Button>
        </div>
      )}
    </LayoutShell>
  );
}
