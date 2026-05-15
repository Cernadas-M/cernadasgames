import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!q) return;
    void supabase
      .from("games")
      .select("*")
      .eq("is_active", true)
      .ilike("title", `%${q}%`)
      .limit(50)
      .then(({ data }) => setGames((data ?? []) as Game[]));
  }, [q]);

  return (
    <AppLayout>
      <SectionHeader title={`Resultados: "${q}"`} />
      <GameGrid games={games} />
    </AppLayout>
  );
}
