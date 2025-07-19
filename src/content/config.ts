import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const reviewsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/reviews" }),
  schema: z.object({
    name: z.string(),
    avatar: z.string().optional(),
    date: z.date(),
    relatedPost: z.string().optional(), // slug of related post
    parentId: z.string().optional(), // ID of parent review
    isReply: z.boolean().default(false),
    hasReplies: z.boolean().default(false).optional(),
  }),
});

export const collections = {
  reviews: reviewsCollection,
};
