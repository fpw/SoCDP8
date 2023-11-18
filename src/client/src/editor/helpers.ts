import { ExternalTokenizer, Stack } from "@lezer/lr";
import { DelimitedString, MacroArgument, MacroSymbol, UndelimitedString } from "./parser.terms.js";
import { Context } from "./YamasLanguage.js";

export function specializeSymbol(input: string, stack: Stack): number {
    const ctx = stack.context as Context;
    if (ctx.macros.has(input)) {
        return MacroSymbol;
    }
    return -1;
}

export const readDelimitedString = new ExternalTokenizer((input, stack) => {
    const delim = input.next;
    let str = "";
    while (true) {
        const c = input.advance();
        if (c == delim) {
            input.advance();
            break;
        } else if (c == "\n".charCodeAt(0) || c == -1) {
            break;
        } else {
            str += String.fromCharCode(c);
        }
    }
    input.acceptToken(DelimitedString);
});

const stringDelims = ["\r", "\n", ";", "/"].map(c => c.charCodeAt(0));
export const readUndelimitedString = new ExternalTokenizer((input, stack) => {
    let str = "";
    while (true) {
        const c = input.advance();
        if (stringDelims.includes(c) || c == -1) {
            break;
        } else {
            str += String.fromCharCode(c);
        }
    }
    input.acceptToken(UndelimitedString);
});

export const readMacroArguments = new ExternalTokenizer((input, stack) => {
    let arg = "";
    if (input.next == 0x0D || input.next == 0x0A) {
        return;
    }

    while (true) {
        const c = input.advance();
        if (c == 0x2C) { // comma
            input.acceptToken(MacroArgument);
        } if (c == 0x0D || c == 0x0A) {
            input.acceptToken(MacroArgument);
            break;
        } else if (c == -1) {
            break;
        } else {
            arg += String.fromCharCode(c);
        }
    }
});
