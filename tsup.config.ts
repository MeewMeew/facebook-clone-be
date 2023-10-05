import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'build',
  splitting: false,
  clean: true,
  minify: true,
  shims: true,
  target: 'node18',
  platform: 'node',
  silent: true,
  format: ['esm'],  
  bundle: true,  
})