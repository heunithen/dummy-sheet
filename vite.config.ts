import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// GitHub Pages project site: https://heunithen.github.io/dummy-sheet/
export default defineConfig({
  base: '/dummy-sheet/',
  plugins: [svelte()],
})
