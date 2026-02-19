/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
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
