import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Flame, Sparkles, Heart, History as HistoryIcon, Gamepad2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryIcon } from "@/lib/categories";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [cats, setCats] = useState<Category[]>([]);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    void supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCats((data ?? []) as Category[]));
  }, []);

  const NavItem = ({
    to,
    icon: Icon,
    label,
    active,
  }: { to: string; icon: typeof Home; label: string; active?: boolean }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-surface",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-60 flex-col border-r border-border/60 bg-sidebar overflow-y-auto p-4 gap-6">
      <nav className="space-y-1">
        <NavItem to="/" icon={Home} label="Inicio" active={pathname === "/"} />
        <NavItem to="/trending" icon={Flame} label="Trending" active={pathname === "/trending"} />
        <NavItem to="/new" icon={Sparkles} label="Nuevos" active={pathname === "/new"} />
        <NavItem to="/favorites" icon={Heart} label="Favoritos" active={pathname === "/favorites"} />
        <NavItem to="/history" icon={HistoryIcon} label="Historial" active={pathname === "/history"} />
      </nav>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-3">
          Categorías
        </p>
        <nav className="space-y-1">
          {cats.length === 0 && (
            <div className="px-3 text-xs text-muted-foreground">Cargando...</div>
          )}
          {cats.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            const active = pathname === `/category/${c.slug}`;
            return (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{c.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 rounded-xl bg-gradient-card border border-border/60">
        <Gamepad2 className="size-5 text-primary mb-2" />
        <p className="text-xs font-semibold mb-1">Juega gratis</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Miles de juegos directamente en tu navegador. Sin descargas.
        </p>
      </div>
    </aside>
  );
}
