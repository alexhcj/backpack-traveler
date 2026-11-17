import type { Database } from "./supabase";

export type { Json, Database } from "./supabase";

// Helper type exports
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type TOrder = Tables<"orders">;
export type TOrderItem = Tables<"order_items">;
