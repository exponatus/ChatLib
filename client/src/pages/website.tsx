import { useParams } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useDocuments, useCreateDocument, useDeleteDocument, useRetrainAssistant } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Globe,
  Info,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
  Trash2,
  Link as LinkIcon
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function WebsitePage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading: isLoadingAssistant } = useAssistant(assistantId);
  const { data: documents, isLoading: isLoadingDocs } = useDocuments(assistantId);
  const { mutateAsync: createDocument, isPending: isFetching } = useCreateDocument();
  const { mutateAsync: deleteDocument } = useDeleteDocument();
  const { mutateAsync: retrainAssistant, isPending: isRetraining } = useRetrainAssistant();

  const [isAddOpen, setIsAddOpen] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [protocol, setProtocol] = useState("https");
  const [includePaths, setIncludePaths] = useState("");
  const [excludePaths, setExcludePaths] = useState("");
  const [slowScraping, setSlowScraping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());

  const webDocuments = documents?.filter(d => d.sourceType === 'website') || [];

  const handleFetchLinks = async () => {
    if (!url.trim()) return;
    
    await createDocument({
      assistantId,
      title: `${protocol}://${url}`,
      content: `Website content from ${protocol}://${url}`,
      sourceType: 'website',
      sourceId: `web-${Date.now()}`,
      metadata: { 
        url: `${protocol}://${url}`,
        includePaths,
        excludePaths,
        slowScraping
      }
    });
    
    setUrl("");
  };

  const toggleSelectAll = () => {
    if (webDocuments.length > 0 && selectedLinks.size === webDocuments.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(webDocuments.map(d => d.id)));
    }
  };

  const filteredDocs = webDocuments.filter(doc => 
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
          <h1 className="text-2xl font-bold mb-1">Website</h1>
          <p className="text-sm text-muted-foreground">
            Connect Gemini to your official library portal to sync events and catalogs.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Add Links Section */}
            <Collapsible open={isAddOpen} onOpenChange={setIsAddOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                    <CardTitle className="text-base font-semibold">Add links</CardTitle>
                    {isAddOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Tabs defaultValue="crawl" className="w-full">
                      <div className="overflow-x-auto mb-4">
                        <TabsList className="bg-transparent border-b border-border rounded-none w-max min-w-full justify-start h-auto p-0">
                          <TabsTrigger 
                            value="crawl" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            CRAWL LINKS
                          </TabsTrigger>
                          <TabsTrigger 
                            value="sitemap" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            SITEMAP
                          </TabsTrigger>
                          <TabsTrigger 
                            value="individual" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            INDIVIDUAL
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="crawl" className="mt-0 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            URL
                          </Label>
                          <div className="flex gap-2">
                            <Select value={protocol} onValueChange={setProtocol}>
                              <SelectTrigger className="w-28" data-testid="select-protocol">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="https">HTTPS://</SelectItem>
                                <SelectItem value="http">HTTP://</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              placeholder="www.example.com"
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              className="flex-1"
                              data-testid="input-url"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                            Links found during crawling or sitemap retrieval may be updated if new links are discovered or some links are invalid.
                          </p>
                        </div>

                        {/* Advanced Options */}
                        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            {isAdvancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4 rotate-180" />}
                            ADVANCED OPTIONS
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Include Only Paths
                                </Label>
                                <Input 
                                  placeholder="Ex: blog/*, dev/*"
                                  value={includePaths}
                                  onChange={(e) => setIncludePaths(e.target.value)}
                                  data-testid="input-include-paths"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Exclude Paths
                                </Label>
                                <Input 
                                  placeholder="Ex: blog/*, dev/*"
                                  value={excludePaths}
                                  onChange={(e) => setExcludePaths(e.target.value)}
                                  data-testid="input-exclude-paths"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id="slow-scraping"
                                checked={slowScraping}
                                onCheckedChange={(checked) => setSlowScraping(checked as boolean)}
                                data-testid="checkbox-slow-scraping"
                              />
                              <Label htmlFor="slow-scraping" className="text-sm cursor-pointer">
                                Slow scraping
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-xs">Enable slow scraping to reduce load on the target website. Recommended for smaller servers.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        <div className="flex justify-end pt-2">
                          <Button 
                            onClick={handleFetchLinks}
                            disabled={!url.trim() || isFetching}
                            data-testid="button-fetch-links"
                          >
                            {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Fetch links
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="sitemap" className="mt-0">
                        <div className="py-8 text-center text-muted-foreground">
                          <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Enter a sitemap URL to import all links at once.</p>
                          <p className="text-xs mt-1">Coming soon...</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="individual" className="mt-0">
                        <div className="py-8 text-center text-muted-foreground">
                          <LinkIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Add individual links one at a time.</p>
                          <p className="text-xs mt-1">Coming soon...</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Link Sources Section */}
            <Card>
              <CardHeader className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base font-semibold">Link sources</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search..." 
                        className="pl-9 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search-links"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={webDocuments.length > 0 && selectedLinks.size === webDocuments.length}
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
                    <Globe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">NO WEB SOURCES LINKED.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocs.map(doc => (
                      <div 
                        key={doc.id} 
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group"
                        data-testid={`link-item-${doc.id}`}
                      >
                        <Checkbox 
                          checked={selectedLinks.has(doc.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedLinks);
                            if (checked) {
                              newSelected.add(doc.id);
                            } else {
                              newSelected.delete(doc.id);
                            }
                            setSelectedLinks(newSelected);
                          }}
                        />
                        <div className="p-2 bg-green-50 text-green-600 rounded-md">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Website • {new Date(doc.createdAt).toLocaleDateString()}
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
