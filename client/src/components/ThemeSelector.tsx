import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Palette, X, Check } from "lucide-react";

interface ThemeSelectorProps {
  onClose: () => void;
}

const themes = [
  {
    id: 'matrix',
    name: 'Матрица',
    description: 'Классическая зелено-синяя тема',
    colors: ['#00D26A', '#007AFF', '#004C2F'],
    isDefault: true,
  },
  {
    id: 'fire',
    name: 'Огонь',
    description: 'Теплые красно-оранжевые тона',
    colors: ['#FF4757', '#FF6B35', '#8B0000'],
  },
  {
    id: 'ocean',
    name: 'Океан',
    description: 'Глубокие синие оттенки',
    colors: ['#007AFF', '#4FC3F7', '#1565C0'],
  },
  {
    id: 'forest',
    name: 'Лес',
    description: 'Естественные зеленые тона',
    colors: ['#4CAF50', '#66BB6A', '#1B5E20'],
  },
  {
    id: 'sunset',
    name: 'Закат',
    description: 'Теплые оранжево-желтые оттенки',
    colors: ['#FF9800', '#FFB74D', '#E65100'],
  },
  {
    id: 'cyber',
    name: 'Киберпанк',
    description: 'Неоновые фиолетово-розовые тона',
    colors: ['#E91E63', '#9C27B0', '#673AB7'],
  },
];

export default function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTheme, setSelectedTheme] = useState(user?.theme || 'matrix');

  const updateThemeMutation = useMutation({
    mutationFn: async (theme: string) => {
      const response = await apiRequest('PATCH', '/api/users/profile', { theme });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      toast({
        title: "Тема изменена",
        description: `Активирована тема "${themes.find(t => t.id === selectedTheme)?.name}"`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить тему",
        variant: "destructive",
      });
    },
  });

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleApplyTheme = () => {
    updateThemeMutation.mutate(selectedTheme);
  };

  const applyThemePreview = (theme: any) => {
    const root = document.documentElement;
    const [color1, color2, color3] = theme.colors;
    
    // Convert hex to HSL for CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      const sum = max + min;
      const l = sum / 2;
      
      let h, s;
      if (diff === 0) {
        h = s = 0;
      } else {
        s = l > 0.5 ? diff / (2 - sum) : diff / sum;
        switch (max) {
          case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
          case g: h = (b - r) / diff + 2; break;
          case b: h = (r - g) / diff + 4; break;
          default: h = 0;
        }
        h /= 6;
      }
      
      return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
    };
    
    // Apply preview colors
    root.style.setProperty('--neo-green', `hsl(${hexToHsl(color1)})`);
    root.style.setProperty('--neo-blue', `hsl(${hexToHsl(color2)})`);
    root.style.setProperty('--primary', `hsl(${hexToHsl(color1)})`);
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
              <Palette className="w-5 h-5 mr-2" style={{ color: 'var(--neo-green)' }} />
              <h3 className="text-lg font-semibold text-white">Выбор темы</h3>
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  onMouseEnter={() => applyThemePreview(theme)}
                  className={`relative p-4 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedTheme === theme.id 
                      ? 'border-green-500' 
                      : 'border-transparent hover:border-gray-600'
                  }`}
                  style={{ background: 'var(--neo-border)' }}
                >
                  {/* Theme Preview */}
                  <div 
                    className="h-16 rounded-lg mb-3 theme-card"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 50%, ${theme.colors[2]} 100%)`
                    }}
                  ></div>
                  
                  <h4 className="text-white font-medium text-center mb-1">{theme.name}</h4>
                  <p className="text-xs text-center" style={{ color: 'var(--neo-text)' }}>
                    {theme.description}
                  </p>
                  
                  {/* Selected indicator */}
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Default badge */}
                  {theme.isDefault && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 rounded text-xs text-white">
                      По умолчанию
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Theme Info */}
            <div className="p-3 rounded-lg mb-4" style={{ background: 'var(--neo-border)' }}>
              <h5 className="text-white font-medium mb-2">
                {themes.find(t => t.id === selectedTheme)?.name}
              </h5>
              <p className="text-sm" style={{ color: 'var(--neo-text)' }}>
                {themes.find(t => t.id === selectedTheme)?.description}
              </p>
              
              {/* Color palette */}
              <div className="flex items-center space-x-2 mt-3">
                <span className="text-sm" style={{ color: 'var(--neo-text)' }}>Цвета:</span>
                {themes.find(t => t.id === selectedTheme)?.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Apply Button */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                style={{ borderColor: 'var(--neo-border)', color: 'white' }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleApplyTheme}
                disabled={updateThemeMutation.isPending || selectedTheme === user?.theme}
                className="flex-1 gradient-bg text-white"
              >
                {updateThemeMutation.isPending ? 'Применение...' : 'Применить'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
