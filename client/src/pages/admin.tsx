import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminPanel from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || 
    ['Roman', 'basacapone@gmail.com', 'Sosihui228'].includes(user?.username || '') ||
    ['Roman', 'basacapone@gmail.com', 'Sosihui228'].includes(user?.email || '');

  useEffect(() => {
    if (!isAdmin) {
      setLocation('/');
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав администратора",
        variant: "destructive",
      });
    }
  }, [isAdmin, setLocation, toast]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto" style={{ background: 'var(--neo-dark)' }}>
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="mr-3 p-2 rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-white mr-2" />
            <h1 className="text-xl font-bold text-white">Админ-панель</h1>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="text-right mr-3">
            <p className="text-white font-medium">{user?.username}</p>
            <p className="text-white/70 text-sm">Администратор</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-bg">
            <span className="text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Panel */}
      <AdminPanel />
    </div>
  );
}
