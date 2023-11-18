import { LRLanguage, LanguageSupport, foldInside, foldNodeProp } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./parser.js";
import { ContextTracker } from "@lezer/lr";

export type Context = {
    macros: Set<string>;
};

const tracker = new ContextTracker<Context>({
    start: {
        macros: new Set(),
    },
});

const parserWithMeta = parser.configure({
    contextTracker: tracker,
    props: [
        styleTags({
            "CLC": t.controlOperator,
            "Origin/...": t.processingInstruction,
            "Comment": t.lineComment,
            "Symbol": t.tagName,
            "Label/Symbol": t.labelName,
            "Assign/Symbol": t.definitionOperator,
            "PseudoStatement/...": t.keyword,
            "Integer": t.integer,
            "Float": t.float,
            "MacroBody": t.regexp,
            "Separator": t.separator,
            "ASCII": t.literal,
            "ParenExpr": t.controlOperator,
            "DelimitedString UndelimitedString": t.string,
            "Invocation/MacroSymbol": t.macroName,
            "Invocation/MacroArgument": t.inserted,
        }),
        foldNodeProp.add({
            "MacroBody": foldInside,
        })
    ],
});

const language = LRLanguage.define({
    name: "PDP-8 Assembly",
    parser: parserWithMeta,
    languageData: {
        commentTokens: { line: "/" },
        closeBrackets: { brackets: ["(", "[", "<"] },
    },
});

export function yamasLanguage() {
    return new LanguageSupport(language, []);
}
