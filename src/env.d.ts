/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="./data/appearances.yml.d.ts" />

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        RESEND_API_KEY: string;
        RESEND_TO_EMAIL: string;
        RESEND_FROM_EMAIL: string;
        CLOUDFLARE_SITE_KEY: string;
        CLOUDFLARE_SECRET_KEY: string;
      };
    };
  }
}

declare namespace astroHTML.JSX {
  export interface FormHTMLAttributes {
    toolname?: string;
    tooldescription?: string;
  }
  export interface InputHTMLAttributes {
    toolparamdescription?: string;
  }
}
