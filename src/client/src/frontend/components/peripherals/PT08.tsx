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
import "xterm/css/xterm.css";
import { PT08Model } from "../../../models/peripherals/PT08Model";
import { BaudRate, BAUD_RATES } from "../../../types/PeripheralTypes";
import { downloadData } from "../../../util";
import { PaperTapeBox } from "../common/PaperTapeBox";

export function PT08(props: {model: PT08Model}) {
    return (
        <section>
            <ConfigBox {...props} />

            <TerminalBox {...props} />

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1">Virtual Keyboard</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Container>
                        <VirtualKeyboard {...props} />
                    </Container>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1">Reader &amp; Punch</Typography>
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

function VirtualKeyboard(props: {model: PT08Model}) {
    const [layout, setLayout] = useState<string>("default");
    const { model } = props;
    const conf = model.useState(state => state.conf!);

    const onKey = (key: string) => {
        switch (key) {
            case "{shift}":
            case "{lock}":
                setLayout(cur => (cur == "default" ? "shift" : "default"))
                break;
            case "{enter}":
                void model.onRawKey("\r");
                break;
            case "{space}":
                void model.onRawKey(" ");
                break;
            case "{tab}":
                void model.onRawKey("\t");
                break;
            case "{bksp}":
                void model.onRawKey("\b");
                break;
            default:
                void model.onRawKey(key);
        }
    };

    return (
        <Box mt={1}>
            <Keyboard
                baseClass={`keyboard${conf.id}`}
                layoutName={layout}
                onKeyPress={(button: string) => onKey(button)}
            />
        </Box>
    );
}

function ConfigBox(props: {model: PT08Model}) {
    const { model } = props;
    const conf = model.useState(state => state.conf!);

    return (<Box>
        <FormGroup row>
            <FormControl>
                <FormLabel component="legend">Baud Rate</FormLabel>
                <Select
                    value={conf.baudRate}
                    onChange={(evt) => {
                        const rate = Number.parseInt(evt.target.value as string) as BaudRate;
                        void model.updateConfig({...conf, baudRate: rate});
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
                        checked={conf.eightBit}
                        onChange={(evt) => {
                            const bit8 = evt.target.checked;
                            void model.updateConfig({...conf, eightBit: bit8});
                        }}
                    />
                }
                labelPlacement="start"
                label="Set 8th bit"
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={conf.autoCaps}
                        onChange={(evt) => {
                            const caps = evt.target.checked;
                            void model.updateConfig({...conf, autoCaps: caps});
                        }}
                    />
                }
                labelPlacement="start"
                label="Auto Caps"
            />
        </FormGroup>
    </Box>);
}

function TerminalBox(props: {model: PT08Model}) {
    const { model } = props;

    const termRef = useCallback((node: HTMLDivElement) => {
        if (!node) {
            return;
        }
        const term = model.terminal;
        term.resize(80, 25);
        term.open(node);
    }, [model.terminal]);

    return (
        <>
            <Box mt={1}>
                <div ref={termRef}></div>
            </Box>

            <Box mt={1} mb={3}>
                <Button variant="contained" onClick={() => model.terminal.reset()}>
                    Clear Output
                </Button>
            </Box>
        </>
    );
};

function ReaderBox(props: {model: PT08Model}) {
    const { model } = props;
    const tapeInput = useRef<HTMLInputElement>(null);
    const readerTape = model.readerTape;
    const readerActive = model.useState(state => state.readerActive);

    return (
        <Box mt={2}>
            <Typography component="h6" variant="h6">Reader</Typography>

            <PaperTapeBox tape={readerTape} reverse={false} />

            <FormGroup row>
                <FormControl>
                    <input ref={tapeInput} type="file" onChange={evt => void onLoadFile(evt, model)} hidden />
                    <Button variant="outlined" color="primary" onClick={() => tapeInput?.current?.click()}>Load Tape</Button>
                </FormControl>
                <FormControlLabel
                    control={<Switch onChange={evt => void model.setReaderActive(evt.target.checked)} checked={readerActive} />}
                    labelPlacement="start"
                    label="Reader On"
                />
            </FormGroup>
        </Box>
    );
}

async function onLoadFile(evt: ChangeEvent, model: PT08Model) {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    void model.loadTape(target.files[0]);
}

function PunchBox(props: {model: PT08Model}) {
    const { model } = props;
    const punchActive = model.useState(state => state.punchActive);

    async function download() {
        const buffer = model.punchTape.useTape.getState().tapeState.buffer;
        await downloadData(Uint8Array.from(buffer), "punch-pt08.bin")
    }

    return (
        <Box mt={2}>
            <Typography component="h6" variant="h6">Punch</Typography>

            <PaperTapeBox tape={model.punchTape} reverse={true} />

            <FormGroup row>
                <FormControl>
                    <Button variant="outlined" color="primary" onClick={() => model.clearPunch()}>New Tape</Button>
                </FormControl>
                <FormControl>
                    <Button variant="outlined" color="primary" onClick={() => void download()}>Download Tape</Button>
                </FormControl>
                <FormControl>
                    <Button variant="outlined" color="primary" onClick={() => model.addPunchLeader()}>Leader</Button>
                </FormControl>
                <FormControlLabel
                    control={<Switch onChange={evt => void model.setPunchActive(evt.target.checked)} checked={punchActive} />}
                    labelPlacement="start"
                    label="Punch On"
                />
            </FormGroup>
        </Box>
    );
}
