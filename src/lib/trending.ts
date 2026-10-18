export const TRENDING_LIMIT = 5;

/** Shared database ordering: accumulated visits, with stable ties. */
export function trendingQuery<T extends {
  eq: (column: string, value: boolean) => T;
  order: (column: string, options: { ascending: boolean }) => T;
  limit: (count: number) => T;
}>(query: T): T {
  return query.eq("is_active", true)
    .order("views_count", { ascending: false })
    .order("id", { ascending: true })
    .limit(TRENDING_LIMIT);
}