import type {
  ISubscriptionFormData,
  ISubscriptionListRO,
  ISubscriptionServiceRO,
  TSubscriptionInsert,
  TSubscriptionUpdate,
} from "../../types/subscriptions";
import { supabase } from "../supabase";

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  static async subscribe(
    formData: ISubscriptionFormData,
  ): Promise<ISubscriptionServiceRO> {
    try {
      // Check if email already exists
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("email", formData.email)
        .single();

      if (existingSubscription) {
        // If subscription exists but is inactive, reactivate it
        if (!existingSubscription.is_active) {
          return this.updateSubscription(existingSubscription.id, {
            name: formData.name,
            country: formData.country,
            is_active: true,
          });
        }

        return {
          data: null,
          error: new Error("Email already subscribed"),
        };
      }

      // Create new subscription
      const insertData: TSubscriptionInsert = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        country: formData.country.trim(),
        is_active: true,
      };

      const { data, error } = await supabase
        .from("subscriptions")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Unsubscribe (soft delete by setting is_active to false)
   */
  static async unsubscribe(email: string): Promise<ISubscriptionServiceRO> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .update({ is_active: false })
        .eq("email", email.trim().toLowerCase())
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get subscription by email
   */
  static async getByEmail(email: string): Promise<ISubscriptionServiceRO> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get all active subscriptions
   */
  static async getActiveSubscriptions(): Promise<ISubscriptionListRO> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get subscriptions by country
   */
  static async getByCountry(country: string): Promise<ISubscriptionListRO> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("country", country.trim())
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update subscription details
   */
  static async updateSubscription(
    id: number,
    updates: TSubscriptionUpdate,
  ): Promise<ISubscriptionServiceRO> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get subscription count by country
   */
  static async getCountByCountry(): Promise<{
    data: { country: string; count: number }[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("country")
        .eq("is_active", true);

      if (error) {
        throw error;
      }

      // Group by country and count
      const countMap = new Map<string, number>();
      data?.forEach((sub) => {
        countMap.set(sub.country, (countMap.get(sub.country) || 0) + 1);
      });

      const result = Array.from(countMap.entries()).map(([country, count]) => ({
        country,
        count,
      }));

      return {
        data: result,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Check if email is subscribed
   */
  static async isSubscribed(email: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("is_active")
        .eq("email", email.trim().toLowerCase())
        .single();

      return data?.is_active ?? false;
    } catch {
      return false;
    }
  }
}
