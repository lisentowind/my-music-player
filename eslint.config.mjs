import antfu from "@antfu/eslint-config";

export default antfu(
  {
    ignores: ["dist/**", "node_modules/**", "src-tauri/**", "docs/**"],
    jsonc: false,
    markdown: false,
    stylistic: false,
    toml: false,
    typescript: true,
    vue: true,
    yaml: false,
  },
  {
    rules: {
      "node/prefer-global/process": "off",
      "perfectionist/sort-imports": "off",
    },
  },
  {
    files: ["**/*.vue"],
    rules: {
      "vue/html-self-closing": "off",
      "vue/multi-word-component-names": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
  },
);
