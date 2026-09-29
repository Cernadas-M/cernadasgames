import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/favorites")({ component: FavoritesPage });

function FavoritesPage() {
  const { user, loading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("favorites")
      .select("game_id, games(*)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setGames(((data ?? []).map((r) => r.games).filter(Boolean) as unknown) as Game[]);
      });
  }, [user]);

  return (
    <AppLayout>
      <SectionHeader title="Guardados" />
      {!user && !loading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Inicia sesión para ver tus favoritos.</p>
          <Button asChild><Link to="/auth" search={{ mode: "login" }}>Iniciar sesión</Link></Button>
        </div>
      ) : (
        <GameGrid games={games} />
      )}
    </AppLayout>
  );
}
