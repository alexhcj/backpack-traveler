import { createClient } from "@supabase/supabase-js";
import type { Json } from "../types/database";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ContentType = "post" | "destination";

export type Database = {
  public: {
    Tables: {
      // Engagements (likes) table
      engagement: {
        Row: {
          id: number;
          slug: string;
          type: ContentType;
          ip_hash: string;
          created_at: string;
        };
        Insert: {
          slug: string;
          type: ContentType;
          ip_hash: string;
        };
        Update: {
          slug?: string;
          type?: ContentType;
          ip_hash?: string;
        };
      };
      // Subscriptions table
      subscriptions: {
        Row: {
          id: number;
          name: string;
          email: string;
          country: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          email: string;
          country: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          email?: string;
          country?: string;
          is_active?: boolean;
        };
      };
      // Book reviews table
      book_reviews: {
        Row: {
          id: string;
          book_id: string;
          rating: number;
          review: string;
          reviewer_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          book_id: string;
          rating: number;
          review: string;
          reviewer_name: string;
        };
        Update: {
          book_id?: string;
          rating?: number;
          review?: string;
          reviewer_name?: string;
        };
      };
      // Books table
      books: {
        Row: {
          id: string;
          sku: string;
          slug: string;
          title: string;
          destination: string;
          description: string;
          excerpt: string;
          chapters: string[];
          price: number;
          discount: number | null;
          quantity: number; // Available stock
          published_date: string | null;
          cover_image_url: string | null;
          tags: string[] | null;
          weight_g: number | null;
          width_mm: number | null;
          height_mm: number | null;
          length_mm: number | null;
          review_ids: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          slug: string;
          title: string;
          destination: string;
          description: string;
          excerpt: string;
          chapters: string[];
          price: number;
          discount?: number | null;
          quantity: number;
          published_date?: string | null;
          cover_image_url?: string | null;
          tags?: string[] | null;
          weight_g?: number | null;
          width_mm?: number | null;
          height_mm?: number | null;
          length_mm?: number | null;
          review_ids?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          slug?: string;
          title?: string;
          destination?: string;
          description?: string;
          excerpt?: string;
          chapters?: string[];
          price?: number;
          discount?: number | null;
          quantity?: number;
          published_date?: string | null;
          cover_image_url?: string | null;
          tags?: string[] | null;
          weight_g?: number | null;
          width_mm?: number | null;
          height_mm?: number | null;
          length_mm?: number | null;
          review_ids?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // Carts table
      carts: {
        Row: {
          id: string;
          user_id: string | null; // null for guest carts
          session_id: string | null; // for guest users
          created_at: string;
          updated_at: string;
          expires_at: string | null; // for abandoned cart cleanup
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // Cart items table
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          book_id: string;
          quantity: number;
          price_at_addition: number; // Store price at time of adding
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          book_id: string;
          quantity: number;
          price_at_addition: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          book_id?: string;
          quantity?: number;
          price_at_addition?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      // Orders table for completed purchases
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          cart_id: string;
          status:
            | "pending"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          total_amount: number;
          shipping_address: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          cart_id: string;
          status?:
            | "pending"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          total_amount: number;
          shipping_address: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          cart_id?: string;
          status?:
            | "pending"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          total_amount?: number;
          shipping_address?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // Function to reserve book quantity
      reserve_book_quantity: {
        Args: {
          book_id: string;
          quantity: number;
        };
        Returns: boolean;
      };
      // Function to release reserved quantity
      release_book_quantity: {
        Args: {
          book_id: string;
          quantity: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
