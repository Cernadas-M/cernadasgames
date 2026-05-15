import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/new")({ component: NewPage });

function NewPage() {
  const [games, setGames] = useState<Game[]>([]);
  useEffect(() => {
    void supabase.from("games").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(60)
      .then(({ data }) => setGames((data ?? []) as Game[]));
  }, []);
  return (
    <AppLayout>
      <SectionHeader title="✨ Nuevos juegos" />
      <GameGrid games={games} />
    </AppLayout>
  );
}
