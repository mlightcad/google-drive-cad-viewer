import eslintConfigPrettier from 'eslint-config-prettier'
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import jsLint from '@eslint/js'
import tsLint from 'typescript-eslint'

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,mts}'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module'
      }
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    plugins: {
      'simple-import-sort': pluginSimpleImportSort
    },
    rules: {
      'simple-import-sort/imports': ['error']
    }
  },
  jsLint.configs.recommended,
  ...tsLint.configs.recommended,
  {
    ignores: ['node_modules', 'dist', 'public', '**/*.d.ts']
  },
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      quotes: ['error', 'single']
    }
  }
]
