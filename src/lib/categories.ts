import {
  Swords,
  Car,
  Ghost,
  Puzzle,
  Crosshair,
  Users,
  Footprints,
  Tent,
  Globe,
  Brain,
  MoreHorizontal,
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
  Globe,
  Brain,
  MoreHorizontal,
};

export function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return Gamepad2;
  return CATEGORY_ICONS[name] ?? Gamepad2;
}
