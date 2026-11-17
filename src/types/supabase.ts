// Generated with Supabase MCP `generate_typescript_types` (project hzibisccskwlwouszepc).
// Regenerate after schema changes; do not edit by hand.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" };
  public: {
    Tables: {
      book_reviews: {
        Row: {
          book_id: string | null;
          created_at: string | null;
          id: string;
          rating: number;
          review: string | null;
          reviewer_name: string;
          updated_at: string | null;
        };
        Insert: {
          book_id?: string | null;
          created_at?: string | null;
          id?: string;
          rating: number;
          review?: string | null;
          reviewer_name: string;
          updated_at?: string | null;
        };
        Update: {
          book_id?: string | null;
          created_at?: string | null;
          id?: string;
          rating?: number;
          review?: string | null;
          reviewer_name?: string;
          updated_at?: string | null;
        };
        Relationships: Rel[];
      };
      book_views: {
        Row: {
          book_id: string | null;
          id: string;
          ip_address: unknown;
          referrer: string | null;
          session_id: string | null;
          user_id: string | null;
          viewed_at: string | null;
        };
        Insert: {
          book_id?: string | null;
          id?: string;
          ip_address?: unknown;
          referrer?: string | null;
          session_id?: string | null;
          user_id?: string | null;
          viewed_at?: string | null;
        };
        Update: {
          book_id?: string | null;
          id?: string;
          ip_address?: unknown;
          referrer?: string | null;
          session_id?: string | null;
          user_id?: string | null;
          viewed_at?: string | null;
        };
        Relationships: Rel[];
      };
      books: {
        Row: {
          cart_add_count: number | null;
          chapters: string[] | null;
          cover_image: string | null;
          created_at: string | null;
          description: string;
          destination: string;
          discount: number | null;
          excerpt: string;
          height_mm: number | null;
          id: string;
          length_mm: number | null;
          popularity_score: number | null;
          price: number;
          published_date: string | null;
          purchase_count: number | null;
          quantity: number;
          sku: string | null;
          slug: string;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
          weight_g: number | null;
          width_mm: number | null;
        };
        Insert: {
          cart_add_count?: number | null;
          chapters?: string[] | null;
          cover_image?: string | null;
          created_at?: string | null;
          description: string;
          destination: string;
          discount?: number | null;
          excerpt: string;
          height_mm?: number | null;
          id?: string;
          length_mm?: number | null;
          popularity_score?: number | null;
          price: number;
          published_date?: string | null;
          purchase_count?: number | null;
          quantity?: number;
          sku?: string | null;
          slug: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
          weight_g?: number | null;
          width_mm?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          book_id: string;
          cart_id: string;
          created_at: string | null;
          id: string;
          price_at_addition: number;
          quantity: number;
          updated_at: string | null;
        };
        Insert: {
          book_id: string;
          cart_id: string;
          created_at?: string | null;
          id?: string;
          price_at_addition: number;
          quantity: number;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: Rel[];
      };
      carts: {
        Row: {
          created_at: string | null;
          id: string;
          session_id: string | null;
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          session_id?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["carts"]["Insert"]>;
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          email: string | null;
          id: number;
          message: string | null;
          name: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: number;
          message?: string | null;
          name?: string | null;
          status?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: [];
      };
      engagement: {
        Row: {
          created_at: string | null;
          id: number;
          ip_hash: string;
          slug: string;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          ip_hash: string;
          slug: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["engagement"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          book_id: string | null;
          created_at: string;
          id: string;
          line_total: number | null;
          order_id: string;
          quantity: number;
          title: string;
          unit_price: number;
        };
        Insert: {
          book_id?: string | null;
          created_at?: string;
          id?: string;
          line_total?: number | null;
          order_id: string;
          quantity: number;
          title: string;
          unit_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: Rel[];
      };
      orders: {
        Row: {
          billing_address: Json;
          cart_id: string | null;
          created_at: string | null;
          customer_note: string | null;
          email: string;
          id: string;
          order_key: string;
          order_number: number;
          payment_method: string;
          shipping_address: Json;
          shipping_total: number;
          status: string;
          subtotal: number;
          total_amount: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          billing_address?: Json;
          cart_id?: string | null;
          created_at?: string | null;
          customer_note?: string | null;
          email: string;
          id?: string;
          order_key?: string;
          order_number?: never;
          payment_method?: string;
          shipping_address?: Json;
          shipping_total?: number;
          status?: string;
          subtotal?: number;
          total_amount: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: Rel[];
      };
      subscriptions: {
        Row: {
          country: string;
          created_at: string;
          email: string;
          id: number;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          country: string;
          created_at?: string;
          email: string;
          id?: number;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: {
      books_with_ratings: {
        Row: {
          chapters: string[] | null;
          cover_image: string | null;
          created_at: string | null;
          description: string | null;
          destination: string | null;
          discount: number | null;
          excerpt: string | null;
          height_mm: number | null;
          id: string | null;
          length_mm: number | null;
          popularity_score: number | null;
          price: number | null;
          published_date: string | null;
          quantity: number | null;
          rating: number | null;
          review_count: number | null;
          sku: string | null;
          slug: string | null;
          tags: string[] | null;
          title: string | null;
          updated_at: string | null;
          weight_g: number | null;
          width_mm: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_popularity_score: { Args: { book_id: string }; Returns: number };
      cart_add_item: {
        Args: { p_book_id: string; p_quantity?: number; p_session_id: string };
        Returns: Json;
      };
      cart_get: { Args: { p_session_id?: string }; Returns: Json };
      cart_remove_item: {
        Args: { p_item_id: string; p_session_id: string };
        Returns: Json;
      };
      cart_update_items: {
        Args: { p_items: Json; p_session_id: string };
        Returns: Json;
      };
      get_likes_count: { Args: { slug: string }; Returns: number };
      has_liked: { Args: { ip: string; slug: string }; Returns: boolean };
      increment_view_count: { Args: { book_id: string }; Returns: undefined };
      merge_guest_cart: { Args: { p_session_id: string }; Returns: Json };
      order_get: { Args: { p_order_key: string }; Returns: Json };
      place_order: {
        Args: {
          p_billing: Json;
          p_email: string;
          p_note?: string;
          p_payment_method?: string;
          p_session_id: string;
          p_shipping?: Json;
        };
        Returns: Json;
      };
      update_all_popularity_scores: { Args: never; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
