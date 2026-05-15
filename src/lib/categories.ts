import {
  Swords,
  Car,
  Ghost,
  Puzzle,
  Crosshair,
  Users,
  Footprints,
  Tent,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Swords,
  Car,
  Ghost,
  Puzzle,
  Crosshair,
  Users,
  Footprints,
  Tent,
};

export function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return Gamepad2;
  return CATEGORY_ICONS[name] ?? Gamepad2;
}
