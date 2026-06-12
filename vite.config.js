import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base 必須是 repo 名稱,GitHub Pages 才能正確載入資源
export default defineConfig({
  base: "/worldcup-sweepstake/",
  plugins: [react()],
});
