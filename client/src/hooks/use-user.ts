import { useQuery, useQueryClient } from "@tanstack/react-query";

export type AuthUser = {
  id: string;
  username: string;
  hunterId: string | null;
  avatar: string | null;
  youtubeUrl: string | null;
  discordTag: string | null;
};

export function useUser() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    retry: false,
    staleTime: Infinity,
  });

  return { user: user ?? null, isLoading };
}

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    await fetch("/api/logout", { method: "POST" });
    queryClient.setQueryData(["/api/me"], null);
    queryClient.invalidateQueries({ queryKey: ["hunts"] });
  };
}
