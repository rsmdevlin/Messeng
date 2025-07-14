
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Users, 
  Plus, 
  X, 
  Phone,
  PhoneOff,
  UserPlus,
  Volume2,
  VolumeX
} from "lucide-react";

interface VoiceRoom {
  id: number;
  name: string;
  maxParticipants: number;
  participants: VoiceRoomParticipant[];
  isActive: boolean;
  createdBy: number;
}

interface VoiceRoomParticipant {
  id: number;
  userId: number;
  isMuted: boolean;
  user: {
    id: number;
    username: string;
  };
}

interface VoiceRoomsProps {
  onClose: () => void;
}

export default function VoiceRooms({ onClose }: VoiceRoomsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<VoiceRoom | null>(null);
  const [showInviteModal, setShowInviteModal] = useState<VoiceRoom | null>(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Fetch voice rooms
  const { data: voiceRooms = [], refetch } = useQuery({
    queryKey: ['/api/voice-rooms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/voice-rooms');
      return response.json();
    },
    refetchInterval: 3000,
  });

  // Search users for invites
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/users/search', inviteQuery],
    queryFn: async () => {
      if (!inviteQuery.trim()) return [];
      const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(inviteQuery)}`);
      return response.json();
    },
    enabled: !!inviteQuery.trim(),
  });

  // Create voice room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; maxParticipants: number }) => {
      const response = await apiRequest('POST', '/api/voice-rooms', roomData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-rooms'] });
      setShowCreateRoom(false);
      setNewRoomName("");
      toast({
        title: "Комната создана",
        description: "Голосовая комната успешно создана",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать голосовую комнату",
        variant: "destructive",
      });
    },
  });

  // Join voice room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest('POST', `/api/voice-rooms/${roomId}/join`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-rooms'] });
      setIsConnected(true);
      toast({
        title: "Подключен к комнате",
        description: "Вы успешно подключились к голосовой комнате",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к комнате",
        variant: "destructive",
      });
    },
  });

  // Leave voice room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest('POST', `/api/voice-rooms/${roomId}/leave`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-rooms'] });
      setIsConnected(false);
      setSelectedRoom(null);
      toast({
        title: "Покинули комнату",
        description: "Вы покинули голосовую комнату",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось покинуть комнату",
        variant: "destructive",
      });
    },
  });

  // Send voice invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: async ({ userId, roomId }: { userId: number; roomId: number }) => {
      const response = await apiRequest('POST', '/api/voice-rooms/invite', {
        userId,
        roomId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Приглашение отправлено",
        description: "Пользователь получил приглашение в голосовую комнату",
      });
      setShowInviteModal(null);
      setInviteQuery("");
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить приглашение",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    createRoomMutation.mutate({
      name: newRoomName.trim(),
      maxParticipants: 10
    });
  };

  const handleJoinRoom = (room: VoiceRoom) => {
    setSelectedRoom(room);
    joinRoomMutation.mutate(room.id);
  };

  const handleLeaveRoom = () => {
    if (selectedRoom) {
      leaveRoomMutation.mutate(selectedRoom.id);
    }
  };

  const handleInviteUser = (userId: number) => {
    if (showInviteModal) {
      sendInviteMutation.mutate({
        userId,
        roomId: showInviteModal.id
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Микрофон включен" : "Микрофон выключен",
      description: isMuted ? "Теперь вас слышно" : "Теперь вас не слышно",
    });
  };

  const getRoomStatusColor = (room: VoiceRoom) => {
    if (room.participants.length === 0) return 'bg-gray-500';
    if (room.participants.some(p => !p.isMuted)) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getRoomStatusText = (room: VoiceRoom) => {
    if (room.participants.length === 0) return 'Пусто';
    if (room.participants.some(p => !p.isMuted)) return 'Активный разговор';
    return 'Все отключены';
  };

  const isUserInRoom = (room: VoiceRoom) => {
    return room.participants.some(p => p.userId === user?.id);
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
              <Mic className="w-5 h-5 mr-2" style={{ color: 'var(--neo-green)' }} />
              <h3 className="text-lg font-semibold text-white">Голосовые комнаты</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateRoom(true)}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <Plus className="w-4 h-4" style={{ color: 'var(--neo-green)' }} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" style={{ color: 'var(--neo-text)' }} />
              </Button>
            </div>
          </div>

          {/* Connected Room Display */}
          {selectedRoom && isConnected && (
            <div className="p-4 border-b" style={{ borderColor: 'var(--neo-border)' }}>
              <div className="gradient-border">
                <div className="gradient-border-inner p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">{selectedRoom.name}</h4>
                    <Button
                      onClick={handleLeaveRoom}
                      variant="destructive"
                      size="sm"
                    >
                      <PhoneOff className="w-4 h-4 mr-1" />
                      Покинуть
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={toggleMute}
                      variant={isMuted ? "destructive" : "default"}
                      size="sm"
                      className="flex items-center"
                    >
                      {isMuted ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                      {isMuted ? "Включить микрофон" : "Выключить микрофон"}
                    </Button>
                    
                    <Button
                      onClick={() => setShowInviteModal(selectedRoom)}
                      variant="outline"
                      size="sm"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Пригласить
                    </Button>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Участники ({selectedRoom.participants.length}):
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRoom.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center space-x-1">
                          <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                            <span className="text-xs text-white">
                              {participant.user.username.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-white">{participant.user.username}</span>
                          {participant.isMuted ? (
                            <MicOff className="w-3 h-3 text-red-500" />
                          ) : (
                            <Volume2 className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto scrollbar-hidden">
            {voiceRooms.length === 0 ? (
              <div className="text-center py-8">
                <Mic className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--neo-text)' }} />
                <p style={{ color: 'var(--neo-text)' }}>Нет активных голосовых комнат</p>
                <Button
                  onClick={() => setShowCreateRoom(true)}
                  className="mt-4 gradient-bg text-white"
                >
                  Создать комнату
                </Button>
              </div>
            ) : (
              voiceRooms.map((room: VoiceRoom) => (
                <div key={room.id} className="gradient-border">
                  <div className="gradient-border-inner p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getRoomStatusColor(room)}`}></div>
                        <h4 className="font-medium text-white">{room.name}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isUserInRoom(room) ? (
                          <>
                            <Button
                              onClick={() => setShowInviteModal(room)}
                              variant="outline"
                              size="sm"
                            >
                              <UserPlus className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleJoinRoom(room)}
                              variant="default"
                              size="sm"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Войти
                            </Button>
                          </>
                        ) : (
                          <Badge variant="default">В комнате</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--neo-text)' }}>
                        {getRoomStatusText(room)}
                      </span>
                      <span style={{ color: 'var(--neo-text)' }}>
                        <Users className="w-4 h-4 inline mr-1" />
                        {room.participants.length}/{room.maxParticipants}
                      </span>
                    </div>

                    {room.participants.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {room.participants.slice(0, 3).map((participant) => (
                          <div key={participant.id} className="flex items-center space-x-1">
                            <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
                              <span className="text-xs text-white">
                                {participant.user.username.charAt(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {room.participants.length > 3 && (
                          <span className="text-xs" style={{ color: 'var(--neo-text)' }}>
                            +{room.participants.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Создать голосовую комнату</h3>
            <Input
              placeholder="Название комнаты"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || createRoomMutation.isPending}
                className="flex-1"
              >
                Создать
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateRoom(false);
                  setNewRoomName("");
                }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">
              Пригласить в комнату "{showInviteModal.name}"
            </h3>
            <Input
              placeholder="Поиск пользователей..."
              value={inviteQuery}
              onChange={(e) => setInviteQuery(e.target.value)}
              className="mb-4"
            />
            
            <div className="max-h-40 overflow-y-auto space-y-2">
              {searchResults.map((searchUser: any) => (
                <div key={searchUser.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">
                        {searchUser.username.charAt(0)}
                      </span>
                    </div>
                    <span>{searchUser.username}</span>
                  </div>
                  <Button
                    onClick={() => handleInviteUser(searchUser.id)}
                    size="sm"
                  >
                    Пригласить
                  </Button>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(null);
                setInviteQuery("");
              }}
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
