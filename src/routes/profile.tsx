import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

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
      <div className="max-w-md space-y-4 bg-surface border border-border/60 rounded-xl p-6">
        <div className="size-20 rounded-full bg-gradient-primary grid place-items-center text-2xl font-bold text-primary-foreground glow-primary">
          {(name || user?.email || "U").charAt(0).toUpperCase()}
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
          <Label>URL del avatar</Label>
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
        </div>
        <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Guardar</Button>
      </div>
    </AppLayout>
  );
}
