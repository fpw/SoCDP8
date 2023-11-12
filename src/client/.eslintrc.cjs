module.exports = {
    "plugins": ["@typescript-eslint", "@stylistic"],
    "extends": [
        "plugin:@typescript-eslint/strict",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": [
            "./tsconfig.json",
        ],
    },
    "rules": {
        // Style
        "@stylistic/brace-style": ["error", "1tbs"],
        "@stylistic/max-len": ["error", { "code": 120 }],
        "@stylistic/semi": "error",
        "@stylistic/no-tabs": "error",
        "@stylistic/spaced-comment": ["error", "always", { "markers": ["/"] }],
        "@stylistic/no-trailing-spaces": "error",
        "@stylistic/member-delimiter-style": ["error", {
            "singleline": { "delimiter": "comma", "requireLast": false },
            "multiline": { "delimiter": "semi", "requireLast": true },
        }],
        "@stylistic/object-curly-spacing": ["error", "always"],
        "@stylistic/comma-spacing": "error",
        "@stylistic/keyword-spacing": "error",
        "@stylistic/func-call-spacing": "error",
        "@stylistic/space-before-blocks": "error",
        "@stylistic/space-before-function-paren": ["error", "never"],
        "@stylistic/space-infix-ops": "error",
        "@stylistic/type-annotation-spacing": "error",
        "@stylistic/indent": ["error", 4, { "SwitchCase": 1 }],
        "@stylistic/block-spacing": ["error", "always"],
        "@stylistic/eol-last": ["error", "always"],
        "@stylistic/arrow-spacing": "error",
        "@stylistic/jsx-quotes": ["error", "prefer-double"],
        "@stylistic/quotes": ["error", "double", { "avoidEscape": true }],

        // Lint
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/require-await": "off",
    },
    "ignorePatterns": [
        ".eslintrc.cjs",
        "public/",
        "coverage/",
        "dist/",
        "build/",
        "node_modules/",
    ],
};
