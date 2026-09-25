/// <reference types="astro/client" />

import type { Phien } from './lib/phien';

declare global {
  namespace App {
    interface Locals {
      /** Chỉ có trên /noi-bo và chỉ khi đã đăng nhập. Middleware đặt vào. */
      phien?: Phien;
      coDatabase?: boolean;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly PUBLIC_CHI_NHANH?: string;
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
