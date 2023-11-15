import { LRLanguage, LanguageSupport, foldInside, foldNodeProp } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./parser";

const parserWithMeta = parser.configure({
    props: [
        styleTags({
            "CLC": t.controlOperator,
            "Origin/...": t.processingInstruction,
            "Comment": t.lineComment,
            "Symbol": t.constant(t.variableName),
            "Label/Symbol": t.labelName,
            "Assign/Symbol": t.definitionOperator,
            "PseudoStatement/...": t.keyword,
            "Integer": t.number,
            "Float": t.regexp,
            "MacroBody": t.regexp,
            "Separator": t.separator,
            "ASCII": t.character,
            "ParenExpr": t.controlOperator,
        }),
        foldNodeProp.add({
            "MacroBody": foldInside,
        })
    ],
});

const language = LRLanguage.define({
    parser: parserWithMeta,
    languageData: {
        commentTokens: { line: "/" },
    },
});

export function yamasLanguage() {
    return new LanguageSupport(language, []);
}
