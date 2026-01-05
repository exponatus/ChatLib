import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Login with username/password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await authStorage.verifyPassword(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Set up session with local auth format
      (req as any).session.userId = user.id;
      (req as any).session.authType = "local";
      
      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, firstName } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check if username exists
      const existing = await authStorage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const user = await authStorage.createUserWithPassword(username, password, email, firstName);
      
      // Set up session
      (req as any).session.userId = user.id;
      (req as any).session.authType = "local";
      
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Logout for local auth
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // Support both local auth and Replit auth
      const userId = req.session?.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { firstName, email, profileImageUrl } = req.body;
      const user = await authStorage.updateUserProfile(userId, { firstName, email, profileImageUrl });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Upload avatar (base64 image)
  app.post("/api/auth/avatar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { image } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ message: "Image data required" });
      }

      // Validate base64 image format
      if (!image.startsWith("data:image/")) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      // Limit size to ~2MB (base64 is ~33% larger than binary)
      if (image.length > 2800000) {
        return res.status(400).json({ message: "Image too large (max 2MB)" });
      }

      const user = await authStorage.updateUserProfile(userId, { profileImageUrl: image });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Delete avatar
  app.delete("/api/auth/avatar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await authStorage.updateUserProfile(userId, { profileImageUrl: null });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete avatar" });
    }
  });
}
