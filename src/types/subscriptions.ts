import type { Database } from "../lib/supabase";

export type TSubscription =
  Database["public"]["Tables"]["subscriptions"]["Row"];
export type TSubscriptionInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];
export type TSubscriptionUpdate =
  Database["public"]["Tables"]["subscriptions"]["Update"];

export interface ISubscriptionFormData {
  name: string;
  email: string;
  country: string;
}

export interface ISubscriptionServiceRO<T = TSubscription> {
  data: T | null;
  error: Error | null;
}

export interface ISubscriptionListRO {
  data: TSubscription[] | null;
  error: Error | null;
}
