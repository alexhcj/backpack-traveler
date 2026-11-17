import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { supabase } from "../lib/supabase";
import { SubscriptionService } from "../lib/services/subscriptions";
import { BookReviewsService } from "../lib/services/book-reviews";

export const form = {
  sendGetInTouch: defineAction({
    accept: "form",
    input: z.object({
      name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long" })
        .max(100, { message: "Name must be at most 100 characters long" }),
      email: z.email({ message: "Invalid email address" }),
      message: z
        .string()
        .min(10, { message: "Message must be at least 10 characters long" })
        .max(500, { message: "Message must be at most 500 characters long" }),
    }),
    handler: async ({ name, email, message }) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ name, email, message, status: "new" })
        .select()
        .single();

      if (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save contact",
        });
      }


      return {
        success: true,
        contactId: data.id,
      };
    },
  }),
  sendSubscribe: defineAction({
    accept: "form",
    input: z.object({
      name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long" })
        .max(100, { message: "Name must be at most 100 characters long" }),
      email: z.email({ message: "Invalid email address" }),
      country: z
        .string()
        .min(2, { message: "Country must be at least 2 characters long" })
        .max(100, { message: "Country must be at most 100 characters long" }),
    }),
    handler: async ({ name, email, country }) => {
      const { data, error } = await SubscriptionService.subscribe({
        name,
        email,
        country,
      });

      if (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save subscription",
        });
      }


      return {
        success: true,
        subscriptionId: data?.id,
      };
    },
  }),
  submitReview: defineAction({
    accept: "form",
    input: z.object({
      book_id: z.string(),
      rating: z.coerce
        .number()
        .min(1, { message: "Rating must be at least 1" })
        .max(5, { message: "Rating must be at most 5" }),
      review: z
        .string()
        .min(10, { message: "Review must be at least 10 characters long" })
        .max(500, { message: "Review must be at most 500 characters long" }),
      reviewer_name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long" })
        .max(100, { message: "Name must be at most 100 characters long" }),
      email: z.email({ message: "Invalid email address" }),
    }),
    handler: async ({ book_id, rating, review, reviewer_name, email }) => {
      const { data, error } = await BookReviewsService.create({
        book_id,
        rating,
        review,
        reviewer_name,
        email,
      });

      if (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save review",
        });
      }

      return { success: true, reviewId: data?.id };
    },
  }),
};
