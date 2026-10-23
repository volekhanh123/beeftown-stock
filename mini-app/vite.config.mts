import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zaloMiniApp from "zmp-vite-plugin";

// zmp-vite-plugin: build ra thư mục www và tạo app-config.json cho Zalo.
export default defineConfig({
  plugins: [react(), zaloMiniApp()],
  server: { port: 3000 },
});
