import { createFileRoute } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Play, Flame, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { AppLayout } from "@/components/app-layout";
import { GameGrid, SectionHeader } from "@/components/game-grid";
import { Button } from "@/components/ui/button";

import type { Game } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        name: "google-site-verification",
        content: "ldDn80Yg9If6YF4PF_gccIVQtyeK8yNA3LmEWdj0qrw",
      },
    ],
  }),

  component: Index,
});

function Index() {
  const [featured, setFeatured] = useState<Game | null>(null);
  const [trending, setTrending] = useState<Game[]>([]);
  const [newest, setNewest] = useState<Game[]>([]);
  const [allPreview, setAllPreview] = useState<Game[]>([]);
  const [hasMoreAll, setHasMoreAll] = useState(false);

  useEffect(() => {
    void (async () => {
      const nowIso = new Date().toISOString();

      const [f, t, n, a] = await Promise.all([
        supabase
          .from("games")
          .select("*")
          .eq("is_active", true)
          .eq("is_featured", true)
          .limit(1)
          .maybeSingle(),

        supabase
          .from("games")
          .select("*")
          .eq("is_active", true)
          .eq("badge_type", "trending")
          .or(`badge_expires_at.is.null,badge_expires_at.gt.${nowIso}`)
          .order("views_count", { ascending: false })
          .limit(10),

        supabase
          .from("games")
          .select("*")
          .eq("is_active", true)
          .eq("badge_type", "new")
          .or(`badge_expires_at.is.null,badge_expires_at.gt.${nowIso}`)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("games")
          .select("*")
          .eq("is_active", true)
          .order("views_count", { ascending: false })
          .limit(26),
      ]);

      setFeatured((f.data as Game | null) ?? null);
      setTrending((t.data ?? []) as Game[]);
      setNewest((n.data ?? []) as Game[]);

      const allData = (a.data ?? []) as Game[];
      setHasMoreAll(allData.length > 25);
      setAllPreview(allData.slice(0, 25));
    })();
  }, []);

  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative mb-10 rounded-2xl overflow-hidden border border-border/60 aspect-[21/9] md:aspect-[21/8] bg-gradient-card">
        {featured?.banner_url || featured?.thumbnail_url ? (
          <img
            src={featured.banner_url ?? featured.thumbnail_url ?? ""}
            alt={featured.title}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-6 md:p-10 max-w-2xl">
          <span className="inline-flex w-fit items-center gap-1.5 bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ring-1 ring-primary/30 mb-3">
            <Sparkles className="size-3" /> Destacado
          </span>

          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-3 text-balance">
            {featured?.title ?? "Bienvenido a Cernadas Games"}
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-lg line-clamp-2">
            {featured?.description ??
              "Miles de juegos HTML5 y Unity WebGL listos para jugar al instante. Sin descargas."}
          </p>

          <div className="flex gap-3">
            {featured ? (
              <Button
                asChild
                size="lg"
                className="bg-gradient-primary text-primary-foreground glow-primary hover:opacity-90"
              >
                <Link to="/game/$slug" params={{ slug: featured.slug }}>
                  <Play className="size-4 fill-current mr-1" /> Jugar ahora
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-gradient-primary text-primary-foreground glow-primary"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Crear cuenta gratis
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {trending.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            title="🔥 Trending"
            action={
              <Link
                to="/trending"
                className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
              >
                Ver todos
              </Link>
            }
          />
          <GameGrid games={trending} />
        </section>
      )}

      {newest.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            title="✨ Nuevos juegos"
            action={
              <Link
                to="/new"
                className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
              >
                Ver todos
              </Link>
            }
          />
          <GameGrid games={newest} />
        </section>
      )}

      <section className="mb-12">
        <SectionHeader
          title="Todos los juegos"
          action={
            hasMoreAll ? (
              <Link
                to="/all"
                className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
              >
                Ver todos
              </Link>
            ) : undefined
          }
        />

        {allPreview.length > 0 ? (
          <GameGrid games={allPreview} dense />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Flame className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Aún no hay juegos publicados.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Ir al panel admin</Link>
            </Button>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
