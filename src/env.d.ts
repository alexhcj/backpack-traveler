/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient<
      import("./types/supabase").Database
    >;
    user: import("@supabase/supabase-js").User | null;
    /** Guest cart cookie (`bt_cart`), null when absent. */
    cartSessionId: string | null;
  }
}

interface Window {
  __MAP_MARKERS__?: Array<{
    destination: string;
    description: string;
    slug: string;
    image: {
      url: string;
      alt: string;
    };
    lat: number;
    lng: number;
  }>;
}
