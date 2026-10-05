import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { AppLayout } from "@/components/app-layout";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contacto · Ozyron Games" },
      { name: "description", content: "Contacta con Ozyron Games: reporta un error, sugiere un nuevo juego u otra consulta." },
    ],
  }),
});

const FORM_SRC = "https://docs.google.com/forms/d/e/1FAIpQLSe4binxPXKwPAiptp8spy5iqcXzkxoRHvnvru3wqXfWg5OjGw/viewform?embedded=true";

function ContactPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ring-1 ring-primary/30 mb-3">
            <Mail className="size-3" /> Contacto
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Ponte en contacto</h1>
          <p className="text-sm text-muted-foreground">
            Reporta un error, sugiere un nuevo juego o cuéntanos cualquier otra cosa. Los mensajes se envían a{" "}
            <span className="text-foreground font-medium">cernadasgames.contact@gmail.com</span>.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-card p-2 md:p-4 overflow-hidden">
          <iframe
            src={FORM_SRC}
            title="Formulario de contacto"
            width="100%"
            height={1100}
            className="w-full rounded-lg bg-background"
            frameBorder={0}
            marginHeight={0}
            marginWidth={0}
          >
            Cargando…
          </iframe>
        </div>
      </div>
    </AppLayout>
  );
}
