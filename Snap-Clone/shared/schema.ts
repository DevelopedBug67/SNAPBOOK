import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  friendId: varchar("friend_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const snaps = pgTable("snaps", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull().default("image"),
  duration: integer("duration").notNull().default(5),
  viewed: boolean("viewed").notNull().default(false),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const stories = pgTable("stories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull().default("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const storyViews = pgTable("story_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  viewerId: varchar("viewer_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sentSnaps: many(snaps, { relationName: "sentSnaps" }),
  receivedSnaps: many(snaps, { relationName: "receivedSnaps" }),
  stories: many(stories),
  friendships: many(friendships),
}));

export const snapsRelations = relations(snaps, ({ one }) => ({
  sender: one(users, {
    fields: [snaps.senderId],
    references: [users.id],
    relationName: "sentSnaps",
  }),
  receiver: one(users, {
    fields: [snaps.receiverId],
    references: [users.id],
    relationName: "receivedSnaps",
  }),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
  views: many(storyViews),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  displayName: true,
  avatarUrl: true,
});

export const insertSnapSchema = createInsertSchema(snaps).pick({
  senderId: true,
  receiverId: true,
  mediaUrl: true,
  mediaType: true,
  duration: true,
});

export const insertStorySchema = createInsertSchema(stories).pick({
  userId: true,
  mediaUrl: true,
  mediaType: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  senderId: true,
  receiverId: true,
  message: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Snap = typeof snaps.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
