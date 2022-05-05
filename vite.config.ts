import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: [
        'src/entry-point-1.ts',
        'src/entry-point-2.ts',
      ],
      external: [
        '/img/aaaSMPTE-color-bars.png',
        '/img/zzzSMPTE-color-bars.png'
      ],
    }
  },
  plugins: [vue()],
  // resolve: {
  //   alias: {
  //     '@': fileURLToPath(new URL('./src', import.meta.url))
  //   }
  // }
})
