import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus, Shield, ArrowUp, ArrowDown, Search } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Category, Game } from "@/lib/types";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { CATEGORY_ICONS, getCategoryIcon } from "@/lib/categories";
import { BADGE_LABELS } from "@/lib/badge";

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
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({
    category_id: "__keep__",
    badge_type: "__keep__",
    badge_days: 3,
    is_active: "__keep__" as "__keep__" | "true" | "false",
    is_featured: "__keep__" as "__keep__" | "true" | "false",
    is_trending: "__keep__" as "__keep__" | "true" | "false",
  });

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => prev.size === games.length ? new Set() : new Set(games.map((g) => g.id)));
  };

  const load = async () => {
    const [g, c] = await Promise.all([
      supabase.from("games").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setGames((g.data ?? []) as Game[]);
    setCats((c.data ?? []) as Category[]);
    setSelected(new Set());
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

  const q = search.trim().toLowerCase();
  const filtered = q ? games.filter((g) => g.title.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q)) : games;

  return (
    <AppLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Panel de administración</h1>
      <Tabs defaultValue="games" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="games">Juegos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="intro">Intro</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground shrink-0">
                {games.length} juego(s){selected.size > 0 ? ` · ${selected.size} seleccionado(s)` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <>
                  <Button variant="outline" onClick={() => setBulkOpen(true)}>
                    <Pencil className="size-4 mr-1" />Editar {selected.size}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={async () => {
                      if (!confirm(`¿Eliminar ${selected.size} juego(s)?`)) return;
                      const { error } = await supabase.from("games").delete().in("id", Array.from(selected));
                      if (error) return toast.error(error.message);
                      toast.success("Eliminados"); void load();
                    }}
                  >
                    <Trash2 className="size-4 mr-1" />Eliminar
                  </Button>
                </>
              )}

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
                  <div>
                    <Label>URL del juego (HTML5 / Unity WebGL / iframe público) *</Label>
                    <Input required value={form.game_url} onChange={(e) => setForm({ ...form, game_url: e.target.value })} placeholder="https://itch.io/... · https://*.vercel.app · https://*.pages.dev · https://html5.gamedistribution.com/..." />
                    <p className="text-[11px] text-muted-foreground mt-1">Pega una URL pública del juego (itch.io, GameDistribution, Vercel, Cloudflare Pages). Se ejecuta embebido, sin descargas.</p>
                  </div>
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
          </div>

          <div className="rounded-xl border border-border/60 bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={games.length > 0 && selected.size === games.length}
                      ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < games.length; }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="text-left p-3">Título</th>
                  <th className="text-left p-3 hidden md:table-cell">Slug</th>
                  <th className="text-left p-3 hidden lg:table-cell">Categoría</th>
                  <th className="text-left p-3 hidden lg:table-cell">Tag</th>
                  <th className="text-left p-3 hidden lg:table-cell">Vistas</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const category = cats.find((c) => c.id === g.category_id);
                  const tagLabel = g.badge_type ? (BADGE_LABELS[g.badge_type as keyof typeof BADGE_LABELS]?.label ?? g.badge_type) : "—";
                  return (
                    <tr key={g.id} className={`border-t border-border/60 ${selected.has(g.id) ? "bg-primary/5" : ""}`}>
                      <td className="p-3">
                        <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggleOne(g.id)} />
                      </td>
                      <td className="p-3 font-medium">{g.title}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{g.slug}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{category?.name ?? "—"}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{tagLabel}</td>
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
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{q ? "No se encontraron juegos." : "Aún no hay juegos. Crea el primero."}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Editar {selected.size} juego(s)</DialogTitle></DialogHeader>
              <p className="text-xs text-muted-foreground -mt-2">Solo se actualizarán los campos que cambies. Deja "Mantener" para no modificar.</p>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const payload: Record<string, string | boolean | null> = {};
                  if (bulk.category_id !== "__keep__") payload.category_id = bulk.category_id || null;
                  if (bulk.badge_type !== "__keep__") {
                    if (bulk.badge_type === "none") {
                      payload.badge_type = null;
                      payload.badge_expires_at = null;
                    } else {
                      payload.badge_type = bulk.badge_type;
                      payload.badge_expires_at = new Date(Date.now() + bulk.badge_days * 86400000).toISOString();
                    }
                  }
                  if (bulk.is_active !== "__keep__") payload.is_active = bulk.is_active === "true";
                  if (bulk.is_featured !== "__keep__") payload.is_featured = bulk.is_featured === "true";
                  if (bulk.is_trending !== "__keep__") payload.is_trending = bulk.is_trending === "true";
                  if (Object.keys(payload).length === 0) return toast.error("No has cambiado nada");
                  const { error } = await supabase.from("games").update(payload as never).in("id", Array.from(selected));
                  if (error) return toast.error(error.message);
                  toast.success(`${selected.size} juego(s) actualizados`);
                  setBulkOpen(false);
                  setBulk({ category_id: "__keep__", badge_type: "__keep__", badge_days: 3, is_active: "__keep__", is_featured: "__keep__", is_trending: "__keep__" });
                  void load();
                }}
              >
                <div>
                  <Label>Categoría</Label>
                  <Select value={bulk.category_id} onValueChange={(v) => setBulk({ ...bulk, category_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__keep__">Mantener</SelectItem>
                      {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Etiqueta</Label>
                    <Select value={bulk.badge_type} onValueChange={(v) => setBulk({ ...bulk, badge_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__keep__">Mantener</SelectItem>
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
                      type="number" min={1} max={30}
                      value={bulk.badge_days}
                      disabled={bulk.badge_type === "__keep__" || bulk.badge_type === "none"}
                      onChange={(e) => setBulk({ ...bulk, badge_days: Math.max(1, Number(e.target.value) || 3) })}
                    />
                  </div>
                </div>
                {(["is_active", "is_featured", "is_trending"] as const).map((k) => (
                  <div key={k}>
                    <Label>{k === "is_active" ? "Activo" : k === "is_featured" ? "Destacado" : "Trending"}</Label>
                    <Select value={bulk[k]} onValueChange={(v) => setBulk({ ...bulk, [k]: v as "__keep__" | "true" | "false" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__keep__">Mantener</SelectItem>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">Aplicar cambios</Button>
              </form>
            </DialogContent>
          </Dialog>

        </TabsContent>

        <TabsContent value="categories">
          <CategoriesPanel />
        </TabsContent>

        <TabsContent value="logo">
          <LogoSettingsPanel />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function LogoSettingsPanel() {
  const current = useSiteSettings();
  const [url, setUrl] = useState(current.logo_url);
  const [size, setSize] = useState(current.logo_size);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setUrl(current.logo_url); setSize(current.logo_size); }, [current.logo_url, current.logo_size]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return toast.error("Introduce una URL o sube un archivo");
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { id: 1, logo_url: url, logo_size: size, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );
    setSaving(false);
    if (error) {
      console.error("site_settings upsert error", error);
      return toast.error(error.message);
    }
    toast.success("Logo actualizado");
    window.dispatchEvent(new Event("site-settings:updated"));
  };

  const onFile = async (file: File) => {
    if (file.size > 500 * 1024) {
      toast.error("La imagen es demasiado grande (máx 500 KB). Usa una URL pública.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-border/60 bg-surface p-6">
        <h2 className="text-lg font-display font-semibold mb-1">Configuración del logo</h2>
        <p className="text-sm text-muted-foreground mb-6">Cambia el logo que aparece en la barra superior y ajusta su tamaño.</p>

        <div className="flex items-center gap-6 mb-6 p-4 rounded-lg bg-background border border-border/60">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Vista previa</span>
          {url ? (
            <img
              src={url}
              alt="logo preview"
              style={{ width: size, height: size }}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="size-9 rounded-full bg-muted" />
          )}
          <span className="text-sm text-muted-foreground ml-auto">{size}px</span>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>URL del logo</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://... o data URI" />
          </div>
          <div>
            <Label>Subir desde el ordenador</Label>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />
            <p className="text-[11px] text-muted-foreground mt-1">Se almacena embebido (data URI). Para producción usa una URL pública.</p>
          </div>
          <div>
            <Label>Tamaño ({size}px)</Label>
            <Input
              type="range"
              min={20}
              max={120}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-gradient-primary text-primary-foreground">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function CategoriesPanel() {
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", slug: "", name: "", icon: "Gamepad2", sort_order: 0 });
  const iconNames = Object.keys(CATEGORY_ICONS);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats((data ?? []) as Category[]);
  };
  useEffect(() => { void load(); }, []);

  const reset = () => setForm({ id: "", slug: "", name: "", icon: "Gamepad2", sort_order: cats.length });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) return toast.error("Slug y nombre son obligatorios");
    const payload = { slug: form.slug, name: form.name, icon: form.icon, sort_order: form.sort_order };
    const { error } = form.id
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Categoría actualizada" : "Categoría creada");
    setOpen(false); reset(); void load();
  };

  const edit = (c: Category) => {
    setForm({ id: c.id, slug: c.slug, name: c.name, icon: c.icon ?? "Gamepad2", sort_order: c.sort_order });
    setOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los juegos quedarán sin categoría.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada"); void load();
  };

  const move = async (c: Category, dir: -1 | 1) => {
    const idx = cats.findIndex((x) => x.id === c.id);
    const swap = cats[idx + dir];
    if (!swap) return;
    const { error } = await supabase.from("categories").upsert([
      { ...c, sort_order: swap.sort_order },
      { ...swap, sort_order: c.sort_order },
    ]);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{cats.length} categoría(s)</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button onClick={reset} className="bg-gradient-primary text-primary-foreground">
              <Plus className="size-4 mr-1" />Nueva categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{form.id ? "Editar categoría" : "Nueva categoría"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nombre *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Slug *</Label><Input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="accion" /></div>
              </div>
              <div>
                <Label>Icono</Label>
                <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconNames.map((n) => {
                      const Icon = getCategoryIcon(n);
                      return (
                        <SelectItem key={n} value={n}>
                          <span className="inline-flex items-center gap-2"><Icon className="size-4" />{n}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">
                {form.id ? "Guardar cambios" : "Crear categoría"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/60 bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Orden</th>
              <th className="text-left p-3">Icono</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3 hidden md:table-cell">Slug</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c, i) => {
              const Icon = getCategoryIcon(c.icon);
              return (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="p-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="w-6">{c.sort_order}</span>
                      <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(c, -1)}><ArrowUp className="size-3" /></Button>
                      <Button variant="ghost" size="icon" disabled={i === cats.length - 1} onClick={() => move(c, 1)}><ArrowDown className="size-3" /></Button>
                    </div>
                  </td>
                  <td className="p-3"><Icon className="size-4" /></td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{c.slug}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => edit(c)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              );
            })}
            {cats.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sin categorías.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
