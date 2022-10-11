/* eslint-disable quote-props */
module.exports = {
  'root': true,
  'env': {
    'commonjs': true,
    'es6': true,
    'node': true
  },
  'extends': [
    'standard',
    'plugin:@typescript-eslint/recommended',
    'plugin:mocha/recommended'
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 2020
  },
  'rules': {
    'semi': ['error', 'always'],
    'no-prototype-builtins': 'off',
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ]
  },
  'plugins': [
    '@typescript-eslint'
  ]
};
