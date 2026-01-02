import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { api } from "@shared/routes";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  // We will roll our own chat routes to support Assistants/RAG, 
  // but we can keep the blueprint ones if needed (mounted at /api/conversations)
  // registerChatRoutes(app); 
  registerImageRoutes(app);

  // === Assistants Routes ===
  app.get(api.assistants.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    // Ensure demo assistant exists
    await storage.ensureDemoAssistant(userId);
    const assistants = await storage.getAssistants(userId);
    // Sort: demo assistant first
    assistants.sort((a, b) => (b.isDemo ? 1 : 0) - (a.isDemo ? 1 : 0));
    res.json(assistants);
  });

  app.get(api.assistants.get.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const assistant = await storage.getAssistant(id);
    if (!assistant) return res.status(404).json({ message: "Assistant not found" });
    if (assistant.userId !== req.user.claims.sub) return res.status(401).json({ message: "Unauthorized" });
    res.json(assistant);
  });

  app.post(api.assistants.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.assistants.create.input.parse(req.body);
      const assistant = await storage.createAssistant({
        ...input,
        userId: req.user.claims.sub,
        deploymentConfig: input.deploymentConfig || {}
      });
      res.status(201).json(assistant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.assistants.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getAssistant(id);
      if (!existing) return res.status(404).json({ message: "Assistant not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(401).json({ message: "Unauthorized" });

      const input = api.assistants.update.input.parse(req.body);
      const updated = await storage.updateAssistant(id, input);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.assistants.delete.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const existing = await storage.getAssistant(id);
    if (!existing) return res.status(404).json({ message: "Assistant not found" });
    if (existing.userId !== req.user.claims.sub) return res.status(401).json({ message: "Unauthorized" });
    if (existing.isDemo) return res.status(403).json({ message: "Demo assistant cannot be deleted" });

    await storage.deleteAssistant(id);
    res.status(204).send();
  });

  // Retrain assistant - updates lastTrainedAt timestamp
  app.post("/api/assistants/:id/retrain", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getAssistant(id);
      if (!existing) return res.status(404).json({ message: "Assistant not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(401).json({ message: "Unauthorized" });

      const updated = await storage.updateAssistant(id, { lastTrainedAt: new Date() });
      res.json({ success: true, lastTrainedAt: updated?.lastTrainedAt });
    } catch (err) {
      res.status(500).json({ message: "Error retraining assistant" });
    }
  });

  // === Documents Routes ===
  app.get(api.documents.list.path, isAuthenticated, async (req: any, res) => {
    const assistantId = parseInt(req.params.assistantId);
    const assistant = await storage.getAssistant(assistantId);
    if (!assistant) return res.status(404).json({ message: "Assistant not found" });
    if (assistant.userId !== req.user.claims.sub) return res.status(401).json({ message: "Unauthorized" });

    const docs = await storage.getDocuments(assistantId);
    res.json(docs);
  });

  app.post(api.documents.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const assistantId = parseInt(req.params.assistantId);
      const assistant = await storage.getAssistant(assistantId);
      if (!assistant) return res.status(404).json({ message: "Assistant not found" });
      if (assistant.userId !== req.user.claims.sub) return res.status(401).json({ message: "Unauthorized" });

      const input = api.documents.create.input.parse(req.body);
      const doc = await storage.createDocument({
        ...input,
        assistantId
      });
      res.status(201).json(doc);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Error" });
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    // TODO: Verify ownership via assistant fetch or optimized query
    await storage.deleteDocument(id);
    res.status(204).send();
  });

  // === Chat Routes (Public/Embedded) ===
  app.post(api.chat.createSession.path, async (req, res) => {
    try {
      const { assistantId } = req.body;
      const conversation = await storage.createConversation({
        assistantId,
        title: "New Chat",
        // userId: req.user?.claims?.sub // Optional if logged in
      });
      res.status(201).json(conversation);
    } catch (err) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get(api.chat.history.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const messages = await storage.getMessages(id);
    res.json(messages);
  });

  // Helper: Normalize text for FAQ matching
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[?!.,;:'"«»]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Helper: Find matching FAQ entry - exact match only
  function findFaqMatch(userQuestion: string, docs: any[]): string | null {
    const normalizedQuery = normalizeText(userQuestion);
    
    for (const doc of docs) {
      if (doc.sourceType !== 'faq') continue;
      
      const meta = doc.metadata as { question?: string; response?: string } | null;
      if (!meta?.question || !meta?.response) continue;
      
      const normalizedFaq = normalizeText(meta.question);
      
      // Only exact match after normalization
      if (normalizedQuery === normalizedFaq) {
        return meta.response;
      }
    }
    
    return null;
  }

  // RAG Chat Endpoint
  app.post(api.chat.sendMessage.path, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // 1. Get Conversation & Assistant
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || !conversation.assistantId) return res.status(404).json({ message: "Session not found" });

      const assistant = await storage.getAssistant(conversation.assistantId);
      if (!assistant) return res.status(404).json({ message: "Assistant not found" });

      // 2. Save User Message
      await storage.createMessage({
        conversationId,
        role: "user",
        content
      });

      // 3. Fetch documents for RAG
      const docs = await storage.getDocuments(assistant.id);

      // 4. DETERMINISTIC FAQ MATCHING - Check BEFORE calling AI
      const faqAnswer = findFaqMatch(content, docs);
      
      if (faqAnswer) {
        // Found exact FAQ match - return answer directly without AI
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        
        res.write(`data: ${JSON.stringify({ content: faqAnswer })}\n\n`);
        
        await storage.createMessage({
          conversationId,
          role: "model",
          content: faqAnswer
        });
        
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // 5. No FAQ match - Use AI with knowledge base context
      const formattedContext = docs.map(d => {
        const meta = d.metadata as { question?: string; response?: string } | null;
        if (d.sourceType === 'faq' && meta?.question && meta?.response) {
          return `Q: ${meta.question}\nA: ${meta.response}`;
        }
        return `[${d.title}]\n${d.content}`;
      }).join("\n\n");

      const systemInstruction = `You are a library assistant. Answer questions using ONLY the knowledge base below.
If the answer is not in the knowledge base, say: "I don't have that information. Please contact library staff."

${assistant.systemPrompt}

KNOWLEDGE BASE:
${formattedContext || "No information available."}`;

      const history = await storage.getMessages(conversationId);
      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // 6. Stream AI Response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: contents,
        systemInstruction: systemInstruction,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const text = chunk.text || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      await storage.createMessage({
        conversationId,
        role: "model",
        content: fullResponse
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

    } catch (error) {
      console.error("Chat Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Chat failed" });
      }
    }
  });

  return httpServer;
}
