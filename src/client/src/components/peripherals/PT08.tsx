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

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Divider, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Select, Switch, Typography } from "@mui/material";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { PaperTape } from "../../models/PaperTape";
import { BaudRate, BAUD_RATES, PT08Configuration } from "../../types/PeripheralTypes";
import { downloadData } from "../../util";
import { PaperTapeBox } from "./PaperTapeBox";

export interface PT08Props {
    conf: PT08Configuration;
    onConfigChange(conf: PT08Configuration): void;

    terminal: Terminal;

    readerTape: PaperTape;
    readerActive: boolean;
    onReaderActivationChange(state: boolean): void;
    onReaderTapeLoad(tape: File): void;

    punchTape: PaperTape;
    punchActive: boolean;
    onPunchActivationChange(state: boolean): void;
    onPunchClear(): void;
    onPunchLeader(): void;
    onKeyboard(key: string): void;
}

export function PT08(props: PT08Props) {
    return (
        <section>
            <ConfigBox {...props} />

            <TerminalBox {...props} />

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='body1'>Virtual Keyboard</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Container>
                        <VirtualKeyboard {...props} />
                    </Container>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='body1'>Reader &amp; Punch</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Container>
                        <ReaderBox {...props} />
                        <Divider />
                        <PunchBox {...props} />
                    </Container>
                </AccordionDetails>
            </Accordion>
        </section>
    );
}

function VirtualKeyboard(props: PT08Props) {
    const [layout, setLayout] = useState<string>("default");

    const onKey = (key: string) => {
        switch (key) {
            case "{shift}":
            case "{lock}":
                setLayout(cur => (cur == "default" ? "shift" : "default"))
                break;
            case "{enter}":
                props.onKeyboard("\r");
                break;
            case "{space}":
                props.onKeyboard(" ");
                break;
            case "{tab}":
                props.onKeyboard("\t");
                break;
            case "{bksp}":
                props.onKeyboard("\b");
                break;
            default:
                props.onKeyboard(key);
        }
    };

    return (
        <Box mt={1}>
            <Keyboard
                baseClass={`keyboard${props.conf.id}`}
                layoutName={layout}
                onKeyPress={(button: string) => onKey(button)}
            />
        </Box>
    );
}

function ConfigBox(props: PT08Props) {
    return (<Box>
        <FormGroup row>
            <FormControl>
                <FormLabel component="legend">Baud Rate</FormLabel>
                <Select
                    value={props.conf.baudRate}
                    onChange={(evt) => {
                        const rate = Number.parseInt(evt.target.value as string) as BaudRate;
                        props.onConfigChange({...props.conf, baudRate: rate});
                    }}
                >
                    {BAUD_RATES.map((b) => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControlLabel
                control={
                    <Switch
                        checked={props.conf.eightBit}
                        onChange={(evt) => {
                            const bit8 = evt.target.checked;
                            props.onConfigChange({...props.conf, eightBit: bit8});
                        }}
                    />
                }
                labelPlacement="start"
                label="Set 8th bit"
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={props.conf.autoCaps}
                        onChange={(evt) => {
                            const caps = evt.target.checked;
                            props.onConfigChange({...props.conf, autoCaps: caps});
                        }}
                    />
                }
                labelPlacement="start"
                label="Auto Caps"
            />
        </FormGroup>
    </Box>);
}

function TerminalBox(props: PT08Props) {
    const termRef = useCallback((node: HTMLDivElement) => {
        if (!node) {
            return;
        }
        const term = props.terminal;
        term.resize(80, 25);
        term.open(node);
    }, [props.terminal]);

    return (
        <>
            <Box mt={1}>
                <div ref={termRef}></div>
            </Box>

            <Box mt={1} mb={3}>
                <Button variant="contained" onClick={() => props.terminal.reset()}>
                    Clear Output
                </Button>
            </Box>
        </>
    );
};

function ReaderBox(props: PT08Props) {
    const tapeInput = useRef<HTMLInputElement>(null);

    return (
        <Box mt={2}>
            <Typography component='h6' variant='h6'>Reader</Typography>

            <PaperTapeBox tape={props.readerTape} reverse={false} />

            <FormGroup row>
                <FormControl>
                    <input ref={tapeInput} type='file' onChange={evt => onLoadFile(evt, props)} hidden />
                    <Button variant='outlined' color='primary' onClick={() => tapeInput?.current?.click()}>Load Tape</Button>
                </FormControl>
                <FormControlLabel
                    control={<Switch onChange={evt => props.onReaderActivationChange(evt.target.checked)} checked={props.readerActive} />}
                    labelPlacement='start'
                    label='Reader On'
                />
            </FormGroup>
        </Box>
    );
}

function onLoadFile(evt: ChangeEvent, props: PT08Props): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    props.onReaderTapeLoad(target.files[0]);
}

function PunchBox(props: PT08Props) {
    const punchTape = props.punchTape.useTape(state => state.state);

    return (
        <Box mt={2}>
            <Typography component='h6' variant='h6'>Punch</Typography>

            <PaperTapeBox tape={props.punchTape} reverse={true} />

            <FormGroup row>
                <FormControl>
                    <Button variant='outlined' color='primary' onClick={() => props.onPunchClear()}>New Tape</Button>
                </FormControl>
                <FormControl>
                    <Button variant='outlined' color='primary' onClick={() => void downloadData(Uint8Array.from(punchTape.buffer), "punch.bin")}>Download Tape</Button>
                </FormControl>
                <FormControl>
                    <Button variant='outlined' color='primary' onClick={() => props.onPunchLeader()}>Leader</Button>
                </FormControl>
                <FormControlLabel
                    control={<Switch onChange={evt => props.onPunchActivationChange(evt.target.checked)} checked={props.punchActive} />}
                    labelPlacement='start'
                    label='Punch On'
                />
            </FormGroup>
        </Box>
    );
}
