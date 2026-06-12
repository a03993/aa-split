/** @type {import('prettier').Config} */
module.exports = {
  semi: false,
  printWidth: 100,
  tabWidth: 2,
  trailingComma: "all",
  plugins: ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  importOrder: [
    "^(react|react-dom)$",
    "^(next|next/.*)$",
    "<THIRD_PARTY_MODULES>",
    "^@/(.*)$",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
