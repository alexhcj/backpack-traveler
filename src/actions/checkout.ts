import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { CartService } from "../lib/services/cart";

const required = (label: string) =>
  z
    .string({ message: `${label} is a required field.` })
    .trim()
    .min(1, { message: `${label} is a required field.` })
    .max(120);

export const checkout = {
  placeOrder: defineAction({
    accept: "form",
    input: z.object({
      firstName: required("First name"),
      lastName: required("Last name"),
      company: z.string().trim().max(120).optional(),
      country: z
        .string({ message: "Country / Region is a required field." })
        .trim()
        .length(2, { message: "Country / Region is a required field." }),
      address1: required("Street address"),
      address2: z.string().trim().max(120).optional(),
      postcode: required("Postcode / ZIP"),
      city: required("Town / City"),
      state: z.string().trim().max(120).optional(),
      phone: required("Phone"),
      email: z.email({ message: "Please enter a valid email address." }),
      notes: z.string().trim().max(1000).optional(),
      paymentMethod: z.enum(["bacs", "cheque", "cod"], {
        message: "Please select a payment method.",
      }),
    }),
    handler: async ({ email, paymentMethod, notes, ...billing }, { locals }) => {
      const { data, error } = await CartService.placeOrder(
        locals.supabase,
        locals.cartSessionId,
        {
          email,
          paymentMethod,
          note: notes,
          billing: {
            first_name: billing.firstName,
            last_name: billing.lastName,
            company: billing.company ?? "",
            country: billing.country,
            address_1: billing.address1,
            address_2: billing.address2 ?? "",
            postcode: billing.postcode,
            city: billing.city,
            state: billing.state ?? "",
            phone: billing.phone,
          },
        },
      );

      if (error || !data) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error?.message ?? "Could not place your order.",
        });
      }
      return { orderKey: data.order_key, orderNumber: data.order_number };
    },
  }),
};
