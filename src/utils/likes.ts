import { supabase } from "../lib/supabase";

/**
 * Get likes count for a specific post/destination
 */
export async function getLikesCount(slug: string): Promise<number> {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_slug", slug);

  if (error) {
    console.error("Error fetching likes count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get top liked posts/destinations
 */
export async function getMostLikedPosts(
  limit: number = 10,
): Promise<Array<{ slug: string; likes: number }>> {
  const { data, error } = await supabase
    .from("likes")
    .select("post_slug")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching most liked posts:", error);
    return [];
  }

  // Count likes per slug
  const likesMap = new Map<string, number>();
  data.forEach((like) => {
    const current = likesMap.get(like.post_slug) || 0;
    likesMap.set(like.post_slug, current + 1);
  });

  // Convert to array and sort
  return Array.from(likesMap.entries())
    .map(([slug, likes]) => ({ slug, likes }))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);
}

/**
 * Get recent likes activity
 */
export async function getRecentLikes(
  limit: number = 20,
): Promise<Array<{ slug: string; timestamp: string }>> {
  const { data, error } = await supabase
    .from("likes")
    .select("post_slug, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent likes:", error);
    return [];
  }

  return data.map((like) => ({
    slug: like.post_slug,
    timestamp: like.created_at,
  }));
}

/**
 * Get total likes across all posts
 */
export async function getTotalLikes(): Promise<number> {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching total likes:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get likes statistics for analytics
 */
export async function getLikesStats(): Promise<{
  total: number;
  uniquePosts: number;
  averageLikesPerPost: number;
}> {
  const { data, error } = await supabase.from("likes").select("post_slug");

  if (error) {
    console.error("Error fetching likes stats:", error);
    return { total: 0, uniquePosts: 0, averageLikesPerPost: 0 };
  }

  const total = data.length;
  const uniquePosts = new Set(data.map((like) => like.post_slug)).size;
  const averageLikesPerPost = uniquePosts > 0 ? total / uniquePosts : 0;

  return {
    total,
    uniquePosts,
    averageLikesPerPost: Math.round(averageLikesPerPost * 10) / 10, // Round to 1 decimal
  };
}
