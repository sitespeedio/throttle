import prettier from 'eslint-plugin-prettier';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  unicorn.configs.recommended,
  {
    plugins: {
      prettier
    },

    languageOptions: {
      globals: {
        ...globals.node
      },

      ecmaVersion: 'latest',
      sourceType: 'module'
    },

    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'none'
        }
      ],

      'no-extra-semi': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'no-unexpected-multiline': 'off',
      'no-return-await': 'error',
      'unicorn/filename-case': 'off'
    }
  }
];
