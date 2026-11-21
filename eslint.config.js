import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: [
      'dist/',
      'coverage/',
      'node_modules/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'max-lines-per-function': [
        'error',
        100,
      ],
    },
  },
  // The domain is pure rules: no UI, no platform, no VK.
  {
    files: [
      'src/domain/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/platform/**',
            '**/ui/**',
            '@vkontakte/*',
          ],
        },
      ],
    },
  },
)
