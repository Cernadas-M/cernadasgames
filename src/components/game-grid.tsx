import type { Game } from "@/lib/types";
import { GameCard } from "./game-card";

export function GameGrid({ games, dense }: { games: Game[]; dense?: boolean }) {
  if (games.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-sm">No hay juegos para mostrar.</p>
      </div>
    );
  }
  return (
    <div
      className={
        dense
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5"
      }
    >
      {games.map((g) => (
        <GameCard key={g.id} game={g} size={dense ? "sm" : "md"} />
      ))}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
