import type { SvgComponent } from "astro/types";

export interface ISocialLink {
  url: string;
  text: string;
  icon: SvgComponent;
}

export interface ISocial {
  social: string;
  url: string;
}
export interface IImageMetadata {
  [key: string]: string;
}
