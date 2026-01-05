import { useParams } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant } from "@/hooks/use-assistants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Send, 
  RotateCcw,
  MessageSquare,
  Cpu,
  Cloud
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

export default function AssistantEditor() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading } = useAssistant(assistantId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get settings from deploymentConfig
  const config = assistant?.deploymentConfig as {
    theme?: string;
    font?: string;
    suggestedPrompts?: string[];
    footerText?: string;
    showGeminiBranding?: boolean;
  } | null;
  
  const suggestedPrompts = config?.suggestedPrompts?.length 
    ? config.suggestedPrompts 
    : [
        "How do I get a library card?",
        "How do I renew my items?",
        "What are the opening hours?",
        "Do you have e-books?"
      ];
  
  const footerText = config?.footerText || "";
  const showGeminiBranding = config?.showGeminiBranding !== false;
  const selectedTheme = config?.theme || 'material';
  const selectedFont = config?.font || 'Inter';

  // Theme-specific styles
  const themeStyles = {
    material: {
      card: "rounded-2xl shadow-lg",
      message: "rounded-2xl",
      userMessage: "bg-primary text-primary-foreground rounded-2xl",
      assistantMessage: "bg-muted rounded-2xl",
      input: "rounded-full",
      button: "rounded-full",
    },
    classic: {
      card: "rounded-none shadow-sm border-2",
      message: "rounded-none",
      userMessage: "bg-primary text-primary-foreground rounded-none",
      assistantMessage: "bg-muted rounded-none border",
      input: "rounded-none",
      button: "rounded-none",
    },
    minimalist: {
      card: "rounded-lg shadow-none border",
      message: "rounded-lg",
      userMessage: "bg-primary/90 text-primary-foreground rounded-lg",
      assistantMessage: "bg-transparent border rounded-lg",
      input: "rounded-lg border-muted",
      button: "rounded-lg",
    },
  };

  const currentTheme = themeStyles[selectedTheme as keyof typeof themeStyles] || themeStyles.material;

  // Font family mapping
  const fontFamilies: Record<string, string> = {
    'Inter': "'Inter', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Open Sans': "'Open Sans', sans-serif",
    'Montserrat': "'Montserrat', sans-serif",
    'Playfair Display': "'Playfair Display', serif",
    'Source Sans Pro': "'Source Sans Pro', sans-serif",
  };

  const fontFamily = fontFamilies[selectedFont] || fontFamilies['Inter'];

  // Load Google Font dynamically
  useEffect(() => {
    if (selectedFont && selectedFont !== 'Inter') {
      const fontName = selectedFont.replace(/ /g, '+');
      const linkId = 'dynamic-google-font';
      let linkEl = document.getElementById(linkId) as HTMLLinkElement;
      
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = linkId;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      
      linkEl.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
    }
  }, [selectedFont]);

  // Simple Markdown to HTML renderer
  const renderMarkdown = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline">$1</a>')
      .replace(/\n/g, '<br>');
  };

  const createChatSession = async () => {
    try {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId }),
        credentials: "include"
      });
      if (res.ok) {
        const session = await res.json();
        setConversationId(session.id);
        return session.id;
      }
    } catch (error) {
      console.error("Failed to create chat session:", error);
    }
    return null;
  };

  useEffect(() => {
    if (assistant) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: assistant.welcomeMessage || "Hello! I'm here to help you with library services, borrowing rules, events, and digital resources. How can I assist you today?"
      }]);
      setConversationId(null);
    }
  }, [assistant?.welcomeMessage, assistant?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      let sessionId = conversationId;
      if (!sessionId) {
        sessionId = await createChatSession();
        if (!sessionId) {
          setMessages(prev => [...prev, {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I couldn't connect to the chat service. Please try again."
          }]);
          setIsTyping(false);
          return;
        }
      }

      const res = await fetch(`/api/chat/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const assistantMessageId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: ""
      }]);

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: fullContent }
                    : m
                ));
              }
            } catch {
            }
          }
        }
      }

      setIsTyping(false);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }]);
      setIsTyping(false);
    }
  };

  const handleClearSession = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: assistant?.welcomeMessage || "Hello! I'm here to help you with library services, borrowing rules, events, and digital resources. How can I assist you today?"
    }]);
    setConversationId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
      <div className="p-6 lg:p-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Intelligence Playground</h1>
            <p className="text-sm text-muted-foreground">
              Test your integrated Gemini assistant in a live library environment.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleClearSession}
            data-testid="button-clear-session"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear Session
          </Button>
        </div>

        {/* Chat Container */}
        <Card className={`flex-1 flex flex-col overflow-hidden ${currentTheme.card}`} style={{ fontFamily }}>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Assistant Info Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  {assistant.coverImage ? (
                    <img src={assistant.coverImage} alt={assistant.name} className="w-full h-full object-cover" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{assistant.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Cloud className="w-3 h-3 mr-1" />
                      WORKSPACE CLOUD
                    </Badge>
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-500 text-white">
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu className="w-4 h-4" />
                <span>Engine</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 ${
                      message.role === "user"
                        ? currentTheme.userMessage
                        : currentTheme.assistantMessage
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && messages[messages.length - 1]?.content === "" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {messages.length === 1 && (
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSend(prompt)}
                      data-testid={`button-prompt-${prompt.substring(0, 10)}`}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your library assistant anything..."
                  className={`flex-1 ${currentTheme.input}`}
                  data-testid="input-chat-message"
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={!inputValue.trim() || isTyping}
                  className={currentTheme.button}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Footer Labels */}
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="uppercase tracking-wide font-medium">Testing Environment</span>
                </div>
                <div className="flex items-center gap-2">
                  {footerText && (
                    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(footerText) }} />
                  )}
                  {showGeminiBranding && (
                    <span className="flex items-center gap-1">
                      ChatLib • Powered by 
                      <svg className="w-4 h-4 inline-block ml-0.5" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#gemini-grad1)"/>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#gemini-grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <defs>
                          <linearGradient id="gemini-grad1" x1="2" y1="7" x2="22" y2="7">
                            <stop stopColor="#4285F4"/>
                            <stop offset="1" stopColor="#8E44AD"/>
                          </linearGradient>
                          <linearGradient id="gemini-grad2" x1="2" y1="14.5" x2="22" y2="14.5">
                            <stop stopColor="#4285F4"/>
                            <stop offset="1" stopColor="#8E44AD"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="font-medium">Gemini</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
