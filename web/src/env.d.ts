/// <reference types="astro/client" />

import type { Phien } from './lib/phien';
import type { NgonNguNB } from './lib/ngon-ngu-noi-bo';

declare global {
  namespace App {
    interface Locals {
      /** Chỉ có trên /noi-bo và chỉ khi đã đăng nhập. Middleware đặt vào. */
      phien?: Phien;
      coDatabase?: boolean;
      /** Ngôn ngữ giao diện nội bộ (cookie nb_ngon_ngu). Middleware đặt cho mọi đường dẫn /noi-bo. */
      nn?: NgonNguNB;
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
