import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/authUtils";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!getAuthToken(),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ identifier, password }: { identifier: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { identifier, password });
      return response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.sessionId);
      queryClient.setQueryData(["/api/auth/user"], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, email, password }: { username: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", { username, email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.sessionId);
      queryClient.setQueryData(["/api/auth/user"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      removeAuthToken();
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  };
}
