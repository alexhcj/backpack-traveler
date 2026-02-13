import { supabase, type ContentType } from "../lib/supabase";

/**
 * Get engagement count for a specific item
 */
export async function getEngagementCount(
  slug: string,
  type: ContentType,
): Promise<number> {
  const { count, error } = await supabase
    .from("engagement")
    .select("*", { count: "exact", head: true })
    .eq("item_slug", slug)
    .eq("item_type", type);

  if (error) {
    console.error("Error fetching engagement count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get most engaged items of a specific type
 */
export async function getMostEngagedItems(
  type: ContentType,
  limit: number = 10,
): Promise<Array<{ slug: string; count: number }>> {
  const { data, error } = await supabase
    .from("engagement")
    .select("item_slug")
    .eq("item_type", type);

  if (error) {
    console.error("Error fetching most engaged items:", error);
    return [];
  }

  // Count engagement per slug
  const engagementMap = new Map<string, number>();
  data.forEach((item) => {
    const current = engagementMap.get(item.item_slug) || 0;
    engagementMap.set(item.item_slug, current + 1);
  });

  // Convert to array and sort
  return Array.from(engagementMap.entries())
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get recent engagement activity for a specific type
 */
export async function getRecentEngagement(
  type: ContentType,
  limit: number = 20,
): Promise<Array<{ slug: string; timestamp: string }>> {
  const { data, error } = await supabase
    .from("engagement")
    .select("item_slug, created_at")
    .eq("item_type", type)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent engagement:", error);
    return [];
  }

  return data.map((item) => ({
    slug: item.item_slug,
    timestamp: item.created_at,
  }));
}

/**
 * Get total engagement across all content
 */
export async function getTotalEngagement(): Promise<number> {
  const { count, error } = await supabase
    .from("engagement")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching total engagement:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get engagement count by content type
 */
export async function getEngagementByType(type: ContentType): Promise<number> {
  const { count, error } = await supabase
    .from("engagement")
    .select("*", { count: "exact", head: true })
    .eq("item_type", type);

  if (error) {
    console.error("Error fetching engagement by type:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get engagement statistics
 */
export async function getEngagementStats(): Promise<{
  total: number;
  posts: number;
  destinations: number;
  uniqueItems: number;
  averagePerItem: number;
}> {
  const { data, error } = await supabase
    .from("engagement")
    .select("item_slug, item_type");

  if (error) {
    console.error("Error fetching engagement stats:", error);
    return {
      total: 0,
      posts: 0,
      destinations: 0,
      uniqueItems: 0,
      averagePerItem: 0,
    };
  }

  const total = data.length;
  const posts = data.filter((item) => item.item_type === "post").length;
  const destinations = data.filter(
    (item) => item.item_type === "destination",
  ).length;
  const uniqueItems = new Set(
    data.map((item) => `${item.item_type}-${item.item_slug}`),
  ).size;
  const averagePerItem = uniqueItems > 0 ? total / uniqueItems : 0;

  return {
    total,
    posts,
    destinations,
    uniqueItems,
    averagePerItem: Math.round(averagePerItem * 10) / 10,
  };
}

/**
 * Get engagement leaderboard (mixed posts and destinations)
 */
export async function getEngagementLeaderboard(
  limit: number = 10,
): Promise<Array<{ slug: string; type: ContentType; count: number }>> {
  const { data, error } = await supabase
    .from("engagement")
    .select("item_slug, item_type");

  if (error) {
    console.error("Error fetching engagement leaderboard:", error);
    return [];
  }

  // Count engagement per item (with type)
  const engagementMap = new Map<
    string,
    { slug: string; type: ContentType; count: number }
  >();

  data.forEach((item) => {
    const key = `${item.item_type}-${item.item_slug}`;
    const current = engagementMap.get(key);

    if (current) {
      current.count++;
    } else {
      engagementMap.set(key, {
        slug: item.item_slug,
        type: item.item_type as ContentType,
        count: 1,
      });
    }
  });

  // Convert to array and sort
  return Array.from(engagementMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
