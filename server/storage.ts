import {
  users,
  chats,
  messages,
  chatParticipants,
  favorites,
  voiceRooms,
  voiceRoomParticipants,
  sessions,
  messageReactions,
  type User,
  type InsertUser,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type ChatParticipant,
  type InsertChatParticipant,
  type Favorite,
  type InsertFavorite,
  type VoiceRoom,
  type InsertVoiceRoom,
  type VoiceRoomParticipant,
  type MessageReaction,
  type InsertMessageReaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, like, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  searchUsers(query: string, excludeId?: number): Promise<User[]>;
  updateUserStatus(id: number, status: string, isOnline: boolean): Promise<void>;

  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getUserChats(userId: number): Promise<(Chat & { lastMessage?: Message; unreadCount: number })[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: number, updates: Partial<Chat>): Promise<Chat>;

  // Chat participants
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  removeChatParticipant(chatId: number, userId: number): Promise<void>;
  getChatParticipants(chatId: number): Promise<(ChatParticipant & { user: User })[]>;
  isUserInChat(chatId: number, userId: number): Promise<boolean>;

  // Message operations
  getMessages(chatId: number, limit?: number, offset?: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, updates: Partial<Message>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;

  // Favorites operations
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(userId: number, messageId: number): Promise<void>;
  getUserFavorites(userId: number): Promise<(Favorite & { message: Message & { sender: User } })[]>;

  // Voice rooms operations
  getVoiceRoom(id: number): Promise<VoiceRoom | undefined>;
  getVoiceRooms(): Promise<(VoiceRoom & { participants: VoiceRoomParticipant[] })[]>;
  createVoiceRoom(room: InsertVoiceRoom): Promise<VoiceRoom>;
  joinVoiceRoom(roomId: number, userId: number): Promise<void>;
  leaveVoiceRoom(roomId: number, userId: number): Promise<void>;
  getVoiceRoomParticipants(roomId: number): Promise<(VoiceRoomParticipant & { user: User })[]>;

  // Session operations
  createSession(userId: number): Promise<string>;
  getSession(sessionId: string): Promise<{ userId: number } | undefined>;
  deleteSession(sessionId: string): Promise<void>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<void>;
  deleteUser(id: number): Promise<void>;
  getSystemStats(): Promise<{
    totalUsers: number;
    activeChats: number;
    totalGroups: number;
    activeVoiceRooms: number;
  }>;

  // Chat management
  archiveChatForUser(chatId: number, userId: number): Promise<void>;
  pinChatForUser(chatId: number, userId: number): Promise<void>;

  // Message reactions
  addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  removeMessageReaction(messageId: number, userId: number, emoji: string): Promise<void>;
  getMessageReactions(messageId: number): Promise<(MessageReaction & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
      })
      .returning();

    // Create favorites chat for the user
    await this.createFavoritesChat(newUser.id);

    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async searchUsers(query: string, excludeId?: number): Promise<User[]> {
    let whereClause = or(
      like(users.username, `%${query}%`),
      like(users.email, `%${query}%`)
    );

    if (excludeId) {
      whereClause = and(whereClause, sql`${users.id} != ${excludeId}`);
    }

    return await db.select().from(users).where(whereClause);
  }

  async updateUserStatus(id: number, status: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        status, 
        isOnline, 
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async getUserChats(userId: number): Promise<(Chat & { lastMessage?: Message; unreadCount: number })[]> {
    const userChats = await db
      .select({
        chat: chats,
        participant: chatParticipants,
      })
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(
        and(
          eq(chatParticipants.userId, userId),
          eq(chatParticipants.isActive, true),
          eq(chats.isActive, true)
        )
      )
      .orderBy(desc(chats.updatedAt));

    const result = [];
    for (const { chat, participant } of userChats) {
      const [lastMessage] = await db
        .select()
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            eq(messages.chatId, chat.id),
            eq(messages.isDeleted, false)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);

      let chatName = chat.name;

      // For private chats, show the other user's name
      if (chat.type === 'private') {
        const participants = await this.getChatParticipants(chat.id);
        const otherParticipant = participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          const otherUser = await this.getUser(otherParticipant.userId);
          if (otherUser) {
            chatName = otherUser.username;
          }
        }
      }

      // Calculate unread count - messages sent after user's last read
      const unreadMessages = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.chatId, chat.id),
            eq(messages.isDeleted, false),
            sql`${messages.senderId} != ${userId}`, // Not sent by current user
            participant.lastReadAt ? sql`${messages.createdAt} > ${participant.lastReadAt}` : sql`1=1`
          )
        );

      result.push({
        ...chat,
        name: chatName,
        lastMessage: lastMessage ? {
          ...lastMessage.messages,
          sender: lastMessage.users
        } : undefined,
        unreadCount: unreadMessages[0]?.count || 0,
      });
    }

    return result;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async findPrivateChat(userId1: number, userId2: number): Promise<Chat | null> {
    // Find chats where both users are participants and chat type is private
    const result = await db
      .select({ chat: chats })
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(
        and(
          eq(chats.type, 'private'),
          eq(chatParticipants.userId, userId1)
        )
      );

    // Check if any of these chats also contain the second user
    for (const { chat } of result) {
      const participants = await this.getChatParticipants(chat.id);
      const hasSecondUser = participants.some(p => p.userId === userId2);
      if (hasSecondUser && participants.length === 2) {
        return chat;
      }
    }

    return null;
  }

  async updateChat(id: number, updates: Partial<Chat>): Promise<Chat> {
    const [updatedChat] = await db
      .update(chats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chats.id, id))
      .returning();
    return updatedChat;
  }

  // Chat participants
  async addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const [newParticipant] = await db
      .insert(chatParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async removeChatParticipant(chatId: number, userId: number): Promise<void> {
    await db
      .update(chatParticipants)
      .set({ isActive: false })
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
  }

  async getChatParticipants(chatId: number): Promise<(ChatParticipant & { user: User })[]> {
    return await db
      .select({
        id: chatParticipants.id,
        chatId: chatParticipants.chatId,
        userId: chatParticipants.userId,
        role: chatParticipants.role,
        joinedAt: chatParticipants.joinedAt,
        lastReadAt: chatParticipants.lastReadAt,
        isActive: chatParticipants.isActive,
        user: users,
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.isActive, true)
        )
      );
  }

  async isUserInChat(chatId: number, userId: number): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId),
          eq(chatParticipants.isActive, true)
        )
      );
    return !!participant;
  }

  // Message operations
  async getMessages(chatId: number, limit = 50, offset = 0): Promise<(Message & { sender: User; isRead: boolean })[]> {
    const result = await db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(row => ({
      ...row.messages,
      sender: row.users,
      isRead: false, // Will be updated based on actual read status
    }));
  }

  async markMessagesAsRead(chatId: number, userId: number, messageIds: number[]): Promise<void> {
    await db
      .update(chatParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();

    // Update chat's updated timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, message.chatId));

    return newMessage;
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(messages.id, id));
  }

  // Favorites operations
  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFromFavorites(userId: number, messageId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.messageId, messageId)
        )
      );
  }

  async getUserFavorites(userId: number): Promise<(Favorite & { message: Message & { sender: User } })[]> {
    const result = await db
      .select()
      .from(favorites)
      .innerJoin(messages, eq(favorites.messageId, messages.id))
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return result.map(row => ({
      id: row.favorites.id,
      userId: row.favorites.userId,
      messageId: row.favorites.messageId,
      createdAt: row.favorites.createdAt,
      message: {
        ...row.messages,
        sender: row.users,
      },
    }));
  }

  // Voice rooms operations
  async getVoiceRoom(id: number): Promise<VoiceRoom | undefined> {
    const [room] = await db.select().from(voiceRooms).where(eq(voiceRooms.id, id));
    return room;
  }

  async getVoiceRooms(): Promise<(VoiceRoom & { participants: VoiceRoomParticipant[] })[]> {
    const rooms = await db
      .select()
      .from(voiceRooms)
      .where(eq(voiceRooms.isActive, true));

    const result = [];
    for (const room of rooms) {
      const participants = await db
        .select()
        .from(voiceRoomParticipants)
        .where(eq(voiceRoomParticipants.roomId, room.id));

      result.push({
        ...room,
        participants,
      });
    }

    return result;
  }

  async createVoiceRoom(room: InsertVoiceRoom): Promise<VoiceRoom> {
    const [newRoom] = await db.insert(voiceRooms).values(room).returning();
    return newRoom;
  }

  async joinVoiceRoom(roomId: number, userId: number): Promise<void> {
    await db
      .insert(voiceRoomParticipants)
      .values({ roomId, userId })
      .onConflictDoNothing();
  }

  async leaveVoiceRoom(roomId: number, userId: number): Promise<void> {
    await db
      .delete(voiceRoomParticipants)
      .where(
        and(
          eq(voiceRoomParticipants.roomId, roomId),
          eq(voiceRoomParticipants.userId, userId)
        )
      );
  }

  async getVoiceRoomParticipants(roomId: number): Promise<(VoiceRoomParticipant & { user: User })[]> {
    return await db
      .select({
        id: voiceRoomParticipants.id,
        roomId: voiceRoomParticipants.roomId,
        userId: voiceRoomParticipants.userId,
        isMuted: voiceRoomParticipants.isMuted,
        joinedAt: voiceRoomParticipants.joinedAt,
        user: users,
      })
      .from(voiceRoomParticipants)
      .innerJoin(users, eq(voiceRoomParticipants.userId, users.id))
      .where(eq(voiceRoomParticipants.roomId, roomId));
  }

  // Session operations
  async createSession(userId: number): Promise<string> {
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await db.insert(sessions).values({
      userId: userId,
      token: sessionToken,
      expiresAt,
    });

    return sessionToken;
  }

  async getSession(sessionToken: string): Promise<{ userId: number } | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, sessionToken),
          sql`${sessions.expiresAt} > NOW()`
        )
      );

    return session ? { userId: session.userId } : undefined;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, sessionToken));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async updateUserRole(id: number, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    activeChats: number;
    totalGroups: number;
    activeVoiceRooms: number;
  }> {
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [activeChats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chats)
      .where(eq(chats.isActive, true));

    const [totalGroups] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chats)
      .where(
        and(
          eq(chats.type, "group"),
          eq(chats.isActive, true)
        )
      );

    const [activeVoiceRooms] = await db
      .select({ count: sql<number>`count(*)` })
      .from(voiceRooms)
      .where(eq(voiceRooms.isActive, true));

    return {
      totalUsers: totalUsers.count,
      activeChats: activeChats.count,
      totalGroups: totalGroups.count,
      activeVoiceRooms: activeVoiceRooms.count,
    };
  }

  // Chat management methods
  async archiveChatForUser(chatId: number, userId: number): Promise<void> {
    // This would normally update a specific field, but for now we'll just leave it as a placeholder
    // In a real implementation, you'd add an isArchived field to chatParticipants
    console.log(`Archiving chat ${chatId} for user ${userId}`);
  }

  async pinChatForUser(chatId: number, userId: number): Promise<void> {
    // This would normally update a specific field, but for now we'll just leave it as a placeholder
    // In a real implementation, you'd add an isPinned field to chatParticipants
    console.log(`Pinning chat ${chatId} for user ${userId}`);
  }

  // Message reactions
  async addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    // Check if reaction already exists
    const existing = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, reaction.messageId),
          eq(messageReactions.userId, reaction.userId),
          eq(messageReactions.emoji, reaction.emoji)
        )
      );

    if (existing.length > 0) {
      // Remove existing reaction
      await db
        .delete(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, reaction.messageId),
            eq(messageReactions.userId, reaction.userId),
            eq(messageReactions.emoji, reaction.emoji)
          )
        );
      return existing[0];
    }

    const [newReaction] = await db
      .insert(messageReactions)
      .values(reaction)
      .returning();

    return newReaction;
  }

  async removeMessageReaction(messageId: number, userId: number, emoji: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );
  }

  async getMessageReactions(messageId: number): Promise<(MessageReaction & { user: User })[]> {
    return await db
      .select({
        id: messageReactions.id,
        messageId: messageReactions.messageId,
        userId: messageReactions.userId,
        emoji: messageReactions.emoji,
        createdAt: messageReactions.createdAt,
        user: users,
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, messageId));
  }

  // Helper method to create favorites chat
  private async createFavoritesChat(userId: number): Promise<void> {
    const [favoritesChat] = await db
      .insert(chats)
      .values({
        name: "Избранное",
        type: "favorites",
        description: "Ваши сохраненные сообщения",
        createdBy: userId,
      })
      .returning();

    await db.insert(chatParticipants).values({
      chatId: favoritesChat.id,
      userId,
      role: "owner",
    });
  }
}

export const storage = new DatabaseStorage();