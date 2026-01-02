import { useParams, Link } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useUpdateAssistant } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Loader2, 
  Zap,
  Brain,
  Search,
  Shield,
  Key,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AIWorkspacePage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading } = useAssistant(assistantId);
  const { mutateAsync: updateAssistant, isPending: isUpdating } = useUpdateAssistant();

  const [isGoogleOpen, setIsGoogleOpen] = useState(true);
  const [isEngineOpen, setIsEngineOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<'flash' | 'pro'>('flash');
  const [reasoningDepth, setReasoningDepth] = useState([0]);
  const [searchGrounding, setSearchGrounding] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  useEffect(() => {
    if (assistant) {
      setSystemPrompt(assistant.systemPrompt || "You are a virtual library assistant.\nYour role is to help library patrons by answering questions using only the provided library data.\nBe clear, polite, and accurate.\nIf the information is not available in the sources, say so and suggest contacting the library staff.");
    }
  }, [assistant]);

  const handleUpdateEngine = async () => {
    if (!assistant) return;
    await updateAssistant({
      id: assistantId,
      systemPrompt,
    });
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
          <h1 className="text-2xl font-bold mb-1">AI Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Configure Google Gemini engine parameters and institutional persona.
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Google Cloud Integration */}
          <Collapsible open={isGoogleOpen} onOpenChange={setIsGoogleOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold">Google Cloud Integration</CardTitle>
                  {isGoogleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">API Authorization</p>
                      <p className="text-sm">
                        Status: <span className="text-green-600 font-semibold">CONNECTED</span>
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowApiKeyDialog(true)}
                      data-testid="button-select-api-key"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Select API Key
                    </Button>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <p className="text-sm text-blue-800">
                      ChatLib uses the Google Gemini API via a private project. Your institutional data remains isolated and is <strong>never used to train global models</strong>.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Engine Configuration */}
          <Collapsible open={isEngineOpen} onOpenChange={setIsEngineOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold">Engine Configuration</CardTitle>
                  {isEngineOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Model Selection */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Model Selection
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedModel('flash')}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedModel === 'flash' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        data-testid="button-model-flash"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${selectedModel === 'flash' ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                            <Zap className="w-5 h-5" />
                          </div>
                          <span className="font-semibold">Gemini 3 Flash</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Speed-optimized for common queries and high concurrency.
                        </p>
                      </button>

                      <button
                        onClick={() => setSelectedModel('pro')}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedModel === 'pro' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        data-testid="button-model-pro"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${selectedModel === 'pro' ? 'bg-purple-100 text-purple-600' : 'bg-muted text-muted-foreground'}`}>
                            <Brain className="w-5 h-5" />
                          </div>
                          <span className="font-semibold">Gemini 3 Pro</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Deep reasoning for complex research and cross-referencing.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Reasoning Depth */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        Reasoning Depth (Thinking Tokens)
                      </Label>
                      <span className="text-sm font-mono text-primary">{reasoningDepth[0]}</span>
                    </div>
                    <Slider
                      value={reasoningDepth}
                      onValueChange={setReasoningDepth}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-reasoning"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>FAST OUTPUT</span>
                      <span>DEEP REASONING</span>
                    </div>
                  </div>

                  {/* Google Search Grounding */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Google Search Grounding</p>
                        <p className="text-xs text-muted-foreground">
                          Allow the model to query the web for real-time news or events outside library data.
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={searchGrounding} 
                      onCheckedChange={setSearchGrounding}
                      data-testid="switch-search-grounding"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* System Instructions */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                System Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[160px] resize-none font-mono text-sm"
                placeholder="Enter system instructions for the AI..."
                data-testid="textarea-system-prompt"
              />
            </CardContent>
          </Card>

          {/* Responsible AI Alignment */}
          <Card className="bg-muted/30 border-border">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Responsible AI Alignment</p>
                    <p className="text-xs text-muted-foreground">
                      Ensure your assistant adheres to library safety standards. Review content filters and data residency in the Security tab.
                    </p>
                  </div>
                </div>
                <Link href={`/assistant/${assistantId}/security`}>
                  <Button variant="outline" size="sm" data-testid="button-security-settings">
                    Go to Security Settings
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Update Engine Button */}
          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleUpdateEngine}
              disabled={isUpdating}
              className="px-8"
              data-testid="button-update-engine"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Update Engine
            </Button>
          </div>
        </div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              API Key Configuration
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                Your ChatLib application is connected to <strong>Replit AI Integrations</strong>, which automatically manages the Google Gemini API key for you.
              </p>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  Status: Connected
                </p>
                <p className="text-xs text-green-700 mt-1">
                  No additional configuration required. Your API access is secure and ready to use.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                API keys are managed securely through Replit's infrastructure. Your data remains private and is never used to train external models.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowApiKeyDialog(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}
