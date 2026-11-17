import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { existsSync, readdirSync } from "node:fs";
import { z } from "astro/zod";

const COMMENTS_DIR = "./src/content/comments";

/**
 * Comments are written at runtime by /api/comments, so the folder is
 * legitimately empty on a fresh checkout. The stock glob loader warns about
 * that on every build; skip it silently when there is nothing to load.
 */
const commentsLoader = (): Loader => {
  const inner = glob({ pattern: "**/*.md", base: COMMENTS_DIR });
  return {
    name: "comments-loader",
    load: async (context) => {
      const hasFiles =
        existsSync(COMMENTS_DIR) &&
        readdirSync(COMMENTS_DIR).some((f) => f.endsWith(".md"));
      if (!hasFiles) {
        context.store.clear();
        return;
      }
      return inner.load(context);
    },
  };
};

const commentsCollection = defineCollection({
  loader: commentsLoader(),
  schema: z.object({
    name: z.string(),
    email: z.email(),
    date: z.date(),
    postSlug: z.string(),
    parentId: z.string().optional(),
    rootParentId: z.string().optional(),
    level: z.number().default(1),
    hasReplies: z.boolean().default(false),
    avatar: z.string().optional(),
  }),
});

const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/pages/posts" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    country: z.string(),
    destination: z.string(),
    // ECategory enum - array of valid category values
    categories: z.array(z.string()),
    pubDate: z.date(),
    likesCount: z.number().default(0),
    description: z.string(),
    author: z.object({
      name: z.string(),
      avatar: z.string(),
    }),
    // ISocial interface - optional array
    socials: z
      .array(
        z.object({
          social: z.string(),
          url: z.string(),
        }),
      )
      .optional(),
    // IMasonryHeights - specific allowed heights
    masonry: z
      .object({
        height: z.union([
          z.literal(230),
          z.literal(275),
          z.literal(280),
          z.literal(320),
          z.literal(405),
          z.literal(415),
          z.literal(450),
          z.literal(535),
        ]),
      })
      .optional(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }),
    previewImage: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
    video: z
      .object({
        url: z.string(),
        format: z.string(),
      })
      .optional(),
    // Coordinates - single object or array of coordinate objects
    coordinates: z.union([
      z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      z.array(
        z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      ),
    ]),
  }),
});

export const collections = {
  comments: commentsCollection,
  posts: postsCollection,
};
