import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      likes: {
        Row: {
          id: number;
          post_slug: string;
          ip_hash: string;
          created_at: string;
        };
        Insert: {
          post_slug: string;
          ip_hash: string;
        };
        Update: {
          post_slug?: string;
          ip_hash?: string;
        };
      };
    };
  };
};
