import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署在仓库子路径（<user>.github.io/<repo>/）时取消下行注释。
  // base: '/OldManBeng/',
  server: {
    port: 3100,
  },
  build: {
    // 单页游戏不需要 sourcemap 进产物
    sourcemap: false,
  },
});
