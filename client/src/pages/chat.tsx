import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ChatList from "@/components/ChatList";
import ChatInterface from "@/components/ChatInterface";
import UserSearch from "@/components/UserSearch";
import ProfileSettings from "@/components/ProfileSettings";
import VoiceRooms from "@/components/VoiceRooms";
import ThemeSelector from "@/components/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Mic, 
  Settings, 
  Star,
  MessageCircle,
  Users,
  Palette
} from "lucide-react";

export default function Chat() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showVoiceRooms, setShowVoiceRooms] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // WebSocket connection
  const { sendMessage } = useWebSocket((data) => {
    if (data.type === 'newMessage') {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/chats', currentChatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    }
  });

  // Fetch user's chats
  const { data: chats = [] } = useQuery({
    queryKey: ['/api/chats'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: showFavorites,
  });

  // Filter chats based on search
  const filteredChats = chats.filter((chat: any) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || 
    ['Roman', 'basacapone@gmail.com', 'Sosihui228'].includes(user?.username || '') ||
    ['Roman', 'basacapone@gmail.com', 'Sosihui228'].includes(user?.email || '');

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "До свидания!",
        description: "Вы вышли из системы",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive",
      });
    }
  };

  const handleChatSelect = (chatId: number) => {
    setCurrentChatId(chatId);
  };

  const handleBackToChats = () => {
    setCurrentChatId(null);
  };

  const handleSettingsClick = () => {
    if (isAdmin) {
      setLocation('/admin');
    } else {
      setShowProfileSettings(true);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserStatusColor = (status: string) => {
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

  if (currentChatId) {
    return (
      <ChatInterface
        chatId={currentChatId}
        onBack={handleBackToChats}
        sendMessage={sendMessage}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{ background: 'var(--neo-dark)' }}>
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-bg">
              <span className="text-white font-bold">
                {getUserInitials(user?.username || 'U')}
              </span>
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getUserStatusColor(user?.status || 'offline')}`}></div>
          </div>
          <div className="ml-3">
            <h2 className="font-semibold text-white">{user?.username}</h2>
            <p className="text-sm text-white/70">{user?.username} #{user?.id?.toString().padStart(4, '0')}</p>
            <div className="flex items-center text-xs text-white/70">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              <span>В сети</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserSearch(true)}
            className="w-8 h-8 bg-white/20 rounded-full p-0 hover:bg-white/30"
          >
            <Search className="w-4 h-4 text-white" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVoiceRooms(true)}
            className="w-8 h-8 bg-white/20 rounded-full p-0 hover:bg-white/30"
          >
            <Mic className="w-4 h-4 text-white" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettingsClick}
            className="w-8 h-8 bg-white/20 rounded-full p-0 hover:bg-white/30"
          >
            <Settings className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-center space-x-4 py-3" style={{ background: 'var(--neo-surface)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFavorites(true)}
          className="w-10 h-10 bg-yellow-500 rounded-full p-0 hover:bg-yellow-600"
        >
          <Star className="w-5 h-5 text-white" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowThemeSelector(true)}
          className="w-10 h-10 bg-purple-500 rounded-full p-0 hover:bg-purple-600"
        >
          <Palette className="w-5 h-5 text-white" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUserSearch(true)}
          className="w-10 h-10 bg-blue-500 rounded-full p-0 hover:bg-blue-600"
        >
          <Users className="w-5 h-5 text-white" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-10 h-10 bg-red-500 rounded-full p-0 hover:bg-red-600"
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--neo-border)' }}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3"
            style={{ 
              background: 'var(--neo-surface)',
              border: '1px solid var(--neo-border)',
              color: 'white'
            }}
          />
          <Search className="absolute left-3 top-3.5 w-4 h-4" style={{ color: 'var(--neo-text)' }} />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ChatList
          chats={filteredChats}
          onChatSelect={handleChatSelect}
        />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setShowUserSearch(true)}
          className="w-12 h-12 rounded-full gradient-bg shadow-lg hover:opacity-90"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Modals */}
      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onChatStart={handleChatSelect}
        />
      )}
      
      {showProfileSettings && (
        <ProfileSettings
          onClose={() => setShowProfileSettings(false)}
        />
      )}
      
      {showVoiceRooms && (
        <VoiceRooms
          onClose={() => setShowVoiceRooms(false)}
        />
      )}
      
      {showThemeSelector && (
        <ThemeSelector
          onClose={() => setShowThemeSelector(false)}
        />
      )}

      {/* Favorites Modal */}
      {showFavorites && (
        <div className="fixed inset-0 z-50 modal-backdrop">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md rounded-xl" style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--neo-border)' }}>
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2" style={{ color: 'var(--neo-green)' }} />
                  <h3 className="text-lg font-semibold text-white">Избранные сообщения</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFavorites(false)}
                  className="p-2 rounded-full hover:bg-white/10"
                >
                  <span className="sr-only">Закрыть</span>
                  ×
                </Button>
              </div>
              
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto scrollbar-hidden">
                {favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--neo-text)' }} />
                    <p style={{ color: 'var(--neo-text)' }}>Нет избранных сообщений</p>
                  </div>
                ) : (
                  favorites.map((favorite: any) => (
                    <div key={favorite.id} className="p-4 rounded-lg" style={{ background: 'var(--neo-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm" style={{ color: 'var(--neo-green)' }}>
                          {favorite.message.sender.username}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--neo-text)' }}>
                          {new Date(favorite.message.createdAt).toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-white text-sm">{favorite.message.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
