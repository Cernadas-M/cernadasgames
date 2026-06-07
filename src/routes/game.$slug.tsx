import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Bookmark, Eye, Maximize, Play, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/game/$slug")({
  component: GamePage,
});

function GamePage() {
  const { slug } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const { intro_logo_url, intro_duration_ms } = useSiteSettings();
  const [game, setGame] = useState<Game | null>(null);
  const [related, setRelated] = useState<Game[]>([]);
  const [playing, setPlaying] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [playHistoryId, setPlayHistoryId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("games").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (!data) return;
      const g = data as Game;
      setGame(g);
      void supabase.rpc("increment_game_views", { _game_id: g.id });
      const { data: rel } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .eq("category_id", g.category_id ?? "")
        .neq("id", g.id)
        .limit(10);
      setRelated((rel ?? []) as Game[]);

      if (user) {
        const [{ data: l }, { data: fv }] = await Promise.all([
          supabase.from("game_likes").select("game_id").eq("user_id", user.id).eq("game_id", g.id).maybeSingle(),
          supabase.from("favorites").select("game_id").eq("user_id", user.id).eq("game_id", g.id).maybeSingle(),
        ]);
        setLiked(!!l);
        setFavorited(!!fv);
      }
    })();
  }, [slug, user]);

  const startPlay = async () => {
    setPlaying(true);
    if (user && game) {
      const { data, error } = await supabase
        .from("play_history")
        .insert({ user_id: user.id, game_id: game.id })
        .select("id")
        .single();
      if (error) {
        console.error("play_history insert error", error);
      } else if (data) {
        setPlayHistoryId(data.id);
      }
    }
  };

  useEffect(() => {
    if (!playHistoryId) return;
    const markEnded = async () => {
      await supabase
        .from("play_history")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", playHistoryId);
    };
    const onBeforeUnload = () => {
      void markEnded();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void markEnded();
    };
  }, [playHistoryId]);

  const toggleLike = async () => {
    if (!user || !game) return toast.error("Inicia sesión para dar like");
    if (liked) {
      await supabase.from("game_likes").delete().eq("user_id", user.id).eq("game_id", game.id);
      setLiked(false);
    } else {
      await supabase.from("game_likes").insert({ user_id: user.id, game_id: game.id });
      setLiked(true);
    }
  };

  const toggleFav = async () => {
    if (!user || !game) return toast.error("Inicia sesión para guardar");
    if (favorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("game_id", game.id);
      setFavorited(false);
      toast.success("Eliminado de guardados");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, game_id: game.id });
      setFavorited(true);
      toast.success("Añadido a guardados");
    }
  };

  const goFullscreen = () => containerRef.current?.requestFullscreen?.();

  if (!game) {
    return (
      <AppLayout>
        <div className="py-24 text-center text-muted-foreground">Cargando...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Volver
      </Link>

      <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden border border-border/60 aspect-video mb-4">
        {playing ? (
          <iframe
            src={game.game_url}
            title={game.title}
            className="size-full"
            allow="autoplay; fullscreen; gamepad; cross-origin-isolated"
            allowFullScreen
          />
        ) : (
          <button onClick={startPlay} className="absolute inset-0 group grid place-items-center">
            {game.thumbnail_url && (
              <img src={game.thumbnail_url} alt={game.title} className="absolute inset-0 size-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
            )}
            <div className="relative size-20 rounded-full bg-primary text-primary-foreground grid place-items-center glow-primary group-hover:scale-110 transition-transform">
              <Play className="size-8 fill-current ml-1" />
            </div>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{game.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            {isAdmin && (
              <span className="flex items-center gap-1.5"><Eye className="size-4" /> {game.views_count.toLocaleString()} vistas</span>
            )}
            <span className="flex items-center gap-1.5"><Heart className="size-4" /> {game.likes_count.toLocaleString()} likes</span>
          </div>
          {game.description && <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>}
          {game.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {game.tags.map((t) => (
                <span key={t} className="text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-surface border border-border text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex md:flex-col gap-2 shrink-0">
          <Button onClick={toggleLike} variant={liked ? "default" : "outline"} size="sm" className={liked ? "bg-primary" : ""}>
            <Heart className={`size-4 mr-1 ${liked ? "fill-current" : ""}`} />Like
          </Button>
          <Button onClick={toggleFav} variant={favorited ? "default" : "outline"} size="sm" className={favorited ? "bg-accent" : ""}>
            <Bookmark className={`size-4 mr-1 ${favorited ? "fill-current" : ""}`} />Guardar
          </Button>
          <Button onClick={goFullscreen} variant="outline" size="sm">
            <Maximize className="size-4 mr-1" />Pantalla completa
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <SectionHeader title="Juegos relacionados" />
          <GameGrid games={related} dense />
        </section>
      )}
    </AppLayout>
  );
}
