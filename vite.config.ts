import { defineConfig } from 'vite'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import fsTree from './tooling/vite-plugins/fs'
import { inspectorPlugin } from './tooling/vite-plugins/inspector'

const spaFallback = () => ({
  name: 'spa-404-fallback',
  apply: 'build' as const,
  enforce: 'post' as const,
  writeBundle(_options: unknown, bundle: Record<string, { fileName?: string }>) {
    const indexEntry = Object.values(bundle).find((b) => b.fileName === 'index.html')
    if (!indexEntry) return
    const outDir = resolve(__dirname, 'dist')
    const src = resolve(outDir, 'index.html')
    if (!existsSync(src)) return
    copyFileSync(src, resolve(outDir, '404.html'))
  },
})

export default defineConfig({
  root: resolve(__dirname, 'apps/site'),
  base: process.env.GITHUB_PAGES ? '/aria-kernel/' : '/',
  publicDir: resolve(__dirname, 'apps/site/public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: [
      { find: /^zod-crud$/, replacement: resolve(__dirname, 'node_modules/zod-crud/dist/index.js') },
      { find: /^@p\/aria-kernel$/, replacement: resolve(__dirname, 'packages/aria-kernel/src/index.ts') },
      { find: /^@p\/aria-kernel\//, replacement: resolve(__dirname, 'packages/aria-kernel/src/') + '/' },
      { find: /^@p\/fs$/, replacement: resolve(__dirname, 'packages/fs/src/index.ts') },
      { find: /^@p\/fs\//, replacement: resolve(__dirname, 'packages/fs/src/') + '/' },
      { find: /^@p\/slides$/, replacement: resolve(__dirname, 'packages/slides/src/index.ts') },
      { find: /^@p\/slides\//, replacement: resolve(__dirname, 'packages/slides/src/') + '/' },
      { find: /^@p\/devtools$/, replacement: resolve(__dirname, 'packages/devtools/src/index.ts') },
      { find: /^@p\/devtools\//, replacement: resolve(__dirname, 'packages/devtools/src/') + '/' },
      { find: /^@p\/source-viewer$/, replacement: resolve(__dirname, 'packages/source-viewer/src/index.ts') },
      { find: /^@p\/source-viewer\//, replacement: resolve(__dirname, 'packages/source-viewer/src/') + '/' },
      { find: /^@p\/site$/, replacement: resolve(__dirname, 'apps/site/src/main.tsx') },
      { find: /^@p\/site\//, replacement: resolve(__dirname, 'apps/site/src/') + '/' },
      { find: /^@apps\/([^/]+)$/, replacement: resolve(__dirname, 'apps') + '/$1/src/index.ts' },
      { find: /^@apps\/([^/]+)\//, replacement: resolve(__dirname, 'apps') + '/$1/src/' },
    ],
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      routesDirectory: resolve(__dirname, 'apps/site/src/routes'),
      generatedRouteTree: resolve(__dirname, 'apps/site/src/routeTree.gen.ts'),
      autoCodeSplitting: true,
      // 컴포넌트 파일(PascalCase)은 라우트로 해석하지 않는다.
      // 라우트 파일은 모두 lowercase / dot-segment 규약(예: finder.$.tsx)을 따른다.
      routeFileIgnorePattern: '(^|/)[A-Z][^/]*\\.(tsx?|jsx?)$',
    }),
    react(),
    inspectorPlugin(),
    fsTree(),
    spaFallback(),
  ],
})
