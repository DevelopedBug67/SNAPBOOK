import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  let currentUser: { id: string; username: string; displayName: string; avatarUrl: string | null } | null = null;

  app.post("/api/auth/login", async (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    let user = await storage.getUserByUsername(username);
    if (!user) {
      user = await storage.createUser({
        username,
        displayName: username,
        avatarUrl: null,
      });
    }

    currentUser = user;
    res.json({ user });
  });

  app.post("/api/auth/logout", (_req, res) => {
    currentUser = null;
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (_req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(currentUser.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ user });
  });

  app.get("/api/users", async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/friends", async (_req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const friends = await storage.getFriends(currentUser.id);
    res.json(friends);
  });

  app.post("/api/friends", async (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { friendId } = req.body;
    const friendship = await storage.addFriend(currentUser.id, friendId);
    res.json(friendship);
  });

  app.get("/api/snaps", async (_req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const snaps = await storage.getSnapsForUser(currentUser.id);
    res.json(snaps);
  });

  app.post("/api/snaps", async (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { receiverId, mediaUrl, mediaType, duration } = req.body;
    const snap = await storage.createSnap({
      senderId: currentUser.id,
      receiverId,
      mediaUrl,
      mediaType: mediaType || "image",
      duration: duration || 5,
    });
    res.json(snap);
  });

  app.post("/api/snaps/:id/view", async (req, res) => {
    await storage.markSnapViewed(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/stories", async (_req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const stories = await storage.getFriendsStories(currentUser.id);
    res.json(stories);
  });

  app.get("/api/stories/me", async (_req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const stories = await storage.getStoriesForUser(currentUser.id);
    res.json(stories);
  });

  app.post("/api/stories", async (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { mediaUrl, mediaType } = req.body;
    const story = await storage.createStory({
      userId: currentUser.id,
      mediaUrl,
      mediaType: mediaType || "image",
    });
    res.json(story);
  });

  app.post("/api/stories/:id/view", async (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    await storage.markStoryViewed(req.params.id, currentUser.id);
    res.json({ success: true });
  });

  app.get("/api/chats", async (_req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const previews = await storage.getChatPreviews(currentUser.id);
    res.json(previews);
  });

  app.get("/api/chats/:friendId", async (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const chats = await storage.getChats(currentUser.id, req.params.friendId);
    await storage.markChatsRead(currentUser.id, req.params.friendId);
    res.json(chats);
  });

  app.post("/api/chats", async (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { receiverId, message } = req.body;
    const chat = await storage.createChat({
      senderId: currentUser.id,
      receiverId,
      message,
    });
    res.json(chat);
  });

  const httpServer = createServer(app);
  return httpServer;
}
