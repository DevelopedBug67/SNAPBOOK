import { 
  users, snaps, stories, chats, friendships, storyViews,
  type User, type InsertUser, type Snap, type Story, type Chat, type Friendship 
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  getFriends(userId: string): Promise<User[]>;
  addFriend(userId: string, friendId: string): Promise<Friendship>;
  
  getSnapsForUser(userId: string): Promise<Snap[]>;
  createSnap(snap: Omit<Snap, "id" | "createdAt" | "viewed" | "viewedAt" | "expiresAt">): Promise<Snap>;
  markSnapViewed(snapId: string): Promise<void>;
  
  getStoriesForUser(userId: string): Promise<Story[]>;
  getFriendsStories(userId: string): Promise<(Story & { user: User })[]>;
  createStory(story: Omit<Story, "id" | "createdAt" | "expiresAt">): Promise<Story>;
  markStoryViewed(storyId: string, viewerId: string): Promise<void>;
  
  getChats(userId: string, friendId: string): Promise<Chat[]>;
  getChatPreviews(userId: string): Promise<{ friend: User; lastMessage: Chat; unreadCount: number }[]>;
  createChat(chat: Omit<Chat, "id" | "createdAt" | "read">): Promise<Chat>;
  markChatsRead(userId: string, friendId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendRecords = await db.select()
      .from(friendships)
      .where(
        and(
          or(
            eq(friendships.userId, userId),
            eq(friendships.friendId, userId)
          ),
          eq(friendships.status, "accepted")
        )
      );
    
    const friendIds = friendRecords.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );
    
    if (friendIds.length === 0) return [];
    
    const friends = await db.select().from(users);
    return friends.filter(u => friendIds.includes(u.id));
  }

  async addFriend(userId: string, friendId: string): Promise<Friendship> {
    const [friendship] = await db.insert(friendships)
      .values({ userId, friendId, status: "accepted" })
      .returning();
    return friendship;
  }

  async getSnapsForUser(userId: string): Promise<Snap[]> {
    return db.select()
      .from(snaps)
      .where(
        and(
          eq(snaps.receiverId, userId),
          eq(snaps.viewed, false)
        )
      )
      .orderBy(desc(snaps.createdAt));
  }

  async createSnap(snap: Omit<Snap, "id" | "createdAt" | "viewed" | "viewedAt" | "expiresAt">): Promise<Snap> {
    const [newSnap] = await db.insert(snaps).values(snap).returning();
    return newSnap;
  }

  async markSnapViewed(snapId: string): Promise<void> {
    await db.update(snaps)
      .set({ viewed: true, viewedAt: new Date() })
      .where(eq(snaps.id, snapId));
  }

  async getStoriesForUser(userId: string): Promise<Story[]> {
    const now = new Date();
    return db.select()
      .from(stories)
      .where(
        and(
          eq(stories.userId, userId),
          gt(stories.expiresAt, now)
        )
      )
      .orderBy(desc(stories.createdAt));
  }

  async getFriendsStories(userId: string): Promise<(Story & { user: User })[]> {
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(f => f.id);
    
    if (friendIds.length === 0) return [];
    
    const now = new Date();
    const allStories = await db.select()
      .from(stories)
      .where(gt(stories.expiresAt, now))
      .orderBy(desc(stories.createdAt));
    
    const friendStories = allStories.filter(s => friendIds.includes(s.userId));
    
    return friendStories.map(story => ({
      ...story,
      user: friends.find(f => f.id === story.userId)!
    }));
  }

  async createStory(story: Omit<Story, "id" | "createdAt" | "expiresAt">): Promise<Story> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [newStory] = await db.insert(stories)
      .values({ ...story, expiresAt })
      .returning();
    return newStory;
  }

  async markStoryViewed(storyId: string, viewerId: string): Promise<void> {
    await db.insert(storyViews)
      .values({ storyId, viewerId })
      .onConflictDoNothing();
  }

  async getChats(userId: string, friendId: string): Promise<Chat[]> {
    return db.select()
      .from(chats)
      .where(
        or(
          and(eq(chats.senderId, userId), eq(chats.receiverId, friendId)),
          and(eq(chats.senderId, friendId), eq(chats.receiverId, userId))
        )
      )
      .orderBy(chats.createdAt);
  }

  async getChatPreviews(userId: string): Promise<{ friend: User; lastMessage: Chat; unreadCount: number }[]> {
    const allChats = await db.select()
      .from(chats)
      .where(
        or(
          eq(chats.senderId, userId),
          eq(chats.receiverId, userId)
        )
      )
      .orderBy(desc(chats.createdAt));
    
    const chatsByFriend = new Map<string, { lastMessage: Chat; unreadCount: number }>();
    
    for (const chat of allChats) {
      const friendId = chat.senderId === userId ? chat.receiverId : chat.senderId;
      
      if (!chatsByFriend.has(friendId)) {
        chatsByFriend.set(friendId, { lastMessage: chat, unreadCount: 0 });
      }
      
      if (chat.receiverId === userId && !chat.read) {
        const existing = chatsByFriend.get(friendId)!;
        existing.unreadCount++;
      }
    }
    
    const friendIds = Array.from(chatsByFriend.keys());
    if (friendIds.length === 0) return [];
    
    const allUsers = await db.select().from(users);
    const friendsMap = new Map(allUsers.map(u => [u.id, u]));
    
    return Array.from(chatsByFriend.entries())
      .map(([friendId, data]) => ({
        friend: friendsMap.get(friendId)!,
        lastMessage: data.lastMessage,
        unreadCount: data.unreadCount
      }))
      .filter(p => p.friend);
  }

  async createChat(chat: Omit<Chat, "id" | "createdAt" | "read">): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async markChatsRead(userId: string, friendId: string): Promise<void> {
    await db.update(chats)
      .set({ read: true })
      .where(
        and(
          eq(chats.senderId, friendId),
          eq(chats.receiverId, userId),
          eq(chats.read, false)
        )
      );
  }
}

export const storage = new DatabaseStorage();
