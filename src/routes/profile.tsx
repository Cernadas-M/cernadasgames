import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Moon, Sun, Upload, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setName(data.display_name ?? ""); setAvatar(data.avatar_url ?? ""); }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ display_name: name, avatar_url: avatar }).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Perfil actualizado");
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("El archivo debe ser una imagen"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600", upsert: true, contentType: file.type,
    });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatar(data.publicUrl);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    toast.success("Foto actualizada");
    setUploading(false);
  };

  if (!user && !loading) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Inicia sesión para ver tu perfil.</p>
          <Button asChild><Link to="/auth">Iniciar sesión</Link></Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Mi perfil</h1>

      <div className="max-w-md space-y-6 bg-surface border border-border/60 rounded-xl p-6">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="avatar" className="size-20 rounded-full object-cover border border-border" />
          ) : (
            <div className="size-20 rounded-full bg-gradient-primary grid place-items-center text-2xl font-bold text-primary-foreground glow-primary">
              {(name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFile} />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="size-4 mr-2" />{uploading ? "Subiendo..." : "Subir foto"}
            </Button>
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>

        <div>
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <Label className="flex items-center gap-1.5"><LinkIcon className="size-3.5" />URL del avatar</Label>
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
          <p className="text-xs text-muted-foreground mt-1">También puedes pegar una URL de una imagen.</p>
        </div>

        <Button onClick={save} className="bg-gradient-primary text-primary-foreground w-full">Guardar</Button>
      </div>

      <div className="max-w-md mt-6 bg-surface border border-border/60 rounded-xl p-6">
        <h2 className="font-display font-semibold mb-3">Tema de la web</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
              theme === "dark" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="size-4" />Oscuro
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
              theme === "light" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="size-4" />Claro
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
