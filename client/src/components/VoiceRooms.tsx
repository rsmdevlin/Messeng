import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Mic, 
  MicOff, 
  X, 
  Users, 
  Volume2, 
  VolumeX,
  Plus,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

interface VoiceRoom {
  id: number;
  name: string;
  maxParticipants: number;
  isActive: boolean;
  createdBy: number;
  participants: Array<{
    id: number;
    userId: number;
    isMuted: boolean;
    user: {
      id: number;
      username: string;
      avatar: string;
    };
  }>;
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

  // Fetch voice rooms
  const { data: voiceRooms = [] } = useQuery({
    queryKey: ['/api/voice-rooms'],
    refetchInterval: 3000,
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
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать комнату",
        variant: "destructive",
      });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest('POST', `/api/voice-rooms/${roomId}/join`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-rooms'] });
      toast({
        title: "Подключение успешно",
        description: "Вы подключились к голосовой комнате",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к комнате",
        variant: "destructive",
      });
    },
  });

  // Leave room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest('POST', `/api/voice-rooms/${roomId}/leave`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-rooms'] });
      toast({
        title: "Отключение успешно",
        description: "Вы покинули голосовую комнату",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось покинуть комнату",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    createRoomMutation.mutate({
      name: newRoomName.trim(),
      maxParticipants: 10,
    });
  };

  const handleJoinRoom = (roomId: number) => {
    joinRoomMutation.mutate(roomId);
  };

  const handleLeaveRoom = (roomId: number) => {
    leaveRoomMutation.mutate(roomId);
  };

  const isUserInRoom = (room: VoiceRoom) => {
    return room.participants.some(p => p.userId === user?.id);
  };

  const getRoomStatusColor = (room: VoiceRoom) => {
    if (room.participants.length === 0) return 'bg-gray-500';
    if (room.participants.some(p => !p.isMuted)) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getRoomStatusText = (room: VoiceRoom) => {
    if (room.participants.length === 0) return 'Пусто';
    if (room.participants.some(p => !p.isMuted)) return 'Активный разговор';
    return 'Все отключены';
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRoom(room)}
                        className="p-1 rounded-full hover:bg-white/10"
                      >
                        <Settings className="w-4 h-4" style={{ color: 'var(--neo-text)' }} />
                      </Button>
                    </div>
                    
                    <p className="text-sm mb-3" style={{ color: 'var(--neo-text)' }}>
                      {room.participants.length} участник{room.participants.length !== 1 ? 'а' : ''} • {getRoomStatusText(room)}
                    </p>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      {room.participants.slice(0, 4).map((participant) => (
                        <div key={participant.id} className="relative">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-bg">
                            <span className="text-white text-xs font-bold">
                              {participant.user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {participant.isMuted && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <MicOff className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                      {room.participants.length > 4 && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--neo-border)' }}>
                          <span className="text-white text-xs">+{room.participants.length - 4}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => isUserInRoom(room) ? handleLeaveRoom(room.id) : handleJoinRoom(room.id)}
                      disabled={joinRoomMutation.isPending || leaveRoomMutation.isPending}
                      className={`w-full font-medium ${
                        isUserInRoom(room) 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'gradient-bg text-white hover:opacity-90'
                      }`}
                    >
                      {isUserInRoom(room) ? 'Покинуть' : 'Присоединиться'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent className="w-full max-w-md" style={{ 
          background: 'var(--neo-surface)', 
          border: '1px solid var(--neo-border)' 
        }}>
          <DialogHeader>
            <DialogTitle className="text-white">Создать голосовую комнату</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomName" className="text-white">Название комнаты</Label>
              <Input
                id="roomName"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Введите название..."
                className="mt-2"
                style={{ 
                  background: 'var(--neo-border)',
                  border: '1px solid var(--neo-border)',
                  color: 'white'
                }}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateRoom(false)}
                className="flex-1"
                style={{ borderColor: 'var(--neo-border)', color: 'white' }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || createRoomMutation.isPending}
                className="flex-1 gradient-bg text-white"
              >
                {createRoomMutation.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Details Modal */}
      {selectedRoom && (
        <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
          <DialogContent className="w-full max-w-md" style={{ 
            background: 'var(--neo-surface)', 
            border: '1px solid var(--neo-border)' 
          }}>
            <DialogHeader>
              <DialogTitle className="text-white">{selectedRoom.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-sm" style={{ color: 'var(--neo-text)' }}>
                Участники: {selectedRoom.participants.length}/{selectedRoom.maxParticipants}
              </div>
              
              <div className="space-y-2">
                {selectedRoom.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--neo-border)' }}>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-bg mr-3">
                        <span className="text-white text-xs font-bold">
                          {participant.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white">{participant.user.username}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {participant.isMuted ? (
                        <MicOff className="w-4 h-4 text-red-500" />
                      ) : (
                        <Mic className="w-4 h-4 text-green-500" />
                      )}
                      <Volume2 className="w-4 h-4" style={{ color: 'var(--neo-text)' }} />
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedRoom.participants.length === 0 && (
                <div className="text-center py-4" style={{ color: 'var(--neo-text)' }}>
                  Комната пуста
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
