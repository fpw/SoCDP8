import stylistic from "@stylistic/eslint-plugin";
import parserTs from "@typescript-eslint/parser";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "eslint.config.mjs",
            "postcss.config.cjs",
            "src/editor/parser.ts",
            "**/public/",
            "**/coverage/",
            "**/build/",
            "**/node_modules/",
        ],
    },
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        plugins: {
            "@stylistic": stylistic,
        },
        languageOptions: {
            parser: parserTs,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        rules: {
            "@stylistic/brace-style": ["error", "1tbs"],
            "@stylistic/semi": "error",
            "@stylistic/no-tabs": "error",

            "@stylistic/spaced-comment": ["error", "always", {
                markers: ["/"],
            }],

            "@stylistic/no-trailing-spaces": "error",
            "@typescript-eslint/prefer-nullish-coalescing": "off",
            "@stylistic/member-delimiter-style": ["error", {
                singleline: {
                    delimiter: "comma",
                    requireLast: false,
                },

                multiline: {
                    delimiter: "semi",
                    requireLast: true,
                },
            }],

            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/comma-spacing": "error",
            "@stylistic/keyword-spacing": "error",
            "@stylistic/function-call-spacing": "error",
            "@stylistic/space-before-blocks": "error",
            "@stylistic/space-before-function-paren": ["error", "never"],
            "@stylistic/space-infix-ops": "error",
            "@stylistic/type-annotation-spacing": "error",

            "@stylistic/indent": ["error", 4, {
                SwitchCase: 1,
            }],

            "@stylistic/block-spacing": ["error", "always"],
            "@stylistic/eol-last": ["error", "always"],
            "@stylistic/arrow-spacing": "error",
            "@stylistic/jsx-quotes": ["error", "prefer-double"],

            "@stylistic/quotes": ["error", "double", {
                avoidEscape: true,
            }],

            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/prefer-regexp-exec": "off",
            "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true } ],
        },
    }
);
