import { supabase, type ContentType } from "../supabase";

export interface DestinationLike {
  destination: string;
  count: number;
}

export async function getAllDestinationLikes(): Promise<DestinationLike[]> {
  const { data, error } = await supabase
    .from("engagement")
    .select("slug")
    .eq("type", "destination");

  if (error) {
    console.error("Supabase query error:", error);
    throw error;
  }

  // Group by slug and count occurrences
  const destinationCounts = (data || []).reduce(
    (acc: Record<string, number>, item) => {
      const slug = item.slug;
      acc[slug] = (acc[slug] || 0) + 1;
      return acc;
    },
    {},
  );

  // Convert to array format
  return Object.entries(destinationCounts).map(([destination, count]) => ({
    destination,
    count,
  }));
}

export async function getTotalEngagementCount(
  type: ContentType,
): Promise<number> {
  const { count, error } = await supabase
    .from("engagement")
    .select("*", { count: "exact", head: true })
    .eq("type", type);

  if (error) {
    console.error("Supabase count error:", error);
    throw error;
  }

  return count || 0;
}
