import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, MessageCircle, Users } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  status: string;
}

interface UserSearchProps {
  onClose: () => void;
  onChatStart: (chatId: number) => void;
}

export default function UserSearch({ onClose, onChatStart }: UserSearchProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Search users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Create private chat
  const createPrivateChatMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', '/api/chats/private', {
        userId,
      });
      return response.json();
    },
    onSuccess: async (chat) => {
      // Force refetch of chats list
      await queryClient.refetchQueries({ queryKey: ['/api/chats'] });
      // Small delay to ensure data is loaded
      setTimeout(() => {
        onChatStart(chat.id);
        onClose();
      }, 100);
    },
    onError: (error: any) => {
      console.error('Create chat error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать чат",
        variant: "destructive",
      });
    },
  });

  const handleUserClick = (userId: number) => {
    createPrivateChatMutation.mutate(userId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'В сети';
      case 'away':
        return 'Отошёл';
      case 'busy':
        return 'Занят';
      default:
        return 'Не в сети';
    }
  };

  return (
    <div className="fixed inset-0 z-50 modal-backdrop">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md rounded-xl" style={{ 
          background: 'var(--neo-surface)', 
          border: '1px solid var(--neo-border)' 
        }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--neo-border)' }}>
            <div className="flex items-center">
              <Search className="w-5 h-5 mr-2" style={{ color: 'var(--neo-green)' }} />
              <h3 className="text-lg font-semibold text-white">Поиск пользователей</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" style={{ color: 'var(--neo-text)' }} />
            </Button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-3"
                style={{ 
                  background: 'var(--neo-border)',
                  border: '1px solid var(--neo-border)',
                  color: 'white'
                }}
              />
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hidden">
              {!searchQuery.trim() ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--neo-text)' }} />
                  <p style={{ color: 'var(--neo-text)' }}>Начните поиск пользователей</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--neo-text)' }} />
                  <p style={{ color: 'var(--neo-text)' }}>Пользователи не найдены</p>
                </div>
              ) : (
                users.map((user: User) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    style={{ background: 'var(--neo-border)' }}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-bg mr-3">
                          <span className="text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute bottom-0 right-2 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`}></div>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.username}</p>
                        <p className="text-sm" style={{ color: 'var(--neo-text)' }}>{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--neo-text)' }}>
                          {getStatusText(user.status)}
                        </p>
                      </div>
                      <MessageCircle className="w-4 h-4" style={{ color: 'var(--neo-green)' }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
