import js from '@eslint/js';
import globals from 'globals';

export default [{
  name: 'global',
  ignores: [
    'node_modules/**',
    'dist/**',
    'tmp/**'
  ]
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
  files: ['editable*.js'],
  languageOptions: {
    globals: {
      ...globals.browser
    }
  },
  rules: {
    ...js.configs.recommended.rules
  }
}];
