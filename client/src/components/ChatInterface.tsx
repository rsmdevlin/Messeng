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
  CheckCheck
} from "lucide-react";

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat details
  const { data: chat } = useQuery({
    queryKey: ['/api/chats', chatId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chats/${chatId}`);
      return response.json();
    },
    enabled: !!chatId,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chats', chatId, 'messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chats/${chatId}/messages`);
      return response.json();
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/chats/${chatId}/messages`, {
        content
      });
      return response.json();
    },
    onSuccess: (data, content) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });

      // Send via WebSocket
      sendMessage({
        type: 'message',
        chatId,
        content: content
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('POST', '/api/favorites', {
        messageId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Добавлено в избранное",
        description: "Сообщение сохранено в избранном",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить в избранное",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const content = messageText.trim();
    setMessageText("");

    await sendMessageMutation.mutateAsync(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      case 'favorites':
        return 'Избранное';
      case 'group':
        return chat.name;
      case 'private':
        return chat.name;
      default:
        return chat.name;
    }
  };

  const getChatSubtitle = () => {
    if (!chat) return "";

    switch (chat.type) {
      case 'favorites':
        return 'Ваши сохраненные сообщения';
      case 'group':
        return 'Группа • 3 участника';
      case 'private':
        return 'В сети';
      default:
        return '';
    }
  };

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

        <div className="flex-1 flex items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-bg mr-3">
            <span className="text-white font-bold">
              {chat?.type === 'favorites' ? '★' : getChatTitle().charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-white">{getChatTitle()}</h3>
            <p className="text-sm text-white/70">{getChatSubtitle()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-white/10"
          >
            <Search className="w-5 h-5 text-white" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-white/10"
          >
            <MoreHorizontal className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        <div className="flex justify-center">
          <div className="px-4 py-2 rounded-lg text-sm" style={{ 
            background: 'var(--neo-surface)', 
            color: 'var(--neo-text)' 
          }}>
            Добро пожаловать в NeoGram! 🎉
          </div>
        </div>

        {/* Messages */}
        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md rounded-lg p-3 relative group ${
              message.senderId === user?.id 
                ? 'bg-blue-600 text-white' 
                : 'text-white'
            }`} style={{
              background: message.senderId === user?.id ? 'var(--neo-blue)' : 'var(--neo-surface)'
            }}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-70">
                  {formatTime(message.createdAt)}
                </span>
                {message.senderId === user?.id && (
                  <div className="flex items-center space-x-1">
                    <CheckCheck className="w-4 h-4 opacity-70" />
                  </div>
                )}
              </div>

              {/* Add to favorites button */}
              {message.senderId !== user?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addToFavoritesMutation.mutate(message.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-yellow-500 hover:bg-yellow-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star className="w-3 h-3 text-white" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--neo-border)' }}>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-white/10"
          >
            <Paperclip className="w-5 h-5" style={{ color: 'var(--neo-text)' }} />
          </Button>

          <div className="flex-1">
            <Input
              type="text"
              placeholder="Напишите сообщение..."
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
    </div>
  );
}