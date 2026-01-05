import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(username: string, password: string, email?: string, firstName?: string): Promise<User>;
  verifyPassword(username: string, password: string): Promise<User | null>;
  updateUserProfile(id: string, data: { firstName?: string; email?: string; profileImageUrl?: string | null }): Promise<User | undefined>;
  ensureDefaultUser(): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUserWithPassword(username: string, password: string, email?: string, firstName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        email,
        firstName,
      })
      .returning();
    return user;
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || !user.password) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async updateUserProfile(id: string, data: { firstName?: string; email?: string; profileImageUrl?: string | null }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async ensureDefaultUser(): Promise<void> {
    const existing = await this.getUserByUsername("chatlib");
    if (!existing) {
      await this.createUserWithPassword(
        "chatlib",
        "demo",
        "admin@chatlib.de",
        "Admin"
      );
      console.log("Default user created: chatlib/demo");
    } else if (!existing.firstName || !existing.email) {
      await this.updateUserProfile(existing.id, {
        firstName: existing.firstName || "Admin",
        email: existing.email || "admin@chatlib.de"
      });
      console.log("Default user updated with missing data");
    }
  }
}

export const authStorage = new AuthStorage();
