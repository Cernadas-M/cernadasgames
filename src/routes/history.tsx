import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, CalendarDays, ArrowRight, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { SectionHeader } from "@/components/game-grid";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/history")({ component: HistoryPage });

interface HistoryEntry {
  id: string;
  game_id: string;
  played_at: string;
  ended_at: string | null;
  game: Game;
}

function formatDateTime(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  const day = d.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { day, time };
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "En progreso";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const diff = Math.max(0, Math.round((e - s) / 1000));
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const { day, time: startTime } = formatDateTime(entry.played_at);
  const end = entry.ended_at ? formatDateTime(entry.ended_at).time : null;
  const duration = formatDuration(entry.played_at, entry.ended_at);

  return (
    <Link
      to="/game/$slug"
      params={{ slug: entry.game.slug }}
      className="group flex flex-col sm:flex-row items-stretch gap-4 p-4 rounded-2xl bg-surface border border-border/60 hover:border-primary/40 transition-colors"
    >
      <div className="shrink-0 w-full sm:w-48 aspect-[4/3] rounded-xl overflow-hidden relative bg-black">
        {entry.game.thumbnail_url ? (
          <img
            src={entry.game.thumbnail_url}
            alt={entry.game.title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-card grid place-items-center">
            <Play className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
        <h3 className="text-base font-semibold truncate group-hover:text-primary transition-colors mb-3">
          {entry.game.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary" />
            {day}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 text-primary" />
            <span className="font-medium text-foreground">{startTime}</span>
            {end && (
              <>
                <ArrowRight className="size-3" />
                <span className="font-medium text-foreground">{end}</span>
              </>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-muted">
            <Clock className="size-3" />
            {duration}
          </span>
        </div>
      </div>
    </Link>
  );
}

function HistoryPage() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: hist } = await supabase
        .from("play_history")
        .select("id, game_id, played_at, ended_at")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(100);

      if (!hist || hist.length === 0) {
        setEntries([]);
        setLoaded(true);
        return;
      }

      const gameIds = [...new Set(hist.map((h) => h.game_id))];
      const { data: gs } = await supabase
        .from("games")
        .select("*")
        .in("id", gameIds)
        .eq("is_active", true);

      const gameMap = new Map<string, Game>();
      for (const g of (gs ?? []) as Game[]) gameMap.set(g.id, g);

      const full: HistoryEntry[] = [];
      for (const h of hist) {
        const game = gameMap.get(h.game_id);
        if (game) {
          full.push({
            id: h.id,
            game_id: h.game_id,
            played_at: h.played_at,
            ended_at: h.ended_at,
            game,
          });
        }
      }
      setEntries(full);
      setLoaded(true);
    })();
  }, [user]);

  return (
    <AppLayout>
      <SectionHeader title="Historial" />
      {!user && !loading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Inicia sesión para ver tu historial.
          </p>
          <Button asChild>
            <Link to="/auth" search={{ mode: "login" }}>Iniciar sesión</Link>
          </Button>
        </div>
      ) : loaded && entries.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Aún no has jugado a ningún juego.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
