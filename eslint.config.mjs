// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['{src,test,scripts}/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../../**'],
              message: 'Import through a path alias instead of climbing directories.',
            },
            {
              group: [
                '@app/shared/**',
                '@app/employees/**',
                '@app/document-types/**',
                '@app/requirements/**',
                '@app/stats/**',
              ],
              message: 'Import through the alias of the module itself.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/*/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['mongoose*', 'express*', '@nestjs/**'] },
      ],
    },
  },
  {
    files: ['src/*/application/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'mongoose*',
            'express*',
            '@nestjs/mongoose*',
            '@nestjs/platform-*',
          ],
        },
      ],
    },
  },
);
