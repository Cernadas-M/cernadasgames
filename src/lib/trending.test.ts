import { describe, expect, it } from "vitest";
import { trendingQuery } from "./trending";

describe("automatic Trending", () => {
  it("selects exactly the five active games with most accumulated visits", () => {
    let rows = Array.from({ length: 9 }, (_, i) => ({ id: String(i), is_active: i !== 8, views_count: i * 10 }));
    const query = {
      eq(column: string, value: boolean) { rows = rows.filter(row => row[column as "is_active"] === value); return this; },
      order(column: string, { ascending }: { ascending: boolean }) {
        if (column === "views_count") rows.sort((a, b) => ascending ? a.views_count - b.views_count : b.views_count - a.views_count);
        return this;
      },
      limit(count: number) { rows = rows.slice(0, count); return this; },
    };
    trendingQuery(query);
    expect(rows.map(row => row.views_count)).toEqual([70, 60, 50, 40, 30]);
    expect(rows).toHaveLength(5);
  });
});