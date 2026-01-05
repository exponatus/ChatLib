import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
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

// Helper to get userId from both local and OIDC auth
function getUserId(req: any): string | null {
  // Local auth
  if (req.session?.userId && req.session?.authType === "local") {
    return req.session.userId;
  }
  // OIDC auth
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  return null;
}

// In-memory rate limit store (in production, use Redis)
const rateLimitStore: Record<string, number[]> = {};

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
  
  // Ensure default user exists
  await authStorage.ensureDefaultUser();

  // === Assistants Routes ===
  app.get(api.assistants.list.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req)!;
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
    if (assistant.userId !== getUserId(req)) return res.status(401).json({ message: "Unauthorized" });
    res.json(assistant);
  });

  app.post(api.assistants.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.assistants.create.input.parse(req.body);
      const assistant = await storage.createAssistant({
        ...input,
        userId: getUserId(req)!,
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
      if (existing.userId !== getUserId(req)) return res.status(401).json({ message: "Unauthorized" });

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
    if (existing.userId !== getUserId(req)) return res.status(401).json({ message: "Unauthorized" });
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
      if (existing.userId !== getUserId(req)) return res.status(401).json({ message: "Unauthorized" });

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
    if (assistant.userId !== getUserId(req)) return res.status(401).json({ message: "Unauthorized" });

    const docs = await storage.getDocuments(assistantId);
    res.json(docs);
  });

  app.post(api.documents.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const assistantId = parseInt(req.params.assistantId);
      const assistant = await storage.getAssistant(assistantId);
      if (!assistant) return res.status(404).json({ message: "Assistant not found" });
      if (assistant.userId !== getUserId(req)) return res.status(401).json({ message: "Unauthorized" });

      const input = api.documents.create.input.parse(req.body);
      const doc = await storage.createDocument({
        ...input,
        assistantId
      });
      // Invalidate response cache when knowledge base changes
      await storage.clearCache(assistantId);
      res.status(201).json(doc);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Error" });
    }
  });

  app.put(api.documents.update.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const validResult = api.documents.update.input.safeParse(req.body);
    if (!validResult.success) {
      return res.status(400).json({ message: validResult.error.message });
    }
    const updated = await storage.updateDocument(id, validResult.data);
    if (!updated) {
      return res.status(404).json({ message: "Document not found" });
    }
    // Invalidate response cache when knowledge base changes
    await storage.clearCache(updated.assistantId);
    res.json(updated);
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    // Get document first to find assistantId for cache invalidation
    const doc = await storage.getDocument(id);
    if (doc) {
      await storage.clearCache(doc.assistantId);
    }
    await storage.deleteDocument(id);
    res.status(204).send();
  });

  // === Public API Routes (No authentication) ===
  app.get('/api/public/assistant/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assistant = await storage.getAssistant(id);
      if (!assistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }
      // Return limited info for public access
      res.json({
        id: assistant.id,
        name: assistant.name,
        welcomeMessage: assistant.welcomeMessage,
        isPublished: assistant.isPublished,
        coverImage: assistant.coverImage,
        deploymentConfig: assistant.deploymentConfig,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch assistant" });
    }
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

  // Helper: Normalize text for matching
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[?!.,;:'"«»\-\(\)\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Helper: Extract keywords (remove common stop words)
  function extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
      'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
      'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'it',
      // Russian stop words
      'и', 'в', 'на', 'с', 'по', 'для', 'как', 'что', 'это', 'он', 'она', 'они',
      'мы', 'вы', 'я', 'ты', 'его', 'её', 'их', 'мой', 'твой', 'наш', 'ваш',
      'из', 'за', 'от', 'до', 'при', 'над', 'под', 'про', 'без', 'через',
      'не', 'да', 'нет', 'или', 'но', 'а', 'же', 'ли', 'бы', 'ещё', 'уже',
      'где', 'когда', 'кто', 'чем', 'там', 'тут', 'здесь', 'так', 'очень'
    ]);
    
    const normalized = normalizeText(text);
    return normalized.split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  // Helper: Detect language based on character and word analysis
  function detectLanguage(text: string): 'ru' | 'de' | 'en' {
    const textLower = text.toLowerCase();
    
    // Check for Cyrillic (Russian)
    const cyrillicCount = (text.match(/[\u0400-\u04FF]/g) || []).length;
    const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (cyrillicCount > latinCount) return 'ru';
    
    // Check for German-specific patterns
    const germanWords = [
      'der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einer', 'einem',
      'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'haben', 'sein', 'werden',
      'kann', 'muss', 'will', 'soll', 'möchte', 'darf', 'nicht', 'auch', 'noch',
      'wie', 'was', 'wer', 'wo', 'wann', 'warum', 'welche', 'welcher', 'welches',
      'bitte', 'danke', 'hallo', 'guten', 'morgen', 'tag', 'abend', 'nacht',
      'bibliothek', 'buch', 'bücher', 'ausleihen', 'zurückgeben', 'verlängern',
      'öffnungszeiten', 'mitglied', 'karte', 'gebühr', 'frist', 'suche', 'finden',
      'gibt', 'gibt\'s', 'gehts', 'geht\'s', 'alles', 'gut', 'ja', 'nein'
    ];
    
    // German umlauts and ß
    const hasGermanChars = /[äöüßÄÖÜ]/.test(text);
    
    // Count German word matches
    const words = textLower.split(/\s+/);
    const germanMatches = words.filter(w => germanWords.includes(w.replace(/[?!.,;:'"]/g, ''))).length;
    
    // If has German chars or significant German word matches, it's German
    if (hasGermanChars || germanMatches >= 1) return 'de';
    
    return 'en';
  }

  // Localized strings
  const i18n = {
    greeting: {
      ru: "Здравствуйте! Я библиотечный ассистент. Чем могу помочь вам сегодня?",
      de: "Hallo! Ich bin der Bibliotheksassistent. Wie kann ich Ihnen heute helfen?",
      en: "Hello! I'm the library assistant. How can I help you today?"
    },
    offTopic: {
      ru: "Извините, я могу помочь только с вопросами о нашей библиотеке и её услугах. Если у вас есть вопросы о книгах, абонементах, мероприятиях или услугах библиотеки - я с радостью помогу!",
      de: "Entschuldigung, ich kann nur bei Fragen zu unserer Bibliothek und deren Dienstleistungen helfen. Wenn Sie Fragen zu Büchern, Mitgliedschaften, Veranstaltungen oder Bibliotheksdiensten haben - ich helfe Ihnen gerne!",
      en: "Sorry, I can only help with questions about our library and its services. If you have questions about books, memberships, events, or library services - I'll be happy to help!"
    },
    noInfo: {
      ru: "К сожалению, у меня нет этой информации. Пожалуйста, обратитесь к сотрудникам библиотеки.",
      de: "Leider habe ich diese Information nicht. Bitte wenden Sie sich an das Bibliothekspersonal.",
      en: "Unfortunately, I don't have this information. Please contact the library staff."
    },
    emptyKB: {
      ru: "База знаний пуста.",
      de: "Die Wissensdatenbank ist leer.",
      en: "Knowledge base is empty."
    }
  };

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

  // Helper: Score and rank documents by keyword relevance
  interface ScoredDoc {
    doc: any;
    score: number;
    matchedKeywords: string[];
  }

  function scoreDocuments(query: string, docs: any[]): ScoredDoc[] {
    const queryKeywords = extractKeywords(query);
    if (queryKeywords.length === 0) return [];

    const scored: ScoredDoc[] = [];

    for (const doc of docs) {
      // Skip FAQ entries - handled separately
      if (doc.sourceType === 'faq') continue;

      // Extract document words as a Set for word-boundary matching
      const docWords = new Set(extractKeywords(doc.content || ''));
      const matchedKeywords: string[] = [];

      for (const keyword of queryKeywords) {
        // Only match if keyword is a complete word in the document
        if (docWords.has(keyword)) {
          matchedKeywords.push(keyword);
        }
      }

      // Require at least 2 matched keywords for scoring
      if (matchedKeywords.length >= 2) {
        // Score = percentage of query keywords found in document
        const score = matchedKeywords.length / queryKeywords.length;
        scored.push({ doc, score, matchedKeywords });
      }
    }

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  // Helper: Extract relevant snippet from document
  function extractSnippet(content: string, keywords: string[], maxLength: number = 500): string {
    const normalized = content.toLowerCase();
    
    // Find first keyword occurrence
    let bestPos = -1;
    for (const keyword of keywords) {
      const pos = normalized.indexOf(keyword.toLowerCase());
      if (pos !== -1 && (bestPos === -1 || pos < bestPos)) {
        bestPos = pos;
      }
    }

    if (bestPos === -1) return content.slice(0, maxLength);

    // Extract snippet around the keyword
    const start = Math.max(0, bestPos - 100);
    const end = Math.min(content.length, bestPos + maxLength - 100);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
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

      // Get deployment config for rate limiting and caching
      const deployConfig = assistant.deploymentConfig as {
        rateLimitEnabled?: boolean;
        rateLimitCount?: number;
        rateLimitPeriod?: number;
        responseCacheEnabled?: boolean;
        aiModel?: string;
      } | null;

      // Rate Limiting Check (using IP-based tracking)
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const rateLimitKey = `ratelimit:${assistant.id}:${clientIp}`;
      
      if (deployConfig?.rateLimitEnabled !== false) {
        const maxQuestions = deployConfig?.rateLimitCount || 50;
        const periodMinutes = deployConfig?.rateLimitPeriod || 60;
        
        // Simple in-memory rate limiting (would use Redis in production)
        const now = Date.now();
        const windowStart = now - (periodMinutes * 60 * 1000);
        
        if (!rateLimitStore[rateLimitKey]) {
          rateLimitStore[rateLimitKey] = [];
        }
        
        // Clean old entries
        rateLimitStore[rateLimitKey] = rateLimitStore[rateLimitKey].filter(t => t > windowStart);
        
        if (rateLimitStore[rateLimitKey].length >= maxQuestions) {
          return res.status(429).json({ 
            message: `Rate limit exceeded. Maximum ${maxQuestions} questions per ${periodMinutes} minutes.`
          });
        }
        
        rateLimitStore[rateLimitKey].push(now);
      }

      // 2. Check if this is the first message BEFORE saving
      // This determines if caching is applicable (only for standalone questions)
      const priorMessages = await storage.getMessages(conversationId);
      const isFirstMessage = priorMessages.length === 0;

      // 3. Save User Message
      await storage.createMessage({
        conversationId,
        role: "user",
        content
      });

      // 4. Fetch documents for RAG
      const docs = await storage.getDocuments(assistant.id);

      // 3a. Handle simple greetings without AI
      const greetings = [
        // Russian
        'привет', 'здравствуй', 'здравствуйте', 'добрый день', 'доброе утро', 'добрый вечер',
        // English
        'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
        // German
        'hallo', 'guten tag', 'guten morgen', 'guten abend', 'grüß gott', 'servus', 'moin'
      ];
      const contentLower = content.toLowerCase().trim();
      const isGreeting = greetings.some(g => contentLower === g || contentLower.startsWith(g + ' ') || contentLower.startsWith(g + ',') || contentLower.startsWith(g + '!'));
      
      // Detect language of user message
      const userLang = detectLanguage(content);
      
      if (isGreeting && contentLower.length < 50) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        
        const greetingResponse = assistant.welcomeMessage || i18n.greeting[userLang];
        res.write(`data: ${JSON.stringify({ content: greetingResponse })}\n\n`);
        
        await storage.createMessage({
          conversationId,
          role: "model",
          content: greetingResponse
        });
        
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

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

      // 5. KEYWORD-BASED DOCUMENT SCORING - Find most relevant documents
      const scoredDocs = scoreDocuments(content, docs);
      
      // 5a. OFF-TOPIC CHECK - If NO documents match, don't call AI at all
      // This prevents the AI from using general knowledge
      if (docs.length > 0 && scoredDocs.length === 0) {
        // Has knowledge base but question doesn't match anything
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        
        const offTopicResponse = i18n.offTopic[userLang];
        res.write(`data: ${JSON.stringify({ content: offTopicResponse })}\n\n`);
        
        await storage.createMessage({
          conversationId,
          role: "model",
          content: offTopicResponse
        });
        
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
      
      // If we have a high-confidence match (score >= 0.8), return snippet directly
      if (scoredDocs.length > 0 && scoredDocs[0].score >= 0.8) {
        const topDoc = scoredDocs[0];
        const snippet = extractSnippet(topDoc.doc.content, topDoc.matchedKeywords, 800);
        
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        
        const directAnswer = `Based on "${topDoc.doc.title}":\n\n${snippet}`;
        res.write(`data: ${JSON.stringify({ content: directAnswer })}\n\n`);
        
        await storage.createMessage({
          conversationId,
          role: "model",
          content: directAnswer
        });
        
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // 6. Build context - prioritize relevant docs, include all FAQ entries
      const contextParts: string[] = [];
      
      // Add top 3 relevant documents first
      const topDocs = scoredDocs.slice(0, 3);
      for (const { doc, matchedKeywords } of topDocs) {
        const snippet = extractSnippet(doc.content, matchedKeywords, 600);
        contextParts.push(`[${doc.title}]\n${snippet}`);
      }
      
      // Add FAQ entries
      for (const doc of docs) {
        if (doc.sourceType === 'faq') {
          const meta = doc.metadata as { question?: string; response?: string } | null;
          if (meta?.question && meta?.response) {
            contextParts.push(`Q: ${meta.question}\nA: ${meta.response}`);
          }
        }
      }
      
      // Add remaining docs if space allows (up to 5 total)
      const remainingDocs = docs.filter(d => 
        d.sourceType !== 'faq' && 
        !topDocs.some(td => td.doc.id === d.id)
      ).slice(0, 2);
      
      for (const doc of remainingDocs) {
        contextParts.push(`[${doc.title}]\n${doc.content?.slice(0, 400) || ''}`);
      }

      const formattedContext = contextParts.join("\n\n---\n\n");

      // Build localized system instruction
      const noInfoMsg = i18n.noInfo[userLang];
      const offTopicMsg = i18n.offTopic[userLang];
      const emptyKBMsg = i18n.emptyKB[userLang];
      const langInstructions = {
        ru: 'ВАЖНО: Отвечай на русском языке, так как пользователь пишет по-русски.',
        de: 'WICHTIG: Antworte auf Deutsch, da der Benutzer auf Deutsch schreibt.',
        en: 'IMPORTANT: Respond in English, as the user is writing in English.'
      };
      const langInstruction = langInstructions[userLang];

      const systemInstruction = `=== YOUR IDENTITY AND INSTRUCTIONS ===
${assistant.systemPrompt || 'You are a helpful library assistant.'}

=== LANGUAGE RULE ===
${langInstruction}
Always respond in the same language as the user's message.

=== CRITICAL OPERATING RULES ===

You exist ONLY within this context. You have NO knowledge of the outside world.
Your ENTIRE knowledge consists ONLY of what is in the KNOWLEDGE BASE section below.

RULE 1: You can ONLY answer questions using information from the KNOWLEDGE BASE.
RULE 2: You have NO other knowledge. Pretend the KNOWLEDGE BASE is everything you know.
RULE 3: If the question cannot be answered from the KNOWLEDGE BASE, say: "${noInfoMsg}"
RULE 4: If asked about topics not in the KNOWLEDGE BASE (weather, news, general facts, etc.), say: "${offTopicMsg}"
RULE 5: NEVER use your general training data. You only know what's in the KNOWLEDGE BASE.
RULE 6: Be polite, clear, and helpful within these constraints.

=== KNOWLEDGE BASE (THIS IS ALL YOU KNOW) ===
${formattedContext || emptyKBMsg}`;

      const history = await storage.getMessages(conversationId);
      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // 7. Check Response Cache (before calling AI)
      // Only use cache for standalone questions (first message in conversation)
      // Follow-up questions depend on context and should not be cached
      const cacheEnabled = deployConfig?.responseCacheEnabled !== false;
      
      if (cacheEnabled && isFirstMessage) {
        const cachedResponse = await storage.getCachedResponse(assistant.id, content);
        if (cachedResponse) {
          // Found cached response - return without calling AI
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          
          res.write(`data: ${JSON.stringify({ content: cachedResponse.response })}\n\n`);
          
          await storage.createMessage({
            conversationId,
            role: "model",
            content: cachedResponse.response
          });
          
          res.write(`data: ${JSON.stringify({ done: true, cached: true })}\n\n`);
          res.end();
          return;
        }
      }

      // 7. Stream AI Response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Use AI model from deploymentConfig (default to flash)
      const modelName = deployConfig?.aiModel === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      
      const stream = await ai.models.generateContentStream({
        model: modelName,
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

      // Cache the response for future identical questions (only first messages)
      if (cacheEnabled && isFirstMessage && fullResponse.length > 0 && fullResponse.length < 5000) {
        try {
          await storage.cacheResponse(assistant.id, content, fullResponse);
        } catch {
          // Ignore cache errors (duplicate question hash)
        }
      }

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
