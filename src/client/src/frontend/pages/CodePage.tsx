/*
 *   SoCDP8 - A PDP-8/I implementation on a SoC
 *   Copyright (C) 2019 Folke Will <folko@solhost.org>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Affero General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Affero General Public License for more details.
 *
 *   You should have received a copy of the GNU Affero General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { indentLess, indentMore } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { vscodeDarkInit } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { ReactCodeMirrorRef, StateCommand, keymap } from "@uiw/react-codemirror";
import React, { ForwardedRef, forwardRef, useCallback, useRef, useState } from "react";
import { BinTapeReader, CodeError, SymbolData, SymbolType, Yamas, YamasOutput } from "yamas";
import { yamasLanguage } from "../../editor/YamasLanguage";
import { SoCDP8 } from "../../models/SoCDP8";
import { downloadData, numToOctal } from "../../util";
import { Button, Group, Table, Title } from "@mantine/core";

export function CodePage(props: { pdp8: SoCDP8 }) {
    const [output, setOutput] = useState<YamasOutput>();
    const [memState, setMemState] = useState<(number | undefined)[]>([]);
    const editorRef = useRef<ReactCodeMirrorRef>(null);

    const assemble = useCallback(() => {
        const src = editorRef.current?.view?.state.doc.toString();
        if (!src) {
            return;
        }

        const asm = new Yamas({ loadPrelude: true });
        console.time("parse");
        const ast = asm.addInput("input.pa", src);
        console.timeEnd("parse");
        console.time("assemble");
        const out = asm.run();
        console.timeEnd("assemble");
        setOutput(out);

        const mem = new BinTapeReader(out.binary).read();
        setMemState(mem);
    }, [editorRef]);

    async function load() {
        for (const [addr, val] of memState.entries()) {
            if (val === undefined) {
                continue;
            }
            await props.pdp8.writeCore(addr, [val]);
        }
    }

    async function downloadAntares() {
        let str = "";
        for (let i = 0; i < 4096; i++) {
            str += (memState[i] ?? 0).toString(16) + " ";
        }
        await downloadData(new TextEncoder().encode(str), "mem.ex");
    }

    return (<>
        <Title order={4}>Code Editor</Title>
        <Editor ref={editorRef} />
        <Button.Group>
            <Button onClick={() => assemble()}>Assemble</Button>
            <Button
                onClick={() => void load()}
                disabled={!output || output.binary.length == 0}
            >
                Load into Machine
            </Button>
            <Button
                onClick={() => void downloadAntares()}
                disabled={!output || output.binary.length == 0}
            >
                Download Antares Dump
            </Button>
        </Button.Group>

        { output && <>
            { output.errors.length > 0 &&
                <ErrorTable errors={output.errors} />
            }
            { memState.length > 0 && false &&
                <MemTable state={memState} />
            }
            { output.symbols.size > 0 &&
                <SymbolTable symbols={output.symbols} />
            }
        </>}
    </>);
}

const initialSource =
    `
/ AC/MQ blinker from http://dustyoldcomputers.com/pdp8/pdp8i/testprogs/acmqblinker.html, start at 0000

PAGE 0
loop,   ISZ delay       / create a delay
        JMP loop
        CLA             / clear AC so we can load it
        TAD value       / get value
        MQL             / stash AC into MQ
        TAD value       / fetch value again
        CMA             / complement AC
        ISZ value       / get to next value
        NOP             / ignore possible "skip" from ISZ
        JMP loop        / and do it all again
*20
delay, 0
value, 0
$
`;

const theme = vscodeDarkInit();

const Editor = forwardRef((props: unknown, ref: ForwardedRef<ReactCodeMirrorRef>) => {
    return (<>
        <CodeMirror
            ref={ref}
            value={initialSource}
            height="75vh"
            indentWithTab={false}
            theme={ theme }
            extensions={[
                yamasLanguage(),
                keymap.of([{
                    key: "Tab",
                    run: indentOrInsertTab,
                    shift: indentLess
                }])
            ]}
        />
    </>);
});

const indentOrInsertTab: StateCommand = ({ state, dispatch }) => {
    if (state.readOnly) {
        return false;
    }
    if (state.selection.ranges.some((r) => !r.empty)) {
        return indentMore({ state, dispatch });
    }
    dispatch(
        state.update(
            state.replaceSelection(
                state.facet(indentUnit)
            ), {
                scrollIntoView: true, userEvent: "input"
            }
        )
    );
    return true;
};

function ErrorTable(props: { errors: readonly CodeError[] }) {
    const errs = props.errors;

    return (<>
        <Title variant="h5">Errors</Title>
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Td>Line</Table.Td>
                    <Table.Td>Column</Table.Td>
                    <Table.Td>Error</Table.Td>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                { errs.map((err, i) =>
                    <Table.Tr key={i}>
                        <Table.Td>{err.line}</Table.Td>
                        <Table.Td>{err.col}</Table.Td>
                        <Table.Td>{err.message}</Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    </>);
}

function MemTable(props: { state: (number | undefined)[] }) {
    const mem = props.state;

    return (<>
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Td width={"15%"}>Address</Table.Td>
                    <Table.Td>Data</Table.Td>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                { mem.map((data, addr) => data ?
                    <Table.Tr key={addr}>
                        <Table.Td>{numToOctal(addr, 5)}</Table.Td>
                        <Table.Td>{numToOctal(data, 4)}</Table.Td>
                    </Table.Tr>
                    : <React.Fragment key={addr} />)}
            </Table.Tbody>
        </Table>
    </>);
}

function SymbolTable(props: { symbols: ReadonlyMap<string, SymbolData> }) {
    const symbols = [...props.symbols.values()]
        .filter(s => (s.type == SymbolType.Param && !s.fixed) ||
                     (s.type == SymbolType.Label))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (<>
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Td width={"15%"}>Symbol</Table.Td>
                    <Table.Td width={"15%"}>Type</Table.Td>
                    <Table.Td>Value</Table.Td>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                { symbols.map(sym => <React.Fragment key={sym.name}>
                    { (sym.type == SymbolType.Param || sym.type == SymbolType.Label) &&
                        <Table.Tr key={sym.name}>
                            <Table.Td>{sym.name}</Table.Td>
                            <Table.Td>{SymbolType[sym.type]}</Table.Td>
                            <Table.Td>{numToOctal(sym.value, 4)}</Table.Td>
                        </Table.Tr>
                    }
                </React.Fragment>)}
            </Table.Tbody>
        </Table>
    </>);
}
