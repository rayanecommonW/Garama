import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

/**
 * Backend ESLint configuration.
 * Optimized for Bun/Node.js server code with Socket.IO game server logic.
 */
const eslintConfig = [
  js.configs.recommended,
  prettierConfig,
  {
    ignores: ['node_modules/**', 'dist/**', '*.d.ts'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Bun globals
        Bun: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      // Disable base rule in favor of TypeScript/unused-imports
      'no-unused-vars': 'off',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'off', // Handled by unused-imports
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Unused imports - auto-fixable
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import organization
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/first': 'error',

      // General code quality
      'no-console': 'off', // Console is fine in backend
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'prefer-arrow-callback': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'multi-line'],
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'error',
      'no-else-return': ['warn', { allowElseIf: false }],
      'object-shorthand': 'warn',
      'spaced-comment': ['warn', 'always', { markers: ['/'] }],

      // Prevent common bugs
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'no-return-await': 'warn',
      'require-await': 'warn',
      'no-param-reassign': ['warn', { props: false }],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'warn',

      // Server-specific: allow throwing literals for quick error handling
      'no-throw-literal': 'warn',
    },
  },
];

export default eslintConfig;
