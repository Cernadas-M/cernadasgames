import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const { user, loading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("play_history")
      .select("played_at, games(*)")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const seen = new Set<string>();
        const unique: Game[] = [];
        for (const r of data ?? []) {
          const g = r.games as unknown as Game | null;
          if (g && !seen.has(g.id)) { seen.add(g.id); unique.push(g); }
        }
        setGames(unique);
      });
  }, [user]);

  return (
    <AppLayout>
      <SectionHeader title="Historial" />
      {!user && !loading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Inicia sesión para ver tu historial.</p>
          <Button asChild><Link to="/auth">Iniciar sesión</Link></Button>
        </div>
      ) : (
        <GameGrid games={games} />
      )}
    </AppLayout>
  );
}
