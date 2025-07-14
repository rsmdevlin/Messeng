import { Star, Users, MessageCircle, Hash } from "lucide-react";

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

  return (
    <div className="space-y-0">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onChatSelect(chat.id)}
          className={`flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors ${
            chat.unreadCount > 0 ? 'border-l-4 border-green-500' : ''
          }`}
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
      ))}
      
      {chats.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--neo-text)' }} />
          <p style={{ color: 'var(--neo-text)' }}>Нет активных чатов</p>
          <p className="text-sm mt-2" style={{ color: 'var(--neo-text)' }}>
            Найдите пользователей и начните общение
          </p>
        </div>
      )}
    </div>
  );
}
