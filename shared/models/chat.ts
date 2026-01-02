import { pgTable, serial, integer, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, relations } from "drizzle-orm";
import { users } from "./auth";

// Re-export auth models
export * from "./auth";

// === ASSISTANTS ===
export const assistants = pgTable("assistants", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // Using text because Auth uses string IDs
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  welcomeMessage: text("welcome_message"),
  coverImage: text("cover_image"), // URL or base64 of cover image
  isDemo: boolean("is_demo").default(false), // Demo assistants cannot be deleted
  isPublished: boolean("is_published").default(false), // Whether assistant is live
  deploymentConfig: jsonb("deployment_config").$type<{
    primaryColor?: string;
    allowedDomains?: string[];
  }>(),
  lastTrainedAt: timestamp("last_trained_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === DOCUMENTS (Knowledge Base) ===
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").notNull().references(() => assistants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(), // 'upload' | 'drive'
  sourceId: text("source_id").notNull(), // File path or Drive ID
  content: text("content"), // Extracted text for RAG
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === CHAT (Overriding/Extending basic chat model) ===
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").references(() => assistants.id, { onDelete: "cascade" }), // Link to specific assistant
  userId: text("user_id").references(() => users.id), // Optional: logged in user
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === RELATIONS ===
export const assistantsRelations = relations(assistants, ({ one, many }) => ({
  user: one(users, {
    fields: [assistants.userId],
    references: [users.id],
  }),
  documents: many(documents),
  conversations: many(conversations),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  assistant: one(assistants, {
    fields: [documents.assistantId],
    references: [assistants.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  assistant: one(assistants, {
    fields: [conversations.assistantId],
    references: [assistants.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertAssistantSchema = createInsertSchema(assistants).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true 
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// === TYPES ===
export type Assistant = typeof assistants.$inferSelect;
export type InsertAssistant = z.infer<typeof insertAssistantSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
