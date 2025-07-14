
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search, 
  MoreHorizontal, 
  Send, 
  Paperclip,
  Star,
  Check,
  CheckCheck,
  Reply,
  Edit2,
  Trash2,
  Forward,
  Heart,
  ThumbsUp,
  Smile,
  Phone,
  Video,
  Info
} from "lucide-react";

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isRead?: boolean;
  reactions?: { emoji: string; users: number[]; count: number }[];
  sender: {
    id: number;
    username: string;
  };
}

interface ChatInterfaceProps {
  chatId: number;
  onBack: () => void;
  sendMessage: (data: any) => void;
}

export default function ChatInterface({ chatId, onBack, sendMessage }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showUserProfile, setShowUserProfile] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [showReactionUsers, setShowReactionUsers] = useState<{ messageId: number; emoji: string; users: any[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat details
  const { data: allChats = [] } = useQuery({
    queryKey: ['/api/chats'],
    enabled: !!user,
  });

  const chat = allChats.find((c: any) => c.id === chatId);

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chats', chatId, 'messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chats/${chatId}/messages`);
      return response.json();
    },
    enabled: !!chatId,
    refetchInterval: false,
  });

  // Mark messages as read when chat opens
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      await apiRequest('POST', `/api/chats/${chatId}/messages/read`, { messageIds });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, replyTo }: { content: string; replyTo?: number }) => {
      const response = await apiRequest('POST', `/api/chats/${chatId}/messages`, {
        content,
        replyTo
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setReplyingTo(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      const response = await apiRequest('PUT', `/api/chats/${chatId}/messages/${messageId}`, {
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      setEditingMessage(null);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest('DELETE', `/api/chats/${chatId}/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number; emoji: string }) => {
      const response = await apiRequest('POST', `/api/chats/${chatId}/messages/${messageId}/reactions`, {
        emoji
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
    },
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('POST', '/api/favorites', { messageId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Добавлено в избранное",
        description: "Сообщение сохранено в избранном",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText("");

    if (editingMessage) {
      editMessageMutation.mutate({ messageId: editingMessage.id, content });
    } else {
      sendMessageMutation.mutate({ 
        content, 
        replyTo: replyingTo?.id 
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleMessageSwipe = (message: Message, direction: 'left' | 'right') => {
    if (direction === 'left') {
      setReplyingTo(message);
    }
  };

  const handleUserClick = (userId: number) => {
    // Show user profile
    const userProfile = { id: userId, username: 'User ' + userId };
    setShowUserProfile(userProfile);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
    setShowReactionPicker(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages
        .filter((msg: Message) => msg.senderId !== user?.id && !msg.isRead)
        .map((msg: Message) => msg.id);
      
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate(unreadMessages);
      }
    }
  }, [messages, user?.id]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getChatTitle = () => {
    if (!chat) return "Чат";
    switch (chat.type) {
      case 'favorites': return 'Избранное';
      case 'group': return chat.name;
      case 'private': return chat.name;
      default: return chat.name;
    }
  };

  const getChatSubtitle = () => {
    if (!chat) return "";
    switch (chat.type) {
      case 'favorites': return 'Ваши сохраненные сообщения';
      case 'group': return 'Группа • 3 участника';
      case 'private': return 'В сети';
      default: return '';
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== user?.id) return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else {
      return <Check className="w-4 h-4 opacity-70" />;
    }
  };

  const reactions = ['❤️', '👍', '👎', '😂', '😮', '😢', '😡', '👏'];

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--neo-dark)' }}>
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-3 p-2 rounded-full hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>

        <div className="flex-1 flex items-center" onClick={() => handleUserClick(1)}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-bg mr-3 cursor-pointer">
            <span className="text-white font-bold">
              {chat?.type === 'favorites' ? '★' : getChatTitle().charAt(0)}
            </span>
          </div>
          <div className="cursor-pointer">
            <h3 className="font-medium text-white">{getChatTitle()}</h3>
            <p className="text-sm text-white/70">{getChatSubtitle()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/10">
            <Phone className="w-5 h-5 text-white" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/10">
            <Video className="w-5 h-5 text-white" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/10">
            <Search className="w-5 h-5 text-white" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/10">
            <MoreHorizontal className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Reply Bar */}
      {replyingTo && (
        <div className="p-2 border-b flex items-center justify-between" style={{ 
          background: 'var(--neo-surface)', 
          borderColor: 'var(--neo-border)' 
        }}>
          <div className="flex items-center">
            <Reply className="w-4 h-4 mr-2" style={{ color: 'var(--neo-green)' }} />
            <div>
              <p className="text-sm font-medium text-white">{replyingTo.sender.username}</p>
              <p className="text-xs" style={{ color: 'var(--neo-text)' }}>
                {replyingTo.content.substring(0, 50)}...
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
            className="p-1"
          >
            ×
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center">
          <div className="px-4 py-2 rounded-lg text-sm" style={{ 
            background: 'var(--neo-surface)', 
            color: 'var(--neo-text)' 
          }}>
            Добро пожаловать в NeoGram! 🎉
          </div>
        </div>

        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs lg:max-w-md rounded-lg p-3 relative group cursor-pointer ${
                message.senderId === user?.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-white'
              }`} 
              style={{
                background: message.senderId === user?.id ? 'var(--neo-blue)' : 'var(--neo-surface)'
              }}
              onTouchStart={(e) => {
                const startX = e.touches[0].clientX;
                const handleTouchMove = (e: TouchEvent) => {
                  const deltaX = e.touches[0].clientX - startX;
                  if (Math.abs(deltaX) > 50) {
                    handleMessageSwipe(message, deltaX > 0 ? 'right' : 'left');
                    document.removeEventListener('touchmove', handleTouchMove);
                  }
                };
                document.addEventListener('touchmove', handleTouchMove);
                setTimeout(() => document.removeEventListener('touchmove', handleTouchMove), 500);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(message);
              }}
            >
              <div className="flex items-start">
                {message.senderId !== user?.id && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center gradient-bg mr-2 text-xs cursor-pointer"
                    onClick={() => handleUserClick(message.senderId)}
                  >
                    {message.sender.username.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">
                    {message.isEdited && <span className="text-xs opacity-70 mr-2">(изменено)</span>}
                    {message.content}
                  </p>
                  
                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() => setShowReactionUsers({ 
                            messageId: message.id, 
                            emoji: reaction.emoji, 
                            users: [] 
                          })}
                          className="flex items-center px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs"
                        >
                          <span className="mr-1">{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {formatTime(message.createdAt)}
                    </span>
                    {getMessageStatus(message)}
                  </div>
                </div>
              </div>

              {/* Message Actions */}
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReactionPicker(message.id)}
                  className="w-6 h-6 p-0 bg-yellow-500 hover:bg-yellow-600 rounded-full"
                >
                  <Smile className="w-3 h-3 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(message)}
                  className="w-6 h-6 p-0 bg-blue-500 hover:bg-blue-600 rounded-full"
                >
                  <Reply className="w-3 h-3 text-white" />
                </Button>
                {message.senderId !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addToFavoritesMutation.mutate(message.id)}
                    className="w-6 h-6 p-0 bg-green-500 hover:bg-green-600 rounded-full"
                  >
                    <Star className="w-3 h-3 text-white" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--neo-border)' }}>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/10">
            <Paperclip className="w-5 h-5" style={{ color: 'var(--neo-text)' }} />
          </Button>

          <div className="flex-1">
            <Input
              type="text"
              placeholder={editingMessage ? "Редактировать сообщение..." : "Напишите сообщение..."}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="px-4 py-2"
              style={{ 
                background: 'var(--neo-surface)',
                border: '1px solid var(--neo-border)',
                color: 'white'
              }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="p-2 rounded-full gradient-bg hover:opacity-90"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-4 flex space-x-2">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(showReactionPicker, emoji)}
                className="p-2 text-2xl hover:bg-gray-100 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-80">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-2xl font-bold">
                  {showUserProfile.username.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-semibold">{showUserProfile.username}</h3>
              <p className="text-gray-600">@{showUserProfile.username}</p>
            </div>
            
            <div className="space-y-2">
              <Button className="w-full">Написать сообщение</Button>
              <Button variant="outline" className="w-full">Заблокировать</Button>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowUserProfile(null)}
              className="w-full mt-4"
            >
              Закрыть
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
