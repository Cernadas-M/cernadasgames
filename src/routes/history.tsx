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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: hist } = await supabase
        .from("play_history")
        .select("game_id, played_at")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(100);

      const ids: string[] = [];
      for (const r of hist ?? []) {
        if (r.game_id && !ids.includes(r.game_id)) ids.push(r.game_id);
        if (ids.length >= 50) break;
      }

      if (ids.length === 0) { setGames([]); setLoaded(true); return; }

      const { data: gs } = await supabase
        .from("games")
        .select("*")
        .in("id", ids)
        .eq("is_active", true);

      const map = new Map<string, Game>();
      for (const g of (gs ?? []) as Game[]) map.set(g.id, g);
      const ordered = ids.map((id) => map.get(id)).filter((g): g is Game => !!g);
      setGames(ordered);
      setLoaded(true);
    })();
  }, [user]);

  return (
    <AppLayout>
      <SectionHeader title="Historial" />
      {!user && !loading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Inicia sesión para ver tu historial.</p>
          <Button asChild><Link to="/auth">Iniciar sesión</Link></Button>
        </div>
      ) : loaded && games.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Aún no has jugado a ningún juego.
        </div>
      ) : (
        <GameGrid games={games} />
      )}
    </AppLayout>
  );
}
