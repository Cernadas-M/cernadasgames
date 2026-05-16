import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contacto · Cernadas Games" },
      { name: "description", content: "Contacta con Cernadas Games: reporta un error, sugiere un nuevo juego u otra consulta." },
    ],
  }),
});

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Email no válido").max(255),
  subject_type: z.enum(["error", "new_game", "other"]),
  message: z.string().trim().min(5, "Mensaje demasiado corto").max(5000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject_type: "error" as "error" | "new_game" | "other", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name || null,
      email: parsed.data.email,
      subject_type: parsed.data.subject_type,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("No se pudo enviar. Inténtalo de nuevo.");
      return;
    }
    setSent(true);
    setForm({ name: "", email: "", subject_type: "error", message: "" });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ring-1 ring-primary/30 mb-3">
            <Mail className="size-3" /> Contacto
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Ponte en contacto</h1>
          <p className="text-sm text-muted-foreground">Reporta un error, sugiere un nuevo juego o cuéntanos cualquier otra cosa.</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
            <CheckCircle2 className="size-12 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">¡Mensaje enviado!</h2>
            <p className="text-sm text-muted-foreground mb-5">Te responderemos lo antes posible al correo indicado.</p>
            <Button variant="outline" onClick={() => setSent(false)}>Enviar otro mensaje</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-border/60 bg-gradient-card p-6 md:p-8">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de consulta *</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "error", l: "Error" },
                  { v: "new_game", l: "Nuevo juego" },
                  { v: "other", l: "Otro" },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, subject_type: o.v }))}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      form.subject_type === o.v
                        ? "bg-primary/15 text-primary border-primary/40 ring-1 ring-primary/30"
                        : "bg-surface text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tu nombre (opcional)" maxLength={120} />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo electrónico *</label>
              <Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" maxLength={255} />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">¿Qué ha sucedido? *</label>
              <Textarea
                required
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Describe el error, el juego que sugieres o tu consulta..."
                rows={7}
                maxLength={5000}
              />
              <p className="text-[11px] text-muted-foreground">{form.message.length}/5000</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground glow-primary hover:opacity-90">
              <Send className="size-4 mr-2" />
              {loading ? "Enviando..." : "Enviar mensaje"}
            </Button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
