import { useParams } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument, useRetrainAssistant } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Plus,
  User,
  CheckCircle,
  Info,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
  Trash2,
  HelpCircle,
  Pencil,
  X,
  Check
} from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function QAPage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading: isLoadingAssistant } = useAssistant(assistantId);
  const { data: documents, isLoading: isLoadingDocs } = useDocuments(assistantId);
  const { mutateAsync: createDocument, isPending: isSaving } = useCreateDocument();
  const { mutateAsync: updateDocument, isPending: isUpdating } = useUpdateDocument();
  const { mutateAsync: deleteDocument } = useDeleteDocument();
  const { mutateAsync: retrainAssistant, isPending: isRetraining } = useRetrainAssistant();

  const [isAddOpen, setIsAddOpen] = useState(true);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedFaqs, setSelectedFaqs] = useState<Set<number>>(new Set());
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editResponse, setEditResponse] = useState("");

  const startEditing = (doc: { id: number; metadata: { question?: string; response?: string } | null }) => {
    const metadata = doc.metadata;
    setEditingId(doc.id);
    setEditQuestion(metadata?.question || '');
    setEditResponse(metadata?.response || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditResponse("");
  };

  const saveEdit = async () => {
    if (!editingId || !editQuestion.trim() || !editResponse.trim()) return;
    
    await updateDocument({
      id: editingId,
      assistantId,
      title: editQuestion,
      content: `Q: ${editQuestion}\nA: ${editResponse}`,
      metadata: { 
        question: editQuestion,
        response: editResponse,
        size: new Blob([editQuestion + editResponse]).size 
      }
    });
    
    cancelEditing();
  };

  const faqDocuments = documents?.filter(d => d.sourceType === 'faq') || [];

  const handleSaveFaq = async () => {
    if (!question.trim() || !response.trim()) return;
    
    await createDocument({
      assistantId,
      title: question,
      content: `Q: ${question}\nA: ${response}`,
      sourceType: 'faq',
      sourceId: `faq-${Date.now()}`,
      metadata: { 
        question,
        response,
        size: new Blob([question + response]).size 
      }
    });
    
    setQuestion("");
    setResponse("");
  };

  const toggleSelectAll = () => {
    if (faqDocuments.length > 0 && selectedFaqs.size === faqDocuments.length) {
      setSelectedFaqs(new Set());
    } else {
      setSelectedFaqs(new Set(faqDocuments.map(d => d.id)));
    }
  };

  const filteredDocs = faqDocuments.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold mb-1">Q&A</h1>
          <p className="text-sm text-muted-foreground">
            Define high-precision answers for critical institutional questions.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Add FAQ Pair Section */}
            <Collapsible open={isAddOpen} onOpenChange={setIsAddOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                    <CardTitle className="text-base font-semibold">Add FAQ pair</CardTitle>
                    {isAddOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Patron Question */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <User className="w-3.5 h-3.5" />
                          Patron Question
                        </Label>
                        <Textarea 
                          placeholder="Ex: How do I renew my books online?"
                          className="min-h-[140px] resize-none"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          data-testid="textarea-question"
                        />
                      </div>

                      {/* Official Response */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-green-600 uppercase tracking-wide flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Official Response
                        </Label>
                        <Textarea 
                          placeholder="Official institutional guide..."
                          className="min-h-[140px] resize-none"
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          data-testid="textarea-response"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        variant="outline"
                        onClick={handleSaveFaq}
                        disabled={!question.trim() || !response.trim() || isSaving}
                        data-testid="button-save-faq"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Save FAQ Pair
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Training Set Section */}
            <Card>
              <CardHeader className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base font-semibold">Training set</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search FAQ..." 
                        className="pl-9 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search-faq"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={faqDocuments.length > 0 && selectedFaqs.size === faqDocuments.length}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <span className="text-sm text-muted-foreground">Select all</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-24 h-8 text-sm" data-testid="select-sort">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingDocs ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="py-12 text-center">
                    <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">NO FAQ DATA</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocs.map(doc => {
                      const metadata = doc.metadata as { question?: string; response?: string } | null;
                      const isEditing = editingId === doc.id;
                      
                      if (isEditing) {
                        return (
                          <div 
                            key={doc.id} 
                            className="p-4 bg-muted/30 rounded-lg border-2 border-primary/20"
                            data-testid={`faq-edit-${doc.id}`}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Question</Label>
                                <Textarea 
                                  value={editQuestion}
                                  onChange={(e) => setEditQuestion(e.target.value)}
                                  className="min-h-[80px] resize-none"
                                  data-testid={`edit-question-${doc.id}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Response</Label>
                                <Textarea 
                                  value={editResponse}
                                  onChange={(e) => setEditResponse(e.target.value)}
                                  className="min-h-[80px] resize-none"
                                  data-testid={`edit-response-${doc.id}`}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
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
                                disabled={!editQuestion.trim() || !editResponse.trim() || isUpdating}
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
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg group"
                          data-testid={`faq-item-${doc.id}`}
                        >
                          <Checkbox 
                            className="mt-1"
                            checked={selectedFaqs.has(doc.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedFaqs);
                              if (checked) {
                                newSelected.add(doc.id);
                              } else {
                                newSelected.delete(doc.id);
                              }
                              setSelectedFaqs(newSelected);
                            }}
                          />
                          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md mt-0.5">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{metadata?.question || doc.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {metadata?.response || ''}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              FAQ Pair • {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100"
                              onClick={() => startEditing({ id: doc.id, metadata })}
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
                )}
              </CardContent>
            </Card>
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
