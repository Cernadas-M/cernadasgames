export type Game = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  game_url: string;
  game_type: string;
  category_id: string | null;
  tags: string[];
  views_count: number;
  likes_count: number;
  is_featured: boolean;
  is_trending: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
};
