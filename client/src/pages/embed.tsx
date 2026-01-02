import { useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

interface Message {
  id: number;
  role: "user" | "model";
  content: string;
}

interface Assistant {
  id: number;
  name: string;
  welcomeMessage: string | null;
  isPublished: boolean;
  deploymentConfig: {
    theme?: string;
    font?: string;
    primaryColor?: string;
    footerText?: string;
    suggestedPrompts?: string[];
    showGeminiBranding?: boolean;
    googleAnalyticsId?: string;
    seoDescription?: string;
  } | null;
}

export default function EmbedPage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: assistant, isLoading, error } = useQuery<Assistant>({
    queryKey: ['/api/public/assistant', assistantId],
    queryFn: async () => {
      const res = await fetch(`/api/public/assistant/${assistantId}`);
      if (!res.ok) throw new Error("Assistant not found");
      return res.json();
    },
    enabled: !!assistantId,
  });

  const createSession = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
    },
  });

  useEffect(() => {
    if (assistant && !sessionId) {
      createSession.mutate();
    }
  }, [assistant, sessionId]);

  // Load Google Analytics if configured
  useEffect(() => {
    if (assistant?.deploymentConfig?.googleAnalyticsId) {
      const gaId = assistant.deploymentConfig.googleAnalyticsId;
      // Add GA script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(script2);
    }
  }, [assistant]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    
    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsStreaming(true);
    const assistantMsg: Message = {
      id: Date.now() + 1,
      role: "model",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch(`/api/chat/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
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
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === "model") {
                      lastMsg.content += data.content;
                    }
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !assistant) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Assistant not found or not published</p>
      </div>
    );
  }

  if (!assistant.isPublished) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">This assistant is not yet published</p>
      </div>
    );
  }

  const config = assistant.deploymentConfig || {};
  const suggestedPrompts = config.suggestedPrompts || [];

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold">{assistant.name}</h1>
          <p className="text-xs text-muted-foreground">Library Assistant</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && assistant.welcomeMessage && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <p className="text-sm">{assistant.welcomeMessage}</p>
              </div>
            </div>
          )}

          {messages.length === 0 && suggestedPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {suggestedPrompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedPrompt(prompt)}
                  data-testid={`suggested-prompt-${i}`}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "model" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isStreaming || !sessionId}
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isStreaming || !sessionId}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {config.footerText && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {config.footerText}
            </p>
          )}
          {config.showGeminiBranding !== false && (
            <p className="text-xs text-muted-foreground text-center mt-1 flex items-center justify-center gap-1">
              ChatLib.de • Powered by 
              <svg className="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#gemini-embed-grad1)"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#gemini-embed-grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="gemini-embed-grad1" x1="2" y1="7" x2="22" y2="7">
                    <stop stopColor="#4285F4"/>
                    <stop offset="1" stopColor="#8E44AD"/>
                  </linearGradient>
                  <linearGradient id="gemini-embed-grad2" x1="2" y1="14.5" x2="22" y2="14.5">
                    <stop stopColor="#4285F4"/>
                    <stop offset="1" stopColor="#8E44AD"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-medium">Gemini</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
