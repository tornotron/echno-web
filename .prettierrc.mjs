// .prettierrc.mjs
/** @type {import("prettier").Config} */
const config = {
    semi: true,
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'always',
    printWidth: 80,
    plugins: ['prettier-plugin-tailwindcss'],
};

export default config;