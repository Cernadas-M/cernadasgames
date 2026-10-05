import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/ozyron-logo.png.asset.json";

export interface SiteSettings {
  logo_url: string;
  logo_size: number;
  intro_logo_url: string;
  intro_duration_ms: number;
}

const DEFAULTS: SiteSettings = {
  logo_url: logoAsset.url,
  logo_size: 36,
  intro_logo_url: "",
  intro_duration_ms: 2500,
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("logo_url, logo_size, intro_logo_url, intro_duration_ms")
        .eq("id", 1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("site_settings load failed", error);
        return;
      }
      if (data) {
        setSettings({
          logo_url: data.logo_url,
          logo_size: data.logo_size,
          intro_logo_url: (data as { intro_logo_url: string | null }).intro_logo_url ?? "",
          intro_duration_ms: (data as { intro_duration_ms: number | null }).intro_duration_ms ?? 2500,
        });
      }
    };
    void load();
    const onUpdated = () => void load();
    window.addEventListener("site-settings:updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("site-settings:updated", onUpdated);
    };
  }, []);

  return settings;
}
