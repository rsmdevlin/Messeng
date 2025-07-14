import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BarChart3, 
  Trash2, 
  Crown, 
  UserX, 
  Search,
  Shield,
  MessageSquare
} from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  isOnline: boolean;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeChats: number;
  totalGroups: number;
  activeVoiceRooms: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Fetch admin data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Роль обновлена",
        description: "Роль пользователя успешно изменена",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить роль пользователя",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Пользователь удален",
        description: "Пользователь успешно удален из системы",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((u: User) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите пользователей для выполнения действия",
        variant: "destructive",
      });
      return;
    }

    if (action === 'delete') {
      if (window.confirm(`Вы уверены, что хотите удалить ${selectedUsers.length} пользователей?`)) {
        selectedUsers.forEach(userId => {
          deleteUserMutation.mutate(userId);
        });
        setSelectedUsers([]);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Админ панель</h2>
        <p style={{ color: 'var(--neo-text)' }}>
          Управление пользователями и системой
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="gradient-border">
          <div className="gradient-border-inner p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--neo-green)' }} />
            <h3 className="text-2xl font-bold text-white">
              {statsLoading ? '...' : stats?.totalUsers || 0}
            </h3>
            <p style={{ color: 'var(--neo-text)' }}>Пользователей</p>
          </div>
        </div>

        <div className="gradient-border">
          <div className="gradient-border-inner p-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--neo-blue)' }} />
            <h3 className="text-2xl font-bold text-white">
              {statsLoading ? '...' : stats?.activeChats || 0}
            </h3>
            <p style={{ color: 'var(--neo-text)' }}>Активных чатов</p>
          </div>
        </div>

        <div className="gradient-border">
          <div className="gradient-border-inner p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--neo-purple)' }} />
            <h3 className="text-2xl font-bold text-white">
              {statsLoading ? '...' : stats?.totalGroups || 0}
            </h3>
            <p style={{ color: 'var(--neo-text)' }}>Групп</p>
          </div>
        </div>

        <div className="gradient-border">
          <div className="gradient-border-inner p-4 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--neo-orange)' }} />
            <h3 className="text-2xl font-bold text-white">
              {statsLoading ? '...' : stats?.activeVoiceRooms || 0}
            </h3>
            <p style={{ color: 'var(--neo-text)' }}>Голосовых комнат</p>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="gradient-border">
        <div className="gradient-border-inner p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Управление пользователями</h3>
            {selectedUsers.length > 0 && (
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Удалить ({selectedUsers.length})
                </Button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--neo-text)' }} />
              <Input
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--neo-border)' }}>
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map((u: User) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    />
                  </th>
                  <th className="text-left p-2 text-white">Пользователь</th>
                  <th className="text-left p-2 text-white">Email</th>
                  <th className="text-left p-2 text-white">Роль</th>
                  <th className="text-left p-2 text-white">Статус</th>
                  <th className="text-left p-2 text-white">Регистрация</th>
                  <th className="text-left p-2 text-white">Действия</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-4 text-white">
                      Загрузка...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-4" style={{ color: 'var(--neo-text)' }}>
                      Пользователи не найдены
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userItem: User) => (
                    <tr key={userItem.id} className="border-b hover:bg-white/5" style={{ borderColor: 'var(--neo-border)' }}>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userItem.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, userItem.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== userItem.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center mr-2">
                            <span className="text-white text-sm font-bold">
                              {userItem.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white">{userItem.username}</span>
                        </div>
                      </td>
                      <td className="p-2 text-white">{userItem.email}</td>
                      <td className="p-2">
                        <select
                          value={userItem.role}
                          onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                          disabled={userItem.id === user?.id}
                        >
                          <option value="user">Пользователь</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <Badge variant={userItem.isOnline ? "default" : "secondary"}>
                          {userItem.isOnline ? "Онлайн" : "Оффлайн"}
                        </Badge>
                      </td>
                      <td className="p-2" style={{ color: 'var(--neo-text)' }}>
                        {formatDate(userItem.createdAt)}
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(userItem.id, userItem.role === 'admin' ? 'user' : 'admin')}
                            disabled={userItem.id === user?.id}
                          >
                            <Crown className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(userItem.id)}
                            disabled={userItem.id === user?.id}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}