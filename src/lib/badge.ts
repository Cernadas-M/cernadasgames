import type { Game } from "@/lib/types";

export const BADGE_LABELS = {
  trending: { label: "Trending", className: "bg-orange-500/90 text-white" },
  new: { label: "Nuevo", className: "bg-primary text-primary-foreground" },
  update: { label: "Actualizado", className: "bg-blue-500/90 text-white" },
  hot: { label: "Hot", className: "bg-red-500/90 text-white" },
  hoy: { label: "Hoy", className: "bg-purple-500/90 text-white" },
} as const;

export type BadgeType = keyof typeof BADGE_LABELS;

export function getActiveBadge(game: Pick<Game, "badge_type" | "badge_expires_at">) {
  if (!game.badge_type) return null;
  if (game.badge_expires_at && new Date(game.badge_expires_at) < new Date()) return null;
  return BADGE_LABELS[game.badge_type];
}
