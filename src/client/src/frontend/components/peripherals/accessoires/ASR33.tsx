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
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Divider, FormControl, FormControlLabel, FormGroup, Switch, Typography } from "@mui/material";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import Keyboard, { KeyboardReactInterface } from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "xterm/css/xterm.css";
import { PT08Model } from "../../../../models/peripherals/PT08Model";
import { downloadData } from "../../../../util";
import { PaperTapeBox } from "../../common/PaperTapeBox";
import "./ASR33.css";

export function ASR33(props: {model: PT08Model}) {
    return (<>
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
    </>);
}

const keyboardOptions: KeyboardReactInterface["options"] = {
    mergeDisplay: true,
    layout: {
        default: [
            "1 2 3 4 5 6 7 8 9 0 : - {hereis}",
            "{altmode} Q W E R T Y U I O P {lf} {return}",
            "{ctrl} A S D F G H J K L ; {rubout}",
            "{shift} Z X C V B N M , . / {shift}",
            "{space}"
        ],
        shift: [
            '! " # $ % & / ( ) 0 * = {hereis}',
            "{altmode} Q W E R T Y U I O @ {lf} {return}",
            "{ctrl} A S D F G H J [ \\ + {rubout}",
            "{deshift} Z X C V B ^ ] < > ? {shift}",
            "{space}"
        ],
        ctrl: [
            "1 2 3 4 5 6 7 8 9 0 : - {hereis}",
            "{altmode} Q W E R T Y U I O P {lf} {return}",
            "{dectrl} A S D F G H J K L ; {rubout}",
            "{shift} Z X C V B N M , . / {shift}",
            "{space}"
        ],
        ctrlShift: [
            '! " # $ % & / ( ) 0 * = {hereis}',
            "{altmode} Q W E R T Y U I O @ {lf} {return}",
            "{dectrl} A S D F G H J [ \\ + {rubout}",
            "{deshift} Z X C V B ^ ] < > ? {shift}",
            "{space}"
        ],
    },
    display: {
        "{shift}": "SHIFT",
        "{deshift}": "SHIFT",
        "{ctrl}": "CTRL",
        "{dectrl}": "CTRL",

        "{altmode}": "ALT<br/>MODE",
        "{return}": "RE-<br/>TURN",
        "{hereis}": "HERE<br/>IS",
        "{lf}": "LINE<br/>FEED",
        "{rubout}": "RUB<br/>OUT",
    },
    buttonTheme: [
        { class: "activeKey", buttons: "{deshift} {dectrl}" },
        { class: "space", buttons: "{space}" }
    ],
};

function VirtualKeyboard(props: {model: PT08Model}) {
    const [shift, setShift] = useState(false);
    const [ctrl, setCtrl] = useState(false);
    const { model } = props;
    const conf = model.useState(state => state.conf!);

    async function sendHereIs() {
        await model.onRawKey("S");
        await model.onRawKey("O");
        await model.onRawKey("C");
        await model.onRawKey("D");
        await model.onRawKey("P");
        await model.onRawKey("8");
    }

    const onKey = (key: string) => {
        let chr: number | undefined;
        switch (key) {
            case "{shift}":
            case "{deshift}":
                if (shift && ctrl) {
                    setCtrl(false);
                }
                setShift(!shift);
                break;
            case "{ctrl}":
            case "{dectrl}":
                if (shift && ctrl) {
                    setShift(false);
                }
                setCtrl(!ctrl);
                break;
            case "{hereis}":
                void sendHereIs();
                break;
            case "{altmode}":
                chr = 0x7D;
                break;
            case "{return}":
                chr = 0x0D;
                break;
            case "{lf}":
                chr = 0x0A;
                break;
            case "{rubout}":
                chr = 0x7F;
                break;
            case "{space}":
                chr = 0x20;
                break;
            default:
                chr = key.charCodeAt(0);
                if (ctrl) {
                    if (shift) {
                        chr |= 0x20;
                    } else {
                        chr &= ~0x40;
                    }
                }
                setShift(false);
                setCtrl(false);
        }
        if (chr) {
            const str = String.fromCharCode(chr);
            void model.onRawKey(str);
        }
    };

    let layout = "default";
    if (shift) {
        if (ctrl) {
            layout = "ctrlShift";
        } else {
            layout = "shift";
        }
    } else if (ctrl) {
        layout = "ctrl";
    }

    return (
        <Box mt={1} sx={{activeButton: {backgroundColor: "yellow"}}}>
            <Keyboard
                baseClass={`keyboard${conf.id}`}
                layoutName={layout}
                onKeyPress={(button: string) => onKey(button)}
                { ...keyboardOptions }
            />
        </Box>
    );
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
