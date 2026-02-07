export default [
  {
    files: ["Triple R Marketing/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        chrome: "readonly",
        document: "readonly",
        window: "readonly",
        console: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        DOMParser: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-redeclare": "error",
      "no-constant-condition": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      eqeqeq: ["warn", "smart"],
    },
  },
  {
    ignores: ["node_modules/**"],
  },
];
