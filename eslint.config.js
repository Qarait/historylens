export default [
  {
    ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**'],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        TextDecoder: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        IntersectionObserver: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        console: 'readonly',
        HistoryLensApi: 'readonly',
        HistoryLensKeyEvents: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-useless-escape': 'error',
    },
  },
  {
    files: ['api/**/*.js', 'tests/**/*.js', 'e2e/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        document: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
