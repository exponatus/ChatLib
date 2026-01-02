import { useParams } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant, useUpdateAssistant } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  X,
  Bold,
  Italic,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const themes = [
  { id: 'material', name: 'MATERIAL YOU', description: 'Google design language with soft shadows and large radii.', selected: true },
  { id: 'classic', name: 'CLASSIC LIBRARY', description: 'Sharp edges and professional enterprise-grade look.' },
  { id: 'minimalist', name: 'MINIMALIST', description: 'Almost invisible borders, focused entirely on text.' },
];

const fonts = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Playfair Display', 'Source Sans Pro'];

export default function ChatInterfacePage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading } = useAssistant(assistantId);
  const { mutateAsync: updateAssistant, isPending: isUpdating } = useUpdateAssistant();

  const [isVisualOpen, setIsVisualOpen] = useState(true);
  const [isThemeOpen, setIsThemeOpen] = useState(true);
  const [isStartersOpen, setIsStartersOpen] = useState(true);
  const [isFooterOpen, setIsFooterOpen] = useState(true);

  const [assistantName, setAssistantName] = useState("Library Assistant");
  const [greetingMessage, setGreetingMessage] = useState("Hello! I'm here to help you with library services, borrowing rules, events, and digital resources. How can I assist you today?");
  const [selectedTheme, setSelectedTheme] = useState('material');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "How do I get a library card?",
    "How do I renew my items?",
    "What are the opening hours?",
    "Do you have e-books?"
  ]);
  const [newPrompt, setNewPrompt] = useState("");
  const [footerText, setFooterText] = useState("");
  const [showGeminiBranding, setShowGeminiBranding] = useState(true);

  useEffect(() => {
    if (assistant) {
      setAssistantName(assistant.name || "Library Assistant");
      setGreetingMessage(assistant.welcomeMessage || "Hello! I'm here to help you with library services, borrowing rules, events, and digital resources. How can I assist you today?");
    }
  }, [assistant]);

  const addPrompt = () => {
    if (newPrompt.trim() && !suggestedPrompts.includes(newPrompt.trim())) {
      setSuggestedPrompts([...suggestedPrompts, newPrompt.trim()]);
      setNewPrompt("");
    }
  };

  const removePrompt = (prompt: string) => {
    setSuggestedPrompts(suggestedPrompts.filter(p => p !== prompt));
  };

  const handleApplyChanges = async () => {
    if (!assistant) return;
    await updateAssistant({
      id: assistantId,
      name: assistantName,
      welcomeMessage: greetingMessage,
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
          <h1 className="text-2xl font-bold mb-1">Chat Interface</h1>
          <p className="text-sm text-muted-foreground">
            Personalize the visual presence of your library assistant for your website and patrons.
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Visual Identity */}
          <Collapsible open={isVisualOpen} onOpenChange={setIsVisualOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold">Visual Identity</CardTitle>
                  {isVisualOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assistant Avatar */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Assistant Avatar
                      </Label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <Button variant="outline" size="sm" data-testid="button-change-image">
                            Change Image
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended: Square PNG/JPG
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Greeting Message */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Greeting Message
                      </Label>
                      <Textarea
                        value={greetingMessage}
                        onChange={(e) => setGreetingMessage(e.target.value)}
                        className="min-h-[100px] resize-none text-sm"
                        placeholder="Enter a greeting message..."
                        data-testid="textarea-greeting"
                      />
                    </div>
                  </div>

                  {/* Assistant Name */}
                  <div className="space-y-3 max-w-md">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Assistant Name
                    </Label>
                    <Input
                      value={assistantName}
                      onChange={(e) => setAssistantName(e.target.value)}
                      placeholder="Library Assistant"
                      data-testid="input-assistant-name"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Theme & Typography */}
          <Collapsible open={isThemeOpen} onOpenChange={setIsThemeOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold">Theme & Typography</CardTitle>
                  {isThemeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Theme Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all relative ${
                          selectedTheme === theme.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        data-testid={`button-theme-${theme.id}`}
                      >
                        {selectedTheme === theme.id && (
                          <div className="absolute top-3 right-3">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <p className="font-semibold text-sm mb-1">{theme.name}</p>
                        <p className="text-xs text-muted-foreground">{theme.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Typeface Integration */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <span className="text-base">T</span>
                      Typeface Integration
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {fonts.map((font) => (
                        <Button
                          key={font}
                          variant={selectedFont === font ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFont(font)}
                          className="rounded-full"
                          data-testid={`button-font-${font.toLowerCase().replace(' ', '-')}`}
                        >
                          {font}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Conversation Starters */}
          <Collapsible open={isStartersOpen} onOpenChange={setIsStartersOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold">Conversation Starters</CardTitle>
                  {isStartersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Suggested Prompts
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedPrompts.map((prompt) => (
                        <Badge 
                          key={prompt} 
                          variant="secondary" 
                          className="pl-3 pr-1 py-1.5 text-sm font-normal gap-1"
                        >
                          {prompt}
                          <button 
                            onClick={() => removePrompt(prompt)}
                            className="ml-1 p-0.5 hover:bg-muted rounded"
                            data-testid={`button-remove-prompt-${prompt.slice(0, 10)}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="Ex: How do I renew books?"
                      onKeyDown={(e) => e.key === 'Enter' && addPrompt()}
                      className="flex-1"
                      data-testid="input-new-prompt"
                    />
                    <Button onClick={addPrompt} data-testid="button-add-prompt">
                      Add
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Footer */}
          <Collapsible open={isFooterOpen} onOpenChange={setIsFooterOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold">Footer</CardTitle>
                  {isFooterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Chat Footer
                      </Label>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Bold className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Italic className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </Button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <AlignLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <AlignCenter className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <AlignRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="Institutional copyright or contact links..."
                      className="min-h-[80px] resize-none"
                      data-testid="textarea-footer"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Live Preview
                    </Label>
                    <div className="p-4 bg-muted/30 rounded-lg min-h-[40px] text-sm text-muted-foreground">
                      {footerText || "No footer text defined..."}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-blue-600">Google Gemini Branding</p>
                      <p className="text-xs text-muted-foreground">Display trust badge.</p>
                    </div>
                    <Switch 
                      checked={showGeminiBranding} 
                      onCheckedChange={setShowGeminiBranding}
                      data-testid="switch-gemini-branding"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Apply Visual Changes Button */}
          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleApplyChanges}
              disabled={isUpdating}
              className="px-8"
              data-testid="button-apply-changes"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Apply Visual Changes
            </Button>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
