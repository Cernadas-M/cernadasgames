import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/all")({ component: AllGamesPage });

function AllGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  useEffect(() => {
    void supabase
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("views_count", { ascending: false })
      .then(({ data }) => setGames((data ?? []) as Game[]));
  }, []);
  return (
    <AppLayout>
      <SectionHeader title="Todos los juegos" />
      <GameGrid games={games} dense />
    </AppLayout>
  );
}
