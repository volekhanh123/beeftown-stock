import React from "react";
import { createRoot } from "react-dom/client";
import { getSystemInfo } from "zmp-sdk";

import "zmp-ui/zaui.css";
import "./phong-chu";
import "./styles.css";

import UngDung from "./ung-dung";
import appConfig from "../app-config.json";
import { dangTrongZalo } from "./zalo";

if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig;
}

// Android: chừa chỗ cho thanh trạng thái vì app tự vẽ phần đầu trang (actionBarHidden).
try {
  if (dangTrongZalo() && getSystemInfo().platform === "android") {
    const cao = window.ZaloJavaScriptInterface?.getStatusBarHeight() ?? 0;
    document.body.style.setProperty(
      "--zaui-safe-area-inset-top",
      `${Math.round(cao / window.devicePixelRatio)}px`,
    );
  }
} catch {
  // Không lấy được chiều cao thanh trạng thái thì dùng mặc định của zmp-ui.
}

createRoot(document.getElementById("app")!).render(<UngDung />);
