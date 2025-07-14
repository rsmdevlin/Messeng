import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertChatSchema, insertMessageSchema, insertFavoriteSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Map<number, WebSocket>();
  
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          const session = await storage.getSession(data.sessionId);
          if (session) {
            userId = session.userId;
            connectedClients.set(userId, ws);
            await storage.updateUserStatus(userId, 'online', true);
          }
        }
        
        if (data.type === 'message' && userId) {
          const { chatId, content } = data;
          const message = await storage.createMessage({
            chatId,
            senderId: userId,
            content,
          });
          
          // Broadcast to all participants in the chat
          const participants = await storage.getChatParticipants(chatId);
          participants.forEach(participant => {
            const client = connectedClients.get(participant.userId);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'newMessage',
                message: { ...message, sender: { id: userId } },
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });
    
    ws.on('close', async () => {
      if (userId) {
        connectedClients.delete(userId);
        await storage.updateUserStatus(userId, 'offline', false);
      }
    });
  });

  // Authentication middleware
  const authenticate = async (req: any, res: any, next: any) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ message: 'Invalid session' });
      }
      
      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  };

  const adminOnly = (req: any, res: any, next: any) => {
    const adminUsers = ['Roman', 'basacapone@gmail.com', 'Sosihui228'];
    if (req.user.role !== 'admin' && 
        !adminUsers.includes(req.user.username) && 
        !adminUsers.includes(req.user.email)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      const user = await storage.createUser(userData);
      const sessionId = await storage.createSession(user.id);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        sessionId 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;
      
      // Find user by email or username
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const sessionId = await storage.createSession(user.id);
      await storage.updateUserStatus(user.id, 'online', true);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        sessionId 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', authenticate, async (req: any, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (sessionId) {
        await storage.deleteSession(sessionId);
        await storage.updateUserStatus(req.user.id, 'offline', false);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  app.get('/api/auth/user', authenticate, (req: any, res) => {
    res.json({ ...req.user, password: undefined });
  });

  // User routes
  app.get('/api/users/search', authenticate, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(q as string, req.user.id);
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  app.patch('/api/users/profile', authenticate, async (req: any, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates here
      delete updates.role; // Don't allow role updates
      
      const updatedUser = await storage.updateUser(req.user.id, updates);
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Profile update failed' });
    }
  });

  // Chat routes
  app.get('/api/chats', authenticate, async (req: any, res) => {
    try {
      const chats = await storage.getUserChats(req.user.id);
      res.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ message: 'Failed to get chats' });
    }
  });

  app.post('/api/chats', authenticate, async (req: any, res) => {
    try {
      const chatData = insertChatSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const chat = await storage.createChat(chatData);
      
      // Add creator as participant
      await storage.addChatParticipant({
        chatId: chat.id,
        userId: req.user.id,
        role: 'owner',
      });
      
      res.json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error('Create chat error:', error);
      res.status(500).json({ message: 'Failed to create chat' });
    }
  });

  app.post('/api/chats/:chatId/participants', authenticate, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const { userId } = req.body;
      
      // Check if user is admin of the chat
      const participants = await storage.getChatParticipants(parseInt(chatId));
      const userParticipant = participants.find(p => p.userId === req.user.id);
      
      if (!userParticipant || !['owner', 'admin'].includes(userParticipant.role)) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      await storage.addChatParticipant({
        chatId: parseInt(chatId),
        userId,
        role: 'member',
      });
      
      res.json({ message: 'User added to chat' });
    } catch (error) {
      console.error('Add participant error:', error);
      res.status(500).json({ message: 'Failed to add participant' });
    }
  });

  app.get('/api/chats/:chatId/participants', authenticate, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      
      // Check if user is in chat
      const isInChat = await storage.isUserInChat(parseInt(chatId), req.user.id);
      if (!isInChat) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const participants = await storage.getChatParticipants(parseInt(chatId));
      res.json(participants);
    } catch (error) {
      console.error('Get participants error:', error);
      res.status(500).json({ message: 'Failed to get participants' });
    }
  });

  // Message routes
  app.get('/api/chats/:chatId/messages', authenticate, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // Check if user is in chat
      const isInChat = await storage.isUserInChat(parseInt(chatId), req.user.id);
      if (!isInChat) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const messages = await storage.getMessages(
        parseInt(chatId),
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  app.post('/api/chats/:chatId/messages', authenticate, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        chatId: parseInt(chatId),
        senderId: req.user.id,
      });
      
      // Check if user is in chat
      const isInChat = await storage.isUserInChat(parseInt(chatId), req.user.id);
      if (!isInChat) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error('Create message error:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  // Private chat creation
  app.post('/api/chats/private', authenticate, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      // Check if private chat already exists
      const existingChats = await storage.getUserChats(req.user.id);
      const existingPrivateChat = existingChats.find(chat => 
        chat.type === 'private' && 
        chat.name === `${req.user.username}-${userId}` // Simple naming convention
      );
      
      if (existingPrivateChat) {
        return res.json(existingPrivateChat);
      }
      
      const otherUser = await storage.getUser(userId);
      if (!otherUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const chat = await storage.createChat({
        name: otherUser.username,
        type: 'private',
        createdBy: req.user.id,
      });
      
      // Add both users as participants
      await storage.addChatParticipant({
        chatId: chat.id,
        userId: req.user.id,
        role: 'member',
      });
      
      await storage.addChatParticipant({
        chatId: chat.id,
        userId: userId,
        role: 'member',
      });
      
      res.json(chat);
    } catch (error) {
      console.error('Create private chat error:', error);
      res.status(500).json({ message: 'Failed to create private chat' });
    }
  });

  // Favorites routes
  app.get('/api/favorites', authenticate, async (req: any, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({ message: 'Failed to get favorites' });
    }
  });

  app.post('/api/favorites', authenticate, async (req: any, res) => {
    try {
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const favorite = await storage.addToFavorites(favoriteData);
      res.json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error('Add favorite error:', error);
      res.status(500).json({ message: 'Failed to add favorite' });
    }
  });

  app.delete('/api/favorites/:messageId', authenticate, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      await storage.removeFromFavorites(req.user.id, parseInt(messageId));
      res.json({ message: 'Removed from favorites' });
    } catch (error) {
      console.error('Remove favorite error:', error);
      res.status(500).json({ message: 'Failed to remove favorite' });
    }
  });

  // Voice rooms routes
  app.get('/api/voice-rooms', authenticate, async (req: any, res) => {
    try {
      const rooms = await storage.getVoiceRooms();
      res.json(rooms);
    } catch (error) {
      console.error('Get voice rooms error:', error);
      res.status(500).json({ message: 'Failed to get voice rooms' });
    }
  });

  app.post('/api/voice-rooms', authenticate, async (req: any, res) => {
    try {
      const roomData = {
        ...req.body,
        createdBy: req.user.id,
      };
      
      const room = await storage.createVoiceRoom(roomData);
      res.json(room);
    } catch (error) {
      console.error('Create voice room error:', error);
      res.status(500).json({ message: 'Failed to create voice room' });
    }
  });

  app.post('/api/voice-rooms/:roomId/join', authenticate, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      await storage.joinVoiceRoom(parseInt(roomId), req.user.id);
      res.json({ message: 'Joined voice room' });
    } catch (error) {
      console.error('Join voice room error:', error);
      res.status(500).json({ message: 'Failed to join voice room' });
    }
  });

  app.post('/api/voice-rooms/:roomId/leave', authenticate, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      await storage.leaveVoiceRoom(parseInt(roomId), req.user.id);
      res.json({ message: 'Left voice room' });
    } catch (error) {
      console.error('Leave voice room error:', error);
      res.status(500).json({ message: 'Failed to leave voice room' });
    }
  });

  // Admin routes
  app.get('/api/admin/users', authenticate, adminOnly, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  app.patch('/api/admin/users/:userId/role', authenticate, adminOnly, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      await storage.updateUserRole(parseInt(userId), role);
      res.json({ message: 'User role updated' });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  app.delete('/api/admin/users/:userId', authenticate, adminOnly, async (req: any, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteUser(parseInt(userId));
      res.json({ message: 'User deleted' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  app.get('/api/admin/stats', authenticate, adminOnly, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ message: 'Failed to get stats' });
    }
  });

  return httpServer;
}
