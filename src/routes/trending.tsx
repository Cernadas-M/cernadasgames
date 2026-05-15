import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/trending")({ component: TrendingPage });

function TrendingPage() {
  const [games, setGames] = useState<Game[]>([]);
  useEffect(() => {
    void supabase.from("games").select("*").eq("is_active", true).eq("is_trending", true).order("views_count", { ascending: false })
      .then(({ data }) => setGames((data ?? []) as Game[]));
  }, []);
  return (
    <AppLayout>
      <SectionHeader title="🔥 Trending" />
      <GameGrid games={games} />
    </AppLayout>
  );
}
