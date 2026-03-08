import { glob } from "astro/loaders";
import { z, defineCollection } from "astro:content";

const commentsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/comments" }),
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
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
    categories: z.array(
      z.enum([
        "CAMPING",
        "BEACHES",
        "DOG_FRIENDLY",
        "RESTAURANTS",
        "OVERNIGHT",
        "LOW_BUDGET",
        "EXPLORE",
        "DRINKS",
        "FLIGHTS",
        "SHOPPING",
        "PHOTOGRAPHY",
        "VACATION",
        "ADVENTURE",
        "CULTURAL",
        "ECO",
        "LUXURY",
        "FOOD",
        "WELLNESS_AND_SPA",
        "ROAD_TRIPS",
        "WILDLIFE_AND_SAFARI",
        "URBAN_AND_CITY",
        "RELIGIOUS_AND_SPIRITUAL",
        "SPORTS",
        "FESTIVAL_AND_EVENT",
        "TRAIN_AND_SCENIC_RAILWAY",
      ]),
    ),
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
          url: z.string().url(),
        }),
      )
      .optional(),
    // IMasonryHeights - specific allowed heights
    masonry: z.object({
      height: z
        .union([
          z.literal(275),
          z.literal(280),
          z.literal(405),
          z.literal(415),
          z.literal(450),
          z.literal(535),
        ])
        .optional(),
    }),
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
