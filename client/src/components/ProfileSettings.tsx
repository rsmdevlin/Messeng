import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, X, Save, User, Palette } from "lucide-react";

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    username: user?.username || '',
    email: user?.email || '',
    status: user?.status || 'online',
    theme: user?.theme || 'matrix',
    avatar: user?.avatar || 'default',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PATCH', '/api/users/profile', updates);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      toast({
        title: "Профиль обновлен",
        description: "Ваши настройки сохранены",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(settings);
  };

  const avatarOptions = [
    { value: 'default', label: 'По умолчанию', color: 'bg-blue-500' },
    { value: 'green', label: 'Зеленый', color: 'bg-green-500' },
    { value: 'purple', label: 'Фиолетовый', color: 'bg-purple-500' },
    { value: 'orange', label: 'Оранжевый', color: 'bg-orange-500' },
    { value: 'red', label: 'Красный', color: 'bg-red-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 modal-backdrop">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md rounded-xl" style={{ 
          background: 'var(--neo-surface)', 
          border: '1px solid var(--neo-border)' 
        }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--neo-border)' }}>
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-2" style={{ color: 'var(--neo-green)' }} />
              <h3 className="text-lg font-semibold text-white">Настройки профиля</h3>
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
          
          <div className="p-4 space-y-6 max-h-96 overflow-y-auto scrollbar-hidden">
            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-white">Имя пользователя</Label>
                <Input
                  id="username"
                  value={settings.username}
                  onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                  className="mt-2"
                  style={{ 
                    background: 'var(--neo-border)',
                    border: '1px solid var(--neo-border)',
                    color: 'white'
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="mt-2"
                  style={{ 
                    background: 'var(--neo-border)',
                    border: '1px solid var(--neo-border)',
                    color: 'white'
                  }}
                />
              </div>
            </div>
            
            {/* Status */}
            <div>
              <Label className="text-white font-medium">Статус</Label>
              <Select value={settings.status} onValueChange={(value) => setSettings({ ...settings, status: value })}>
                <SelectTrigger className="mt-2" style={{ 
                  background: 'var(--neo-border)',
                  border: '1px solid var(--neo-border)',
                  color: 'white'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">🟢 В сети</SelectItem>
                  <SelectItem value="away">🟡 Отошёл</SelectItem>
                  <SelectItem value="busy">🔴 Занят</SelectItem>
                  <SelectItem value="offline">⚫ Не в сети</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Theme */}
            <div>
              <Label className="text-white font-medium">Тема</Label>
              <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
                <SelectTrigger className="mt-2" style={{ 
                  background: 'var(--neo-border)',
                  border: '1px solid var(--neo-border)',
                  color: 'white'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matrix">Матрица</SelectItem>
                  <SelectItem value="fire">Огонь</SelectItem>
                  <SelectItem value="ocean">Океан</SelectItem>
                  <SelectItem value="forest">Лес</SelectItem>
                  <SelectItem value="sunset">Закат</SelectItem>
                  <SelectItem value="cyber">Киберпанк</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Avatar */}
            <div>
              <Label className="text-white font-medium mb-3 block">Аватар</Label>
              <div className="flex items-center space-x-3">
                {avatarOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, avatar: option.value })}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${option.color} ${
                      settings.avatar === option.value ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    <User className="w-5 h-5 text-white" />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Auto Login */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Автоматический вход</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Checkbox defaultChecked className="border-white" />
                  <span className="text-white text-sm">Автоматический вход при следующем посещении</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox defaultChecked className="border-white" />
                  <span className="text-white text-sm">Запомнить меня</span>
                </label>
              </div>
            </div>
            
            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="w-full gradient-bg text-white font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
