import { pgTable, text, serial, timestamp, boolean, integer, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar").default("default"),
  status: text("status").default("offline"), // online, offline, away, busy
  theme: text("theme").default("matrix"),
  role: text("role").default("user"), // user, admin
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chats table
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // private, group, favorites
  description: text("description"),
  avatar: text("avatar"),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat participants
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // member, admin, owner
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, file, voice
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  replyTo: integer("reply_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorites table
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice rooms table
export const voiceRooms = pgTable("voice_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  chatId: integer("chat_id").references(() => chats.id),
  maxParticipants: integer("max_participants").default(10),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice room participants
export const voiceRoomParticipants = pgTable("voice_room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => voiceRooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isMuted: boolean("is_muted").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  chatParticipants: many(chatParticipants),
  createdChats: many(chats),
  favorites: many(favorites),
  voiceRoomParticipants: many(voiceRoomParticipants),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  createdBy: one(users, { fields: [chats.createdBy], references: [users.id] }),
  participants: many(chatParticipants),
  messages: many(messages),
  voiceRoom: one(voiceRooms),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  replyToMessage: one(messages, { fields: [messages.replyTo], references: [messages.id] }),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  user: one(users, { fields: [chatParticipants.userId], references: [users.id] }),
  chat: one(chats, { fields: [chatParticipants.chatId], references: [chats.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  message: one(messages, { fields: [favorites.messageId], references: [messages.id] }),
}));

export const voiceRoomsRelations = relations(voiceRooms, ({ one, many }) => ({
  chat: one(chats, { fields: [voiceRooms.chatId], references: [chats.id] }),
  createdBy: one(users, { fields: [voiceRooms.createdBy], references: [users.id] }),
  participants: many(voiceRoomParticipants),
}));

export const voiceRoomParticipantsRelations = relations(voiceRoomParticipants, ({ one }) => ({
  room: one(voiceRooms, { fields: [voiceRoomParticipants.roomId], references: [voiceRooms.id] }),
  user: one(users, { fields: [voiceRoomParticipants.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceRoomSchema = createInsertSchema(voiceRooms).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type VoiceRoom = typeof voiceRooms.$inferSelect;
export type InsertVoiceRoom = z.infer<typeof insertVoiceRoomSchema>;
export type VoiceRoomParticipant = typeof voiceRoomParticipants.$inferSelect;
