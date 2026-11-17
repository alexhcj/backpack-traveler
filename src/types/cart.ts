// Shapes returned by the cart/order RPCs (see supabase/migrations).

export type TCartLine = {
  id: string;
  book_id: string;
  slug: string;
  title: string;
  cover_image: string | null;
  regular_price: number;
  unit_price: number;
  quantity: number;
  stock: number;
  line_total: number;
};

export type TCart = {
  id: string | null;
  items: TCartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
};

export type TPlacedOrder = {
  order_id: string;
  order_number: number;
  order_key: string;
  total: number;
};

export type TOrderReceived = {
  order_number: number;
  status: string;
  created_at: string;
  email: string;
  payment_method: "bacs" | "cheque" | "cod";
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  customer_note: string | null;
  subtotal: number;
  shipping_total: number;
  total: number;
  items: {
    title: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
};

export interface ICartServiceRO<T = TCart> {
  data: T | null;
  error: Error | null;
}
