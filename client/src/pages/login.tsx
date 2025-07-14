import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const { login, register, isLoginLoading, isRegisterLoading } = useAuth();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData);
      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно вошли в NeoGram",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Неверный email или пароль",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(registerData);
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в NeoGram",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Пользователь уже существует",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--neo-dark)' }}>
      <div className="gradient-border w-full max-w-sm">
        <div className="gradient-border-inner p-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 gradient-bg">
              <span className="text-2xl font-bold text-white">&lt;/&gt;</span>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--neo-green)' }}>NeoGram</h1>
            <p className="text-sm" style={{ color: 'var(--neo-text)' }}>Мессенджер будущего</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6" style={{ background: 'var(--neo-surface)' }}>
              <TabsTrigger value="login" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
                Вход
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
                Регистрация
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--neo-green)' }}>
                  Вход в систему
                </h2>
                <div>
                  <Label htmlFor="identifier" className="text-white">
                    Email или Username
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="neo@matrix.com или Neo"
                    value={loginData.identifier}
                    onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                    className="mt-2"
                    style={{ 
                      background: 'var(--neo-surface)',
                      border: '1px solid var(--neo-border)',
                      color: 'white'
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-white">
                    Пароль
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Введите пароль"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="mt-2"
                    style={{ 
                      background: 'var(--neo-surface)',
                      border: '1px solid var(--neo-border)',
                      color: 'white'
                    }}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-bg text-white font-medium"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? "Входим..." : "Войти"}
                </Button>
                <p className="text-xs text-center mt-4" style={{ color: 'var(--neo-text)' }}>
                  Демо: neo@matrix.com / matrix123
                </p>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--neo-green)' }}>
                  Регистрация
                </h2>
                <div>
                  <Label htmlFor="username" className="text-white">
                    Имя пользователя
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Neo"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className="mt-2"
                    style={{ 
                      background: 'var(--neo-surface)',
                      border: '1px solid var(--neo-border)',
                      color: 'white'
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="neo@matrix.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="mt-2"
                    style={{ 
                      background: 'var(--neo-surface)',
                      border: '1px solid var(--neo-border)',
                      color: 'white'
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registerPassword" className="text-white">
                    Пароль
                  </Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="Введите пароль"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="mt-2"
                    style={{ 
                      background: 'var(--neo-surface)',
                      border: '1px solid var(--neo-border)',
                      color: 'white'
                    }}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-bg text-white font-medium"
                  disabled={isRegisterLoading}
                >
                  {isRegisterLoading ? "Регистрируем..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
