import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', '.visual', 'node_modules'] },

  // Application source.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // The render loop mutates Three.js objects in place by design.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // `info` is permitted for the texture-fallback notice: the verification
      // harness treats any warn or error as a failure, and a missing optional
      // asset is neither.
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    },
  },

  // Build and verification scripts run under Node — but the Playwright ones
  // also contain `page.evaluate` callbacks whose bodies are serialised and run
  // inside the browser, so both global sets are legitimate here.
  {
    extends: [js.configs.recommended],
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-console': 'off',
    },
  },
)
