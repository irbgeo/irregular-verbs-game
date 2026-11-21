import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'tests/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/**/*.ts',
      ],
      // main.ts is wiring only; it is checked by hand inside VK.
      exclude: [
        'src/main.ts',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
})
