import { 
  users, type User, type InsertUser,
  assistants, type Assistant, type InsertAssistant,
  documents, type Document, type InsertDocument,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;

  // Assistants
  getAssistants(userId: string): Promise<Assistant[]>;
  getAssistant(id: number): Promise<Assistant | undefined>;
  createAssistant(assistant: InsertAssistant): Promise<Assistant>;
  updateAssistant(id: number, assistant: Partial<InsertAssistant>): Promise<Assistant>;
  deleteAssistant(id: number): Promise<void>;
  ensureDemoAssistant(userId: string): Promise<Assistant>;

  // Documents
  getDocuments(assistantId: number): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Chat
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(user: InsertUser): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.email, user.email!));
    if (existing) {
        // Update existing user logic if needed, or just return
        return existing;
    }
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Assistants
  async getAssistants(userId: string): Promise<Assistant[]> {
    return db.select().from(assistants).where(eq(assistants.userId, userId)).orderBy(desc(assistants.createdAt));
  }

  async getAssistant(id: number): Promise<Assistant | undefined> {
    const [assistant] = await db.select().from(assistants).where(eq(assistants.id, id));
    return assistant;
  }

  async createAssistant(assistant: InsertAssistant): Promise<Assistant> {
    const [newAssistant] = await db.insert(assistants).values(assistant).returning();
    return newAssistant;
  }

  async updateAssistant(id: number, updates: Partial<InsertAssistant>): Promise<Assistant> {
    const [updated] = await db.update(assistants).set(updates).where(eq(assistants.id, id)).returning();
    return updated;
  }

  async deleteAssistant(id: number): Promise<void> {
    await db.delete(assistants).where(eq(assistants.id, id));
  }

  async ensureDemoAssistant(userId: string): Promise<Assistant> {
    // Check if demo already exists
    const existingAssistants = await this.getAssistants(userId);
    const demoAssistant = existingAssistants.find(a => a.isDemo);

    if (demoAssistant) {
      // Demo already exists, return as-is (don't reset)
      return demoAssistant;
    }

    // Create new demo assistant with all required fields
    const defaultDemo = {
      name: "Library Assistant",
      description: "Demo assistant for testing library services",
      systemPrompt: `You are a virtual library assistant.
Your role is to help library patrons by answering questions using only the provided library data.
Be clear, polite, and accurate.
If the information is not available in the sources, say so and suggest contacting the library staff.`,
      welcomeMessage: "Hello! I'm here to help you with library services, borrowing rules, events, and digital resources. How can I assist you today?",
      isDemo: true,
      userId,
      deploymentConfig: {},
    };

    return await this.createAssistant(defaultDemo);
  }

  // Documents
  async getDocuments(assistantId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.assistantId, assistantId)).orderBy(desc(documents.createdAt));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Chat
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConv] = await db.insert(conversations).values(conversation).returning();
    return newConv;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();
    return msg;
  }
}

export const storage = new DatabaseStorage();

// Re-export auth storage for the integration to work
export const authStorage = {
  getUser: storage.getUser.bind(storage),
  upsertUser: storage.upsertUser.bind(storage),
};
