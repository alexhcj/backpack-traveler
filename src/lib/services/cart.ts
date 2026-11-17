import type { PostgrestError } from "@supabase/supabase-js";
import type { Json } from "../../types/supabase";
import type {
  ICartServiceRO,
  TCart,
  TOrderReceived,
  TPlacedOrder,
} from "../../types/cart";

// Per-request client (`Astro.locals.supabase`).
type Client = App.Locals["supabase"];

/** Postgres `P0001` messages come from our RPCs and are user-facing. */
function toError(error: PostgrestError): Error {
  if (error.code === "P0001" || error.code === "22023") {
    return new Error(error.message);
  }
  console.error("CartService error:", error);
  return new Error("Something went wrong. Please try again.");
}

async function call<T>(
  query: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
): Promise<ICartServiceRO<T>> {
  const { data, error } = await query;
  if (error) return { data: null, error: toError(error) };
  return { data: data as T, error: null };
}

// The generated types want a string; the RPCs accept null for signed-in users.
const sid = (sessionId: string | null) => sessionId as string;

export class CartService {
  static get(client: Client, sessionId: string | null) {
    return call<TCart>(client.rpc("cart_get", { p_session_id: sid(sessionId) }));
  }

  static add(
    client: Client,
    sessionId: string | null,
    bookId: string,
    quantity: number,
  ) {
    return call<TCart>(
      client.rpc("cart_add_item", {
        p_session_id: sid(sessionId),
        p_book_id: bookId,
        p_quantity: quantity,
      }),
    );
  }

  /** quantity 0 removes the line */
  static update(
    client: Client,
    sessionId: string | null,
    items: { id: string; quantity: number }[],
  ) {
    return call<TCart>(
      client.rpc("cart_update_items", {
        p_session_id: sid(sessionId),
        p_items: items as unknown as Json,
      }),
    );
  }

  static remove(client: Client, sessionId: string | null, itemId: string) {
    return call<TCart>(
      client.rpc("cart_remove_item", {
        p_session_id: sid(sessionId),
        p_item_id: itemId,
      }),
    );
  }

  static merge(client: Client, sessionId: string) {
    return call<TCart>(client.rpc("merge_guest_cart", { p_session_id: sessionId }));
  }

  static placeOrder(
    client: Client,
    sessionId: string | null,
    order: {
      email: string;
      billing: Record<string, string>;
      shipping?: Record<string, string> | null;
      paymentMethod: "bacs" | "cheque" | "cod";
      note?: string | null;
    },
  ) {
    return call<TPlacedOrder>(
      client.rpc("place_order", {
        p_session_id: sid(sessionId),
        p_email: order.email,
        p_billing: order.billing,
        p_shipping: (order.shipping ?? undefined) as Json | undefined,
        p_payment_method: order.paymentMethod,
        p_note: order.note ?? undefined,
      }),
    );
  }

  static getOrder(client: Client, orderKey: string) {
    return call<TOrderReceived | null>(
      client.rpc("order_get", { p_order_key: orderKey }),
    );
  }
}
