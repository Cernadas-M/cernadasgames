import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import type { Category, Game } from "@/lib/types";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<Category | null>(null);
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    void (async () => {
      const { data: c } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      if (!c) return;
      setCat(c as Category);
      const { data: g } = await supabase.from("games").select("*").eq("is_active", true).eq("category_id", (c as Category).id).order("views_count", { ascending: false });
      setGames((g ?? []) as Game[]);
    })();
  }, [slug]);

  return (
    <AppLayout>
      <SectionHeader title={cat?.name ?? "Categoría"} />
      <GameGrid games={games} />
    </AppLayout>
  );
}
