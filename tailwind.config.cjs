/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: [
      './site/index.html',
      './site/src/**/*.{ts,tsx}',
      './packages/aria-kernel/src/**/*.{ts,tsx}',
      './packages/source-viewer/src/**/*.{ts,tsx}',
      './apps/*/src/**/*.{ts,tsx}',
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
