import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  RefreshCw,
  Server,
  Database,
  Activity,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle
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

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Fetch admin data
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
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
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить роль",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Пользователь удален",
        description: "Пользователь успешно удален из системы",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      });
    },
  });

  // Filter users
  const filteredUsers = users.filter((u: User) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'moderator':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string, isOnline: boolean) => {
    if (!isOnline) return 'bg-gray-500';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6" style={{ background: 'var(--neo-surface)' }}>
          <TabsTrigger value="users" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Управление пользователями
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-white">Поиск</Label>
                  <Input
                    id="search"
                    placeholder="Поиск по имени или email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                    style={{ 
                      background: 'var(--neo-border)',
                      border: '1px solid var(--neo-border)',
                      color: 'white'
                    }}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Label className="text-white">Роль</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="mt-1" style={{ 
                      background: 'var(--neo-border)',
                      border: '1px solid var(--neo-border)',
                      color: 'white'
                    }}>
                      <SelectValue placeholder="Все роли" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все роли</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="moderator">Модератор</SelectItem>
                      <SelectItem value="user">Пользователь</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.map((u: User) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{ background: 'var(--neo-border)' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-bg">
                          <span className="text-white font-bold">
                            {u.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(u.status, u.isOnline)}`}></div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-white">{u.username}</h4>
                          <span className={`px-2 py-1 text-xs rounded ${getRoleColor(u.role)} text-white`}>
                            {u.role === 'admin' ? 'АДМИН' : u.role === 'moderator' ? 'МОДЕР' : 'ПОЛЬЗОВАТЕЛЬ'}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--neo-text)' }}>{u.email}</p>
                        <p className="text-xs" style={{ color: 'var(--neo-text)' }}>
                          Регистрация: {formatDate(u.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value)}
                        disabled={u.id === user?.id}
                      >
                        <SelectTrigger className="w-32" style={{ 
                          background: 'var(--neo-surface)',
                          border: '1px solid var(--neo-border)',
                          color: 'white'
                        }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Пользователь</SelectItem>
                          <SelectItem value="moderator">Модератор</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === user?.id}
                        className="p-2 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--neo-text)' }} />
                  <p style={{ color: 'var(--neo-text)' }}>Пользователи не найдены</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Настройки системы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Регистрация новых пользователей</Label>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Разрешить создание новых аккаунтов
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Создание групп</Label>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Разрешить пользователям создавать группы
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Голосовые комнаты</Label>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Включить функцию голосовых комнат
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Модерация сообщений</Label>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Включить автоматическую модерацию
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  Действия системы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт данных
                </Button>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Резервное копирование
                </Button>
                
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  <Database className="w-4 h-4 mr-2" />
                  Очистить логи
                </Button>
                
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Перезагрузить сервер
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>Всего пользователей</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--neo-green)' }}>
                      {stats?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8" style={{ color: 'var(--neo-green)' }} />
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>Активных чатов</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--neo-blue)' }}>
                      {stats?.activeChats || 0}
                    </p>
                  </div>
                  <Activity className="w-8 h-8" style={{ color: 'var(--neo-blue)' }} />
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>Групп</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {stats?.totalGroups || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>Голосовых комнат</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {stats?.activeVoiceRooms || 0}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Системная информация
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--neo-border)' }}>
                    <span className="text-white">Статус сервера</span>
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Онлайн</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--neo-border)' }}>
                    <span className="text-white">База данных</span>
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Подключена</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--neo-border)' }}>
                    <span className="text-white">WebSocket</span>
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Активен</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--neo-border)' }}>
                    <span className="text-white">Использование памяти</span>
                    <span style={{ color: 'var(--neo-text)' }}>45%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--neo-border)' }}>
                    <span className="text-white">Загрузка CPU</span>
                    <span style={{ color: 'var(--neo-text)' }}>23%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--neo-border)' }}>
                    <span className="text-white">Время работы</span>
                    <span style={{ color: 'var(--neo-text)' }}>2д 14ч</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
