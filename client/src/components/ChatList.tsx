import { Star, Users, MessageCircle, Hash, Trash2, Archive, Pin, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Chat {
  id: number;
  name: string;
  type: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: {
      username: string;
    };
  };
  unreadCount: number;
}

interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chatId: number) => void;
}

export default function ChatList({ chats, onChatSelect }: ChatListProps) {
  const [swipeStates, setSwipeStates] = useState<{[key: number]: { translateX: number, isOpen: boolean }}>({});
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [peekMenuChat, setPeekMenuChat] = useState<Chat | null>(null);
  const startX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const getChatIcon = (chat: Chat) => {
    switch (chat.type) {
      case 'favorites':
        return <Star className="w-6 h-6 text-white" fill="currentColor" />;
      case 'group':
        return <Users className="w-6 h-6 text-white" />;
      case 'private':
        return <MessageCircle className="w-6 h-6 text-white" />;
      default:
        return <Hash className="w-6 h-6 text-white" />;
    }
  };

  const getChatColor = (type: string) => {
    switch (type) {
      case 'favorites':
        return 'bg-yellow-500';
      case 'group':
        return 'gradient-bg';
      case 'private':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getLastMessageText = (chat: Chat) => {
    if (!chat.lastMessage) {
      return chat.type === 'favorites' ? 'Ваши сохраненные сообщения' : 'Нет сообщений';
    }
    
    const { content, sender } = chat.lastMessage;
    if (chat.type === 'group') {
      return `${sender.username}: ${content}`;
    }
    
    return content;
  };

  const handleTouchStart = (e: React.TouchEvent, chatId: number) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = false;
    
    // Long press detection
    const timeout = setTimeout(() => {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setPeekMenuChat(chat);
      }
    }, 500);
    setLongPressTimeout(timeout);
  };

  const handleTouchMove = (e: React.TouchEvent, chatId: number) => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;
    
    if (Math.abs(deltaX) > 10) {
      isDragging.current = true;
      const translateX = Math.min(0, Math.max(-120, deltaX));
      
      setSwipeStates(prev => ({
        ...prev,
        [chatId]: { translateX, isOpen: translateX < -60 }
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, chatId: number) => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
    
    const state = swipeStates[chatId];
    if (state && isDragging.current) {
      const finalTranslateX = state.isOpen ? -120 : 0;
      setSwipeStates(prev => ({
        ...prev,
        [chatId]: { translateX: finalTranslateX, isOpen: state.isOpen }
      }));
    }
    
    isDragging.current = false;
  };

  const handleChatClick = (chatId: number) => {
    const state = swipeStates[chatId];
    if (state && state.isOpen) {
      setSwipeStates(prev => ({
        ...prev,
        [chatId]: { translateX: 0, isOpen: false }
      }));
    } else if (!isDragging.current) {
      onChatSelect(chatId);
    }
  };

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: number) => {
      await apiRequest('DELETE', `/api/chats/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      toast({
        title: "Чат удален",
        description: "Чат успешно удален",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чат",
        variant: "destructive",
      });
    },
  });

  const archiveChatMutation = useMutation({
    mutationFn: async (chatId: number) => {
      await apiRequest('PUT', `/api/chats/${chatId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      toast({
        title: "Чат архивирован",
        description: "Чат перемещен в архив",
      });
    },
  });

  const pinChatMutation = useMutation({
    mutationFn: async (chatId: number) => {
      await apiRequest('PUT', `/api/chats/${chatId}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      toast({
        title: "Чат закреплен",
        description: "Чат закреплен в верхней части списка",
      });
    },
  });

  const handleDeleteChat = (chatId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот чат?')) {
      deleteChatMutation.mutate(chatId);
    }
  };

  const handleArchiveChat = (chatId: number) => {
    archiveChatMutation.mutate(chatId);
  };

  const handlePinChat = (chatId: number) => {
    pinChatMutation.mutate(chatId);
  };

  return (
    <div className="space-y-0">
      {chats.map((chat) => {
        const swipeState = swipeStates[chat.id] || { translateX: 0, isOpen: false };
        
        return (
          <div key={chat.id} className="relative overflow-hidden">
            {/* Swipe Actions Background */}
            <div className="absolute right-0 top-0 bottom-0 flex items-center bg-red-500">
              <div className="flex items-center space-x-2 px-4">
                <button
                  onClick={() => handleArchiveChat(chat.id)}
                  className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600"
                >
                  <Archive className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => handlePinChat(chat.id)}
                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600"
                >
                  <Pin className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => handleDeleteChat(chat.id)}
                  className="p-2 rounded-full bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            
            {/* Chat Item */}
            <div
              onTouchStart={(e) => handleTouchStart(e, chat.id)}
              onTouchMove={(e) => handleTouchMove(e, chat.id)}
              onTouchEnd={(e) => handleTouchEnd(e, chat.id)}
              onClick={() => handleChatClick(chat.id)}
              className={`flex items-center p-4 hover:bg-white/5 cursor-pointer transition-all duration-200 ${
                chat.unreadCount > 0 ? 'border-l-4 border-green-500' : ''
              }`}
              style={{
                transform: `translateX(${swipeState.translateX}px)`,
                background: 'var(--neo-surface)',
              }}
            >
              <div className="flex-shrink-0 relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getChatColor(chat.type)}`}>
                  {getChatIcon(chat)}
                </div>
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{chat.name}</h3>
                  <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--neo-text)' }}>
                    {chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : ''}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--neo-text)' }}>
                  {getLastMessageText(chat)}
                </p>
              </div>
              
              {chat.unreadCount > 0 && (
                <div className="flex-shrink-0 ml-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {chats.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--neo-text)' }} />
          <p style={{ color: 'var(--neo-text)' }}>Нет активных чатов</p>
          <p className="text-sm mt-2" style={{ color: 'var(--neo-text)' }}>
            Найдите пользователей и начните общение
          </p>
        </div>
      )}
      
      {/* Peek Menu */}
      {peekMenuChat && (
        <div className="fixed inset-0 z-50 modal-backdrop" onClick={() => setPeekMenuChat(null)}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md rounded-xl" style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 ${getChatColor(peekMenuChat.type)}`}>
                    {getChatIcon(peekMenuChat)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{peekMenuChat.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      {peekMenuChat.type === 'group' ? 'Группа' : 
                       peekMenuChat.type === 'private' ? 'Личный чат' : 
                       peekMenuChat.type === 'favorites' ? 'Избранное' : 'Чат'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onChatSelect(peekMenuChat.id);
                      setPeekMenuChat(null);
                    }}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 mr-3" style={{ color: 'var(--neo-green)' }} />
                    <span className="text-white">Открыть чат</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      handlePinChat(peekMenuChat.id);
                      setPeekMenuChat(null);
                    }}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Pin className="w-5 h-5 mr-3" style={{ color: 'var(--neo-blue)' }} />
                    <span className="text-white">Закрепить</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleArchiveChat(peekMenuChat.id);
                      setPeekMenuChat(null);
                    }}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Archive className="w-5 h-5 mr-3 text-yellow-500" />
                    <span className="text-white">Архивировать</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setPeekMenuChat(null);
                    }}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Info className="w-5 h-5 mr-3" style={{ color: 'var(--neo-text)' }} />
                    <span className="text-white">Информация</span>
                  </button>
                  
                  {peekMenuChat.type !== 'favorites' && (
                    <button
                      onClick={() => {
                        handleDeleteChat(peekMenuChat.id);
                        setPeekMenuChat(null);
                      }}
                      className="w-full flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                      <span className="text-white">Удалить чат</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
