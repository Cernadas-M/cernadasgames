import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, User as UserIcon, LogOut, Bookmark, History, Shield } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (r) => r.location.search as { q?: string } });
  const [q, setQ] = useState(search.q ?? "");
  const { user, isAdmin } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    let cancelled = false;
    const load = () => {
      void supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (!cancelled) setAvatarUrl(data?.avatar_url ?? null);
      });
    };
    load();
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        const next = (payload.new as { avatar_url?: string | null }).avatar_url ?? null;
        setAvatarUrl(next);
      })
      .subscribe();
    const onUpdated = () => load();
    window.addEventListener("profile:updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("profile:updated", onUpdated);
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    void navigate({ to: "/search", search: { q: trimmed } });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-background/75 backdrop-blur-xl border-b border-border/60">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 lg:gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={siteSettings.logo_url}
              alt="Cernadas Games"
              style={{ width: siteSettings.logo_size, height: siteSettings.logo_size }}
              className="rounded-full object-cover transition-transform group-hover:scale-105 shrink-0"
            />


            <span className="font-display text-xl font-bold tracking-tight hidden sm:inline">
              <span className="text-gradient">CERNADAS</span>{" "}
              <span className="text-foreground/90">GAMES</span>
            </span>
          </Link>

          <form onSubmit={onSubmit} className="relative hidden md:block">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar juegos..."
              className="w-72 lg:w-96 h-10 pl-10 pr-4 rounded-full bg-surface border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40 transition-all"
            />
          </form>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="size-10 rounded-full bg-gradient-primary text-primary-foreground font-semibold grid place-items-center text-sm hover:scale-105 transition-transform overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="size-full object-cover" />
                  ) : (
                    (user.email ?? "U").charAt(0).toUpperCase()
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile"><UserIcon className="size-4 mr-2" />Mi perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites"><Bookmark className="size-4 mr-2" />Guardados</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/history"><History className="size-4 mr-2" />Historial</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><Shield className="size-4 mr-2" />Panel admin</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    void navigate({ to: "/" });
                  }}
                >
                  <LogOut className="size-4 mr-2" />Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary">
                <Link to="/auth" search={{ mode: "signup" }}>Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
