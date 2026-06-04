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
    const load = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("logo_url, logo_size")
        .eq("id", 1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("site_settings load failed", error);
        return;
      }
      if (data) setSettings({ logo_url: data.logo_url, logo_size: data.logo_size });
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
