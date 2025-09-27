import { glob } from "astro/loaders";
import { z, defineCollection } from "astro:content";

const commentsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/comments" }),
  schema: z.object({
    name: z.string(),
    date: z.date(),
    parentId: z.string().optional(),
    rootParentId: z.string().optional(),
    level: z.number().default(1),
    hasReplies: z.boolean().default(false),
    avatar: z.string().optional(),
  }),
});

export const collections = {
  comments: commentsCollection,
};
