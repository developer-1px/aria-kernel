import { defineConfig } from 'tsup'
import { globSync } from 'node:fs'

/**
 * Multi-entry build — src/ 의 모든 .ts 파일을 dist/ 에 같은 구조로 미러링.
 *
 * 이유: consumer가 `@interactive-os/aria-kernel/layout/nodes` 식 subpath로 import 하고 module
 * augmentation(`declare module '@interactive-os/aria-kernel/layout/nodes'`)도 작동해야 한다.
 * 단일 번들이면 augmentation이 실패하므로 entry 단위로 분리.
 */
const entries = globSync('src/**/*.ts', { cwd: import.meta.dirname })
  .filter((p) => !p.endsWith('.test.ts') && !p.endsWith('.d.ts'))

export default defineConfig({
  entry: entries,
  format: ['esm', 'cjs'],
  dts: { resolve: true, compilerOptions: { composite: false } },
  tsconfig: './tsconfig.json',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  splitting: true,
  treeshake: true,
  external: ['react', 'react-dom', 'zod'],
})
