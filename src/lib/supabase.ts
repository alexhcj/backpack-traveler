import { createClient } from "@supabase/supabase-js";

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
    };
  };
};
