import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo.png.asset.json";

export interface SiteSettings {
  logo_url: string;
  logo_size: number;
}

const DEFAULTS: SiteSettings = { logo_url: logoAsset.url, logo_size: 36 };

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void supabase
        .from("site_settings")
        .select("logo_url, logo_size")
        .eq("id", 1)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data) setSettings({ logo_url: data.logo_url, logo_size: data.logo_size });
        });
    };
    load();
    const channel = supabase
      .channel("site-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "id=eq.1" },
        (payload) => {
          const next = payload.new as Partial<SiteSettings>;
          if (next.logo_url && typeof next.logo_size === "number") {
            setSettings({ logo_url: next.logo_url, logo_size: next.logo_size });
          }
        },
      )
      .subscribe();
    const onUpdated = () => load();
    window.addEventListener("site-settings:updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("site-settings:updated", onUpdated);
      void supabase.removeChannel(channel);
    };
  }, []);

  return settings;
}
