import { useParams, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useDocuments, useCreateDocument, useDeleteDocument } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Upload, 
  FileText, 
  Trash2, 
  Search, 
  HardDrive,
  Info,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  File
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
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

export default function FilesPage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading: isLoadingAssistant } = useAssistant(assistantId);
  const { data: documents, isLoading: isLoadingDocs } = useDocuments(assistantId);
  const { mutateAsync: createDocument, isPending: isUploading } = useCreateDocument();
  const { mutateAsync: deleteDocument } = useDeleteDocument();

  const [isAddOpen, setIsAddOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, [assistantId]);

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      await createDocument({
        assistantId,
        title: file.name,
        content: content,
        sourceType: 'upload',
        sourceId: `file-${Date.now()}`,
        metadata: { size: file.size, type: file.type }
      });
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const toggleSelectAll = () => {
    if (documents && selectedFiles.size === documents.length) {
      setSelectedFiles(new Set());
    } else if (documents) {
      setSelectedFiles(new Set(documents.map(d => d.id)));
    }
  };

  const filteredDocs = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
          <h1 className="text-2xl font-bold mb-1">Files</h1>
          <p className="text-sm text-muted-foreground">
            Train your Gemini assistant with local or cloud-based documents.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Add Documents Section */}
            <Collapsible open={isAddOpen} onOpenChange={setIsAddOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                    <CardTitle className="text-base font-semibold">Add documents</CardTitle>
                    {isAddOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Tabs defaultValue="local" className="w-full">
                      <TabsList className="mb-4 bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
                        <TabsTrigger 
                          value="local" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                        >
                          LOCAL STORAGE
                        </TabsTrigger>
                        <TabsTrigger 
                          value="drive" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                        >
                          GOOGLE DRIVE
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="local" className="mt-0">
                        <div
                          className={`
                            border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                            ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          `}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="dropzone-upload"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileSelect}
                            data-testid="input-file"
                          />
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Upload className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, DOCX, TXT (MAX. 10MB)
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="drive" className="mt-0">
                        <div className="border-2 border-dashed rounded-lg p-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12">
                              <HardDrive className="w-full h-full text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">Connect your Google Drive</p>
                              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                Instantly sync library documents, spreadsheets, and slides directly from your institutional Google Workspace.
                              </p>
                            </div>
                            <Button variant="outline" className="mt-2" disabled>
                              <HardDrive className="w-4 h-4 mr-2" />
                              Authorize Workspace
                            </Button>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                              SECURE OAuth 2.0 ENCRYPTION
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Files Sources Section */}
            <Card>
              <CardHeader className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base font-semibold">Files sources</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search..." 
                        className="pl-9 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search-files"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={documents && documents.length > 0 && selectedFiles.size === documents.length}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <span className="text-sm text-muted-foreground">Select all</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
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
                    <File className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">NO DOCUMENTS LINKED.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocs.map(doc => (
                      <div 
                        key={doc.id} 
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group"
                        data-testid={`file-item-${doc.id}`}
                      >
                        <Checkbox 
                          checked={selectedFiles.has(doc.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedFiles);
                            if (checked) {
                              newSelected.add(doc.id);
                            } else {
                              newSelected.delete(doc.id);
                            }
                            setSelectedFiles(newSelected);
                          }}
                        />
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.sourceType === 'upload' ? 'Local Upload' : 'Google Drive'} • {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteDocument({ id: doc.id, assistantId })}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
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

                <Button className="w-full bg-primary hover:bg-primary/90" data-testid="button-retrain">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retrain assistant
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
