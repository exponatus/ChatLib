import { useParams } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useUpdateAssistant } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Copy,
  Link as LinkIcon,
  Code,
  ChevronUp,
  ChevronDown,
  Globe,
  Check,
  X,
  Info,
  Rocket,
  BarChart3,
  Search,
  WifiOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

export default function DeployPage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading } = useAssistant(assistantId);
  const { mutateAsync: updateAssistant, isPending: isSaving } = useUpdateAssistant();
  const { toast } = useToast();

  const [isDomainsOpen, setIsDomainsOpen] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // SEO & Analytics settings from deploymentConfig
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [searchGrounding, setSearchGrounding] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing values from deploymentConfig
  useEffect(() => {
    if (assistant?.deploymentConfig) {
      const config = assistant.deploymentConfig as any;
      setGoogleAnalyticsId(config.googleAnalyticsId || "");
      setSeoDescription(config.seoDescription || "");
      setSearchGrounding(config.searchGrounding || false);
      setCustomDomain(config.customDomain || "");
      setHasChanges(false);
    }
  }, [assistant]);

  // Track changes
  const handleGoogleAnalyticsChange = (value: string) => {
    setGoogleAnalyticsId(value);
    setHasChanges(true);
  };

  const handleSeoDescriptionChange = (value: string) => {
    setSeoDescription(value);
    setHasChanges(true);
  };

  const handleSearchGroundingChange = (value: boolean) => {
    setSearchGrounding(value);
    setHasChanges(true);
  };

  const handleCustomDomainChange = (value: string) => {
    setCustomDomain(value);
    setHasChanges(true);
  };

  // Save SEO & Analytics settings
  const handleSaveSettings = async () => {
    try {
      const currentConfig = (assistant?.deploymentConfig as any) || {};
      await updateAssistant({
        id: assistantId,
        deploymentConfig: {
          ...currentConfig,
          googleAnalyticsId,
          seoDescription,
          searchGrounding,
          customDomain,
        },
      });
      setHasChanges(false);
      toast({ title: "Settings saved successfully" });
    } catch (err) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const isLive = assistant?.isPublished ?? false;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chatlib.de';
  const shareUrl = `${baseUrl}/c/${assistantId}`;
  const embedCode = `<iframe src="${baseUrl}/embed/${assistantId}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUnpublish = async () => {
    await updateAssistant({ id: assistantId, isPublished: false });
  };

  const handlePublish = async () => {
    await updateAssistant({ id: assistantId, isPublished: true });
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold mb-1">Publish & Distribute</h1>
          <p className="text-sm text-muted-foreground">
            Launch your library assistant to the world with full Google ecosystem integration.
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Status Card */}
          <Card className={isLive ? "border-green-200 bg-green-50/30" : "border-muted"}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isLive ? 'bg-green-500' : 'bg-muted'}`}>
                    {isLive ? (
                      <Rocket className="w-6 h-6 text-white" />
                    ) : (
                      <WifiOff className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {isLive ? "Assistant is LIVE" : "Assistant is OFFLINE"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isLive 
                        ? "Your library community can now access the assistant via all enabled channels."
                        : "Visible only in the workspace playground for internal testing."
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={isLive ? handleUnpublish : handlePublish} 
                  className={isLive ? "bg-destructive hover:bg-destructive/90" : ""}
                  data-testid={isLive ? "button-unpublish" : "button-publish"}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  {isLive ? "Unpublish" : "Publish to Public"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Card>
            <Tabs defaultValue="general" className="w-full">
              <CardHeader className="pb-0">
                <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
                  <TabsTrigger 
                    value="general" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                  >
                    GENERAL ACCESS
                  </TabsTrigger>
                  <TabsTrigger 
                    value="google-sites" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                  >
                    GOOGLE SITES SETUP
                  </TabsTrigger>
                  <TabsTrigger 
                    value="seo" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                  >
                    SEO & ANALYTICS
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="general" className="mt-0">
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Direct Share Link */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" />
                        Direct Share Link
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Share this URL on social media, library emails, or QR codes.
                      </p>
                      <div className="flex gap-2">
                        <Input 
                          value={shareUrl}
                          readOnly
                          className="text-xs font-mono bg-muted/30"
                          data-testid="input-share-url"
                        />
                        <Button 
                          variant="outline"
                          onClick={() => copyToClipboard(shareUrl, 'share')}
                          data-testid="button-copy-share"
                        >
                          {copiedField === 'share' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="ml-2">Copy</span>
                        </Button>
                      </div>
                    </div>

                    {/* Generic Embed */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        Generic Embed
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Standard HTML code for LibGuides, WordPress, or custom CMS.
                      </p>
                      <div className="flex gap-2">
                        <Input 
                          value={embedCode}
                          readOnly
                          className="text-xs font-mono bg-muted/30"
                          data-testid="input-embed-code"
                        />
                        <Button 
                          variant="outline"
                          onClick={() => copyToClipboard(embedCode, 'embed')}
                          data-testid="button-copy-embed"
                        >
                          {copiedField === 'embed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="ml-2">Copy</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="google-sites" className="mt-0">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Integrating with Google Sites</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Google Sites is common in libraries. To add ChatLib, follow these steps:
                      </p>
                      <ol className="text-sm space-y-2 text-muted-foreground">
                        <li>1. Open your <strong className="text-foreground">Google Site</strong> in edit mode.</li>
                        <li>2. In the right sidebar, click <strong className="text-foreground">Embed</strong>.</li>
                        <li>3. Select the <strong className="text-foreground">By URL</strong> tab.</li>
                        <li>4. Paste the <strong className="text-foreground">Direct Share Link</strong> provided below.</li>
                        <li>5. Click <strong className="text-foreground">Insert</strong> and resize the element to fit the page width.</li>
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      GOOGLE SITES LINK
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value={shareUrl}
                        readOnly
                        className="text-xs font-mono bg-muted/30"
                        data-testid="input-google-sites-url"
                      />
                      <Button 
                        variant="outline"
                        onClick={() => copyToClipboard(shareUrl, 'google-sites')}
                        data-testid="button-copy-google-sites"
                      >
                        {copiedField === 'google-sites' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="ml-2">Copy Link</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="seo" className="mt-0">
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Google Analytics */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">Google Analytics 4</h3>
                      </div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        MEASUREMENT ID
                      </Label>
                      <Input 
                        value={googleAnalyticsId}
                        onChange={(e) => handleGoogleAnalyticsChange(e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        data-testid="input-ga-id"
                      />
                      <p className="text-xs text-muted-foreground">
                        Connect your library's GA4 property to track user sessions and message volume.
                      </p>
                    </div>

                    {/* SEO Meta Description */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">Google Search Discovery</h3>
                      </div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        SEO META DESCRIPTION
                      </Label>
                      <Textarea 
                        value={seoDescription}
                        onChange={(e) => handleSeoDescriptionChange(e.target.value)}
                        placeholder="Institutional AI guide for patrons..."
                        className="resize-none h-20"
                        data-testid="input-seo-description"
                      />
                    </div>
                  </div>

                  {/* Google Search Grounding */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Search className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Google Search Grounding</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow Gemini to use real-time web results for library-external queries.
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={searchGrounding}
                      onCheckedChange={handleSearchGroundingChange}
                      data-testid="switch-search-grounding"
                    />
                  </div>

                  {/* Save Button */}
                  {hasChanges && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        data-testid="button-save-seo"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Settings
                      </Button>
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>

          {/* White-label Domains */}
          <Collapsible open={isDomainsOpen} onOpenChange={setIsDomainsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold">White-label Domains</CardTitle>
                  {isDomainsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sub-Domain URL */}
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Custom Domain
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            value={customDomain}
                            onChange={(e) => handleCustomDomainChange(e.target.value)}
                            placeholder="chat.yourlibrary.org"
                            data-testid="input-subdomain"
                          />
                          <Button 
                            onClick={handleSaveSettings}
                            disabled={isSaving || !customDomain}
                            data-testid="button-link-domain"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter your custom domain (e.g., chat.library.org). DNS setup required.
                        </p>
                      </div>

                      <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            DNS Configuration
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Add this CNAME record to your DNS provider:
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Type</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">CNAME</code>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Value</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            chatlib.de
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Current Domain Status */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Domain Status
                      </Label>
                      <div className="space-y-2">
                        {customDomain ? (
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{customDomain}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="text-xs text-yellow-600 font-medium">PENDING DNS</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground"
                              onClick={() => copyToClipboard(customDomain, 'domain')}
                            >
                              {copiedField === 'domain' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/30 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">No custom domain configured</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{shareUrl}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-xs text-green-600 font-medium">DEFAULT</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground"
                            onClick={() => copyToClipboard(shareUrl, 'default-url')}
                          >
                            {copiedField === 'default-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Pro Tip */}
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  <strong>Pro Tip:</strong> When using <strong>Google Search Grounding</strong>, the assistant will automatically provide citations for web-sourced information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
