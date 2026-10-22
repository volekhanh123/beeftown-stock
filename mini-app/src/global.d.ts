declare global {
  interface Window {
    ZaloJavaScriptInterface?: { getStatusBarHeight(): number };
  }
}

export {};
