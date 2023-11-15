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
import { Button, ButtonGroup, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import CodeMirror, { StateCommand, keymap } from "@uiw/react-codemirror";
import React, { useState } from "react";
import { BinTapeReader, CodeError, SymbolData, SymbolType, Yamas, YamasOutput } from "yamas";
import { SoCDP8 } from "../../models/SoCDP8";
import { numToOctal } from "../../util";
import { yamasLanguage } from "../../editor/YamasLanguage";

const defaultSource =
`/ YAMAS PDP-8 ASSEMBLER
PAGE 1
    CLA CLL
    TAD (1234)
    HLT
`;

export function CodePage(props: { pdp8: SoCDP8 }) {
    const [src, setSrc] = useState(defaultSource);
    const [output, setOutput] = useState<YamasOutput>();
    const [memState, setMemState] = useState<(number | undefined)[]>([]);

    function assemble() {
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
    }

    async function load() {
        for (const [addr, val] of memState.entries()) {
            if (val === undefined) {
                continue;
            }
            await props.pdp8.writeCore(addr, [val]);
        }
    }

    return (<>
        <Typography component="h1" variant="h4">Code Editor</Typography>

        <CodeMirror
            value={src}
            height="800px"
            indentWithTab={false}
            theme="dark"
            extensions={[
                yamasLanguage(),
                keymap.of([{
                    key: "Tab",
                    run: indentOrInsertTab,
                    shift: indentLess
                }])
            ]}
            onChange={v => setSrc(v)}
        />

        <ButtonGroup variant="outlined">
            <Button onClick={() => assemble()}>Assemble</Button>
            <Button
                onClick={() => void load()}
                disabled={!output || output.binary.length == 0}
            >
                Load into Machine
            </Button>
        </ButtonGroup>

        { output && <>
            { output.errors.length > 0 &&
                <ErrorTable errors={output.errors} />
            }
            { memState.length > 0 && false &&
                <MemTable state={memState} />
            }
            <SymbolTable symbols={[...output.symbols.values()]} />
        </>}
    </>);
}

export const indentOrInsertTab: StateCommand = ({ state, dispatch }) => {
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

function ErrorTable(props: { errors: ReadonlyArray<CodeError> }) {
    const errs = props.errors;

    return (<>
        <Typography variant="h5">Errors</Typography>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Line</TableCell>
                    <TableCell>Column</TableCell>
                    <TableCell>Error</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                { errs.map((err, i) =>
                    <TableRow key={i}>
                        <TableCell>{err.line}</TableCell>
                        <TableCell>{err.col}</TableCell>
                        <TableCell>{err.message}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </>);
}

function MemTable(props: { state: (number | undefined)[] }) {
    const mem = props.state;

    return (<>
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell width={"15%"}>Address</TableCell>
                    <TableCell>Data</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                { mem.map((data, addr) => data ?
                    <TableRow key={addr}>
                        <TableCell>{numToOctal(addr, 5)}</TableCell>
                        <TableCell>{numToOctal(data, 4)}</TableCell>
                    </TableRow>
                    : <React.Fragment key={addr} />)}
            </TableBody>
        </Table>
    </>);
}

function SymbolTable(props: { symbols: SymbolData[] }) {
    const symbols = props.symbols;

    return (<>
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell width={"15%"}>Symbol</TableCell>
                    <TableCell width={"15%"}>Type</TableCell>
                    <TableCell>Value</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                { symbols.map(sym => <React.Fragment key={sym.name}>
                    { (sym.type == SymbolType.Param || sym.type == SymbolType.Label) &&
                        <TableRow key={sym.name}>
                            <TableCell>{sym.name}</TableCell>
                            <TableCell>{SymbolType[sym.type]}</TableCell>
                            <TableCell>{numToOctal(sym.value, 4)}</TableCell>
                        </TableRow>
                    }
                </React.Fragment>)}
            </TableBody>
        </Table>
    </>);
}
