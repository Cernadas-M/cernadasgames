import { Link } from "@tanstack/react-router";
import { Heart, Eye, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function GameCard({ game, size = "md" }: { game: Game; size?: "sm" | "md" | "lg" }) {
  return (
    <Link to="/game/$slug" params={{ slug: game.slug }} className="group block">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface border border-border/60 transition-all",
          "group-hover:border-primary/50 group-hover:shadow-[0_0_24px_-4px_oklch(0.78_0.18_195/30%)]",
          size === "sm" ? "aspect-square" : "aspect-[4/5]",
        )}
      >
        {game.thumbnail_url ? (
          <img
            src={game.thumbnail_url}
            alt={game.title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-card grid place-items-center">
            <Play className="size-8 text-muted-foreground" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform">
          <div className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center mx-auto opacity-0 group-hover:opacity-100 transition-opacity glow-primary">
            <Play className="size-4 fill-current ml-0.5" />
          </div>
        </div>

        {game.is_featured && (
          <span className="absolute top-2 left-2 bg-accent/90 backdrop-blur-md text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
            Destacado
          </span>
        )}
      </motion.div>

      <div className="mt-2.5 space-y-1">
        <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
          {game.title}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="size-3" />{formatCount(game.views_count)}</span>
          <span className="flex items-center gap-1"><Heart className="size-3" />{formatCount(game.likes_count)}</span>
        </div>
      </div>
    </Link>
  );
}
