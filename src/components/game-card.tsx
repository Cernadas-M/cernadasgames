import { Link } from "@tanstack/react-router";
import { Heart, Eye, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { Game } from "@/lib/types";
import { getActiveBadge } from "@/lib/badge";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function GameCard({ game }: { game: Game; size?: "sm" | "md" | "lg" }) {
  const badge = getActiveBadge(game);
  const { isAdmin } = useAuth();
  return (
    <Link to="/game/$slug" params={{ slug: game.slug }} className="group block">
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface border border-border/60 aspect-square",
          "transition-colors group-hover:border-primary/50 group-hover:shadow-[0_0_24px_-4px_oklch(0.78_0.18_195/30%)]",
        )}
      >
        {game.thumbnail_url ? (
          <img
            src={game.thumbnail_url}
            alt={game.title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-card grid place-items-center">
            <Play className="size-8 text-muted-foreground" />
          </div>
        )}

        {badge && (
          <span className={cn("absolute top-2 left-2 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-lg", badge.className)}>
            {badge.label}
          </span>
        )}
        {game.is_featured && !badge && (
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
          {isAdmin && (
            <span className="flex items-center gap-1"><Eye className="size-3" />{formatCount(game.views_count)}</span>
          )}
          <span className="flex items-center gap-1"><Heart className="size-3" />{formatCount(game.likes_count)}</span>
        </div>
      </div>
    </Link>
  );
}
