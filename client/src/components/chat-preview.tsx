import { useEffect, useRef } from "react";
import { useCreateSession, useChatHistory, useChatStream } from "@/hooks/use-chat-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Assistant } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export function ChatPreview({ assistant }: { assistant: Assistant }) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  
  const { mutateAsync: createSession } = useCreateSession();
  const { data: history = [] } = useChatHistory(sessionId!);
  const { sendMessage, isPending, streamingContent } = useChatStream(sessionId!);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    if (assistant.id && !sessionId) {
      createSession(assistant.id).then(session => setSessionId(session.id));
    }
  }, [assistant.id, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId || isPending) return;
    
    const content = inputValue;
    setInputValue("");
    await sendMessage(content);
  };

  if (!sessionId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Initializing preview...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border border-border rounded-2xl bg-background shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">{assistant.name}</h3>
          <p className="text-xs text-muted-foreground">Preview Mode</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        <div className="space-y-4">
          {assistant.welcomeMessage && history.length === 0 && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex gap-3 justify-start"
             >
               <Avatar className="w-8 h-8 border border-border">
                 <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
               </Avatar>
               <div className="bg-white border border-border/50 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm">
                 {assistant.welcomeMessage}
               </div>
             </motion.div>
          )}

          {history.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role !== "user" && (
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl shadow-sm text-sm max-w-[80%]",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-white border border-border/50 text-foreground rounded-tl-none"
                )}
              >
                {msg.content}
              </div>

              {msg.role === "user" && (
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarFallback className="bg-slate-200 text-slate-600">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}

          {/* Streaming Message Bubble */}
          {streamingContent && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
              </Avatar>
              <div className="bg-white border border-border/50 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm">
                {streamingContent}
                <span className="inline-block w-1.5 h-3 ml-1 bg-primary/50 animate-pulse" />
              </div>
            </div>
          )}

          {isPending && !streamingContent && (
            <div className="flex gap-3 justify-start">
               <Avatar className="w-8 h-8 border border-border">
                 <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
               </Avatar>
               <div className="bg-white border border-border/50 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-xl border-border/80 focus-visible:ring-primary/20"
            disabled={isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isPending || !inputValue.trim()}
            className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
