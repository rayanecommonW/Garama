import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

/**
 * Shared package ESLint configuration.
 * Stricter rules for shared code that is used across frontend and backend.
 */
const eslintConfig = [
  js.configs.recommended,
  prettierConfig,
  {
    ignores: ['node_modules/**', 'dist/**', '*.d.ts', '*.d.ts.map'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
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

      // TypeScript rules - stricter for shared code
      '@typescript-eslint/no-unused-vars': 'off', // Handled by unused-imports
      '@typescript-eslint/no-explicit-any': 'error', // Strict: no any in shared types
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
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
      'no-console': 'error', // No console in shared code
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
      'no-param-reassign': 'error', // Strict: no mutation in shared code
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
    },
  },
];

export default eslintConfig;
