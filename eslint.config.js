import js from '@eslint/js';
import globals from 'globals';
import playwright from 'eslint-plugin-playwright';

export default [{
  name: 'global',
  ignores: [
    'node_modules/**',
    'test/fixtures/**',
    'dist/**',
    'tmp/**',
    'src/tmp/**'
  ]
}, {
  name: 'test',
  files: ['test/playwright/*.js'],
  ...playwright.configs['flat/recommended']
}, {
  name: 'src-node',
  files: ['src/build*.js', 'src/index.js', 'webpack.prod.config.js'],
  languageOptions: {
    globals: {
      ...globals.node
    }
  },
  rules: {
    ...js.configs.recommended.rules,
    indent: [2, 2, {
      SwitchCase: 1,
      MemberExpression: 1
    }],
    quotes: [2, 'single'],
    'dot-notation': [2, {allowKeywords: true}]
  }
}, {
  name: 'src-browser',
  files: ['src/editable-object.js'],
  languageOptions: {
    globals: {
      ...globals.browser
    }
  },
  rules: {
    ...js.configs.recommended.rules
  }
}];
