import { useParams } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument, useRetrainAssistant } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Bold,
  Italic,
  Code,
  Info,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  FileText,
  Trash2,
  Pencil,
  X,
  Check
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function TextPage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading: isLoadingAssistant } = useAssistant(assistantId);
  const { data: documents, isLoading: isLoadingDocs } = useDocuments(assistantId);
  const { mutateAsync: createDocument, isPending: isCreating } = useCreateDocument();
  const { mutateAsync: updateDocument, isPending: isUpdating } = useUpdateDocument();
  const { mutateAsync: deleteDocument } = useDeleteDocument();
  const { mutateAsync: retrainAssistant, isPending: isRetraining } = useRetrainAssistant();

  const [isAddOpen, setIsAddOpen] = useState(true);
  const [assetName, setAssetName] = useState("");
  const [contentBody, setContentBody] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");

  const textDocuments = documents?.filter(d => d.sourceType === 'text') || [];

  const startEditing = (doc: { id: number; title: string; content: string }) => {
    setEditingId(doc.id);
    setEditName(doc.title);
    setEditContent(doc.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim() || !editContent.trim()) return;
    
    await updateDocument({
      id: editingId,
      assistantId,
      title: editName,
      content: editContent,
      metadata: { size: new Blob([editContent]).size }
    });
    
    cancelEditing();
  };

  const handleAddTextAsset = async () => {
    if (!assetName.trim() || !contentBody.trim()) return;
    
    await createDocument({
      assistantId,
      title: assetName,
      content: contentBody,
      sourceType: 'text',
      sourceId: `text-${Date.now()}`,
      metadata: { size: new Blob([contentBody]).size }
    });
    
    setAssetName("");
    setContentBody("");
  };

  const bytesUsed = new Blob([contentBody]).size;

  const totalStorageKB = documents?.reduce((acc, doc) => {
    const metadata = doc.metadata as { size?: number } | null;
    return acc + (metadata?.size || 0);
  }, 0) || 0;

  if (isLoadingAssistant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <LayoutShell assistantId={assistantId}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Text</h1>
          <p className="text-sm text-muted-foreground">
            Inject library protocols and help-desk scripts directly into Gemini's knowledge.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Add Text Asset Section */}
            <Collapsible open={isAddOpen} onOpenChange={setIsAddOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                    <CardTitle className="text-base font-semibold">Add text asset</CardTitle>
                    {isAddOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Asset Name
                      </Label>
                      <Input 
                        placeholder="Ex: Borrowing Rules 2025"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        data-testid="input-asset-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Content Body
                        </Label>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-bold">
                            <Bold className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-italic">
                            <Italic className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-code">
                            <Code className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Textarea 
                        placeholder="Paste institutional protocols or policy text here..."
                        className="min-h-[200px] resize-none"
                        value={contentBody}
                        onChange={(e) => setContentBody(e.target.value)}
                        data-testid="textarea-content"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          {bytesUsed} BYTES USED
                        </span>
                        <span className="text-green-600 font-semibold">
                          COMPOSER ACTIVE
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={handleAddTextAsset}
                        disabled={!assetName.trim() || !contentBody.trim() || isCreating}
                        data-testid="button-add-text"
                      >
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Add text asset
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Text Assets List */}
            {textDocuments.length > 0 && (
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-semibold">Text assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {textDocuments.map(doc => {
                      const isEditing = editingId === doc.id;
                      
                      if (isEditing) {
                        return (
                          <div 
                            key={doc.id} 
                            className="p-4 bg-muted/30 rounded-lg border-2 border-primary/20"
                            data-testid={`text-edit-${doc.id}`}
                          >
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Asset Name
                                </Label>
                                <Input 
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  data-testid={`edit-name-${doc.id}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Content Body
                                </Label>
                                <Textarea 
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="min-h-[150px] resize-none"
                                  data-testid={`edit-content-${doc.id}`}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={cancelEditing}
                                data-testid={`button-cancel-edit-${doc.id}`}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                              <Button 
                                size="sm"
                                onClick={saveEdit}
                                disabled={!editName.trim() || !editContent.trim() || isUpdating}
                                data-testid={`button-save-edit-${doc.id}`}
                              >
                                {isUpdating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                Save
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div 
                          key={doc.id} 
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group"
                          data-testid={`text-item-${doc.id}`}
                        >
                          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {(doc.content || '').substring(0, 100)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Text Asset • {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100"
                              onClick={() => startEditing({ id: doc.id, title: doc.title, content: doc.content || '' })}
                              data-testid={`button-edit-${doc.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={() => deleteDocument({ id: doc.id, assistantId })}
                              data-testid={`button-delete-${doc.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Knowledge Summary */}
          <div className="lg:w-72 space-y-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base font-semibold">Knowledge Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {documents && documents.length > 0 
                    ? `${documents.length} source${documents.length > 1 ? 's' : ''} connected.`
                    : "No sources connected yet."}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total storage:</span>
                  <span>
                    <strong>{(totalStorageKB / 1024).toFixed(1)} KB</strong>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-green-600 font-medium">∞ UNLIMITED</span>
                  </span>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-retrain"
                  onClick={() => retrainAssistant(assistantId)}
                  disabled={isRetraining}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRetraining ? 'animate-spin' : ''}`} />
                  {isRetraining ? 'Retraining...' : 'Retrain assistant'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    <strong>Institutional Tier enabled:</strong> Your library has no data caps for training sources.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
