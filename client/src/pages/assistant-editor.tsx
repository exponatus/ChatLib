import { useParams, Link } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useUpdateAssistant, useDocuments, useCreateDocument, useDeleteDocument } from "@/hooks/use-assistants";
import { ChatPreview } from "@/components/chat-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Save, FileText, Upload, Trash2, HardDrive } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssistantSchema } from "@shared/schema";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const settingsSchema = insertAssistantSchema.pick({
  name: true,
  description: true,
  systemPrompt: true,
  welcomeMessage: true,
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function AssistantEditor() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading } = useAssistant(assistantId);
  const { mutateAsync: updateAssistant, isPending: isSaving } = useUpdateAssistant();
  const { data: documents, isLoading: isLoadingDocs } = useDocuments(assistantId);
  const { mutateAsync: createDocument, isPending: isUploading } = useCreateDocument();
  const { mutateAsync: deleteDocument } = useDeleteDocument();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [docContent, setDocContent] = useState("");
  const [docTitle, setDocTitle] = useState("");

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  // Load initial data
  useEffect(() => {
    if (assistant) {
      form.reset({
        name: assistant.name,
        description: assistant.description || "",
        systemPrompt: assistant.systemPrompt,
        welcomeMessage: assistant.welcomeMessage || "",
      });
    }
  }, [assistant, form]);

  const onSaveSettings = async (data: SettingsForm) => {
    await updateAssistant({ id: assistantId, ...data });
  };

  const onAddDocument = async () => {
    if (!docTitle || !docContent) return;
    
    await createDocument({
      assistantId,
      title: docTitle,
      content: docContent,
      sourceType: 'upload',
      sourceId: 'manual-entry-' + Date.now(),
      metadata: {}
    });
    
    setUploadOpen(false);
    setDocTitle("");
    setDocContent("");
  };

  if (isLoading || !assistant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <LayoutShell assistantId={assistantId}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display">{assistant.name}</h1>
            <p className="text-sm text-muted-foreground">Configuration & Preview</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Embed button placeholder */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Embed Code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Embed on your website</DialogTitle>
              </DialogHeader>
              <div className="p-4 bg-slate-900 rounded-lg overflow-x-auto">
                <code className="text-xs text-green-400 font-mono">
                  {`<iframe \n  src="${window.location.origin}/embed/${assistant.id}" \n  width="400" \n  height="600" \n  frameborder="0"\n></iframe>`}
                </code>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
        {/* Left Column: Configuration */}
        <div className="h-full flex flex-col overflow-hidden">
          <Tabs defaultValue="settings" className="flex-1 flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-xl p-1 bg-muted/50 mb-4">
              <TabsTrigger value="settings" className="rounded-lg">General Settings</TabsTrigger>
              <TabsTrigger value="knowledge" className="rounded-lg">Knowledge Base</TabsTrigger>
            </TabsList>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="flex-1 overflow-y-auto pr-2">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-6">
                  <form onSubmit={form.handleSubmit(onSaveSettings)} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Assistant Name</Label>
                      <Input {...form.register("name")} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea {...form.register("description")} className="resize-none h-20" />
                    </div>

                    <div className="space-y-2">
                      <Label>Welcome Message</Label>
                      <Input {...form.register("welcomeMessage")} placeholder="Hello! How can I help you today?" />
                    </div>

                    <div className="space-y-2">
                      <Label>System Prompt (Personality & Rules)</Label>
                      <Textarea 
                        {...form.register("systemPrompt")} 
                        className="font-mono text-sm h-64 resize-none leading-relaxed" 
                      />
                    </div>

                    <Button type="submit" disabled={isSaving} className="w-full">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KNOWLEDGE TAB */}
            <TabsContent value="knowledge" className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold text-lg">Documents</h3>
                   <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                     <DialogTrigger asChild>
                       <Button size="sm" variant="outline">
                         <Upload className="w-4 h-4 mr-2" />
                         Add Content
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <DialogHeader>
                         <DialogTitle>Add to Knowledge Base</DialogTitle>
                       </DialogHeader>
                       <div className="space-y-4 py-4">
                         <div className="space-y-2">
                           <Label>Title</Label>
                           <Input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Library Rules 2024" />
                         </div>
                         <div className="space-y-2">
                           <Label>Content</Label>
                           <Textarea 
                             value={docContent} 
                             onChange={e => setDocContent(e.target.value)} 
                             placeholder="Paste text content here..." 
                             className="h-40"
                           />
                         </div>
                         <div className="flex gap-2">
                           <Button className="flex-1" onClick={onAddDocument} disabled={isUploading}>
                             {isUploading ? "Adding..." : "Add Text"}
                           </Button>
                           <Button variant="secondary" className="flex-1" disabled title="Coming soon">
                             <HardDrive className="w-4 h-4 mr-2" />
                             Drive (Soon)
                           </Button>
                         </div>
                       </div>
                     </DialogContent>
                   </Dialog>
                </div>

                {isLoadingDocs ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : documents?.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                    <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No documents added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents?.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-lg shadow-sm group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">Manual Upload • {new Date(doc.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteDocument({ id: doc.id, assistantId })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Preview */}
        <div className="h-full border-l border-border pl-8 hidden lg:block">
          <ChatPreview assistant={assistant} />
        </div>
      </div>
    </LayoutShell>
  );
}
