
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Phone, 
  MessageSquare,
  Moon,
  Sun,
  Save,
  Users,
  BarChart3,
  Crown
} from "lucide-react";
import AdminPanel from "./AdminPanel";

export default function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    allowChatInvites: true,
    allowVoiceInvites: true,
    showOnlineStatus: true,
    soundNotifications: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    allowDirectMessages: true,
    allowGroupInvites: true,
    showLastSeen: true,
  });

  const [theme, setTheme] = useState(user?.theme || "matrix");

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || 
    ['Roman', 'basacapone@gmail.com', 'Sosihui228'].includes(user?.username || '') ||
    ['Roman', 'basacapone@gmail.com', 'Sosihui228'].includes(user?.email || '');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', '/api/users/profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const tabs = [
    { id: "profile", label: "Профиль", icon: User },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "privacy", label: "Приватность", icon: Shield },
    { id: "appearance", label: "Внешний вид", icon: Moon },
    ...(isAdmin ? [{ id: "admin", label: "Админ панель", icon: Crown }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-4xl h-[80vh] rounded-xl flex overflow-hidden"
        style={{ background: 'var(--neo-surface)', border: '1px solid var(--neo-border)' }}
      >
        {/* Sidebar */}
        <div className="w-64 border-r" style={{ borderColor: 'var(--neo-border)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--neo-border)' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-white">{user?.username}</h3>
                <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id 
                      ? 'gradient-bg text-white' 
                      : 'hover:bg-white/5 text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-auto p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Выйти
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "profile" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Профиль</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Имя пользователя
                  </label>
                  <Input
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    placeholder="Введите имя пользователя"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Имя
                    </label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      placeholder="Введите имя"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Фамилия
                    </label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      placeholder="Введите фамилию"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <Input
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="Введите email"
                    type="email"
                  />
                </div>

                <Button onClick={handleSaveProfile} className="gradient-bg text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Уведомления</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Приглашения в чаты</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Разрешить другим приглашать вас в чаты
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.allowChatInvites}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, allowChatInvites: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Приглашения в голосовые каналы</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Разрешить другим приглашать вас в голосовые каналы
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.allowVoiceInvites}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, allowVoiceInvites: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Показывать статус онлайн</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Другие пользователи смогут видеть, что вы в сети
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.showOnlineStatus}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, showOnlineStatus: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Звуковые уведомления</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Воспроизводить звук при получении сообщений
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.soundNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, soundNotifications: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Приватность</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Личные сообщения</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Разрешить другим писать вам личные сообщения
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.allowDirectMessages}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({ ...privacySettings, allowDirectMessages: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Приглашения в группы</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Разрешить добавлять вас в групповые чаты
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.allowGroupInvites}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({ ...privacySettings, allowGroupInvites: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Время последнего посещения</h3>
                    <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                      Показывать другим, когда вы были в сети последний раз
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.showLastSeen}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({ ...privacySettings, showLastSeen: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Внешний вид</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-white mb-4">Тема</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme("matrix")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        theme === "matrix" 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="w-full h-8 gradient-bg rounded mb-2"></div>
                      <p className="text-white font-medium">Matrix</p>
                    </button>
                    
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        theme === "dark" 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
                      <p className="text-white font-medium">Темная</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "admin" && isAdmin && (
            <div className="h-full">
              <AdminPanel />
            </div>
          )}
        </div>

        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 rounded-full"
        >
          ×
        </Button>
      </div>
    </div>
  );
}
