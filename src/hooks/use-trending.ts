import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trendingQuery } from "@/lib/trending";
import type { Game } from "@/lib/types";

export function useTrending() {
  return useQuery({
    queryKey: ["automatic-trending"],
    queryFn: async () => {
      const { data, error } = await trendingQuery(supabase.from("games").select("*"));
      if (error) throw error;
      return (data ?? []) as Game[];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}