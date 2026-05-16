import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Category, Game } from "@/lib/types";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const empty = {
  id: "", slug: "", title: "", description: "", thumbnail_url: "", banner_url: "",
  game_url: "", game_type: "iframe", category_id: "", tags: "",
  is_featured: false, is_trending: false, is_active: true,
  badge_type: "none", badge_days: 3,
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const [g, c] = await Promise.all([
      supabase.from("games").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setGames((g.data ?? []) as Game[]);
    setCats((c.data ?? []) as Category[]);
  };

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  if (loading) return <AppLayout><div className="py-12 text-center">Cargando...</div></AppLayout>;

  if (!user || !isAdmin) {
    return (
      <AppLayout>
        <div className="py-12 max-w-lg mx-auto text-center">
          <Shield className="size-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Acceso restringido</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Solo los administradores pueden acceder al panel. Si eres el creador, ejecuta esta consulta en el backend para concederte el rol:
          </p>
          <pre className="text-left text-xs bg-surface border border-border rounded-lg p-3 overflow-x-auto mb-4">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${user?.id ?? "<TU_USER_ID>"}', 'admin')
ON CONFLICT DO NOTHING;`}
          </pre>
          <Button asChild variant="outline"><Link to="/">Volver</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const badgeType = form.badge_type === "none" ? null : form.badge_type;
    const badgeExpires = badgeType
      ? new Date(Date.now() + form.badge_days * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const payload = {
      slug: form.slug, title: form.title, description: form.description || null,
      thumbnail_url: form.thumbnail_url || null, banner_url: form.banner_url || null,
      game_url: form.game_url, game_type: form.game_type,
      category_id: form.category_id || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_featured: form.is_featured, is_trending: form.is_trending, is_active: form.is_active,
      badge_type: badgeType, badge_expires_at: badgeExpires,
    };
    const { error } = form.id
      ? await supabase.from("games").update(payload).eq("id", form.id)
      : await supabase.from("games").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Juego actualizado" : "Juego creado");
    setOpen(false); setForm(empty); void load();
  };

  const edit = (g: Game) => {
    setForm({
      id: g.id, slug: g.slug, title: g.title, description: g.description ?? "",
      thumbnail_url: g.thumbnail_url ?? "", banner_url: g.banner_url ?? "",
      game_url: g.game_url, game_type: g.game_type, category_id: g.category_id ?? "",
      tags: g.tags.join(", "), is_featured: g.is_featured, is_trending: g.is_trending, is_active: g.is_active,
      badge_type: g.badge_type ?? "none", badge_days: 3,
    });
    setOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este juego?")) return;
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado"); void load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Panel de administración</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="size-4 mr-1" />Nuevo juego</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Editar juego" : "Nuevo juego"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Título *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Slug *</Label><Input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mi-juego" /></div>
              </div>
              <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>URL miniatura</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
                <div><Label>URL banner</Label><Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} /></div>
              </div>
              <div><Label>URL del juego (iframe / Unity WebGL) *</Label><Input required value={form.game_url} onChange={(e) => setForm({ ...form, game_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.game_type} onValueChange={(v) => setForm({ ...form, game_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iframe">HTML5 / iframe</SelectItem>
                      <SelectItem value="unity">Unity WebGL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Tags (separados por coma)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="multijugador, rápido, 2D" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Etiqueta destacada</Label>
                  <Select value={form.badge_type} onValueChange={(v) => setForm({ ...form, badge_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin etiqueta</SelectItem>
                      <SelectItem value="new">Nuevo</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="update">Actualizado</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="hoy">Hoy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duración (días)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={form.badge_days}
                    disabled={form.badge_type === "none"}
                    onChange={(e) => setForm({ ...form, badge_days: Math.max(1, Number(e.target.value) || 3) })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Activo</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />Destacado</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_trending} onCheckedChange={(v) => setForm({ ...form, is_trending: v })} />Trending</label>
              </div>
              <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">{form.id ? "Guardar cambios" : "Crear juego"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/60 bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-3">Título</th><th className="text-left p-3 hidden md:table-cell">Slug</th><th className="text-left p-3 hidden lg:table-cell">Vistas</th><th className="text-left p-3">Estado</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className="border-t border-border/60">
                <td className="p-3 font-medium">{g.title}</td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{g.slug}</td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{g.views_count}</td>
                <td className="p-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold ${g.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {g.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => edit(g)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(g.id)}><Trash2 className="size-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aún no hay juegos. Crea el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
