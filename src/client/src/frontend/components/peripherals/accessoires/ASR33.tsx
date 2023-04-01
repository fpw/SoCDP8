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
import { ChangeEvent, useRef } from "react";
import { PT08Model } from "../../../../models/peripherals/PT08Model";
import { downloadData } from "../../../../util";
import { PaperTapeBox } from "../../common/PaperTapeBox";
import { ASR33Keyboard } from "./ASR33Keyboard";
import { VT100 } from "./VT100";

export function ASR33(props: {model: PT08Model}) {
    const set8 = props.model.useState(state => state.conf!.eightBit);

    return (<>
        <VT100 model={props.model} />
        <ASR33Keyboard set8={set8} onKey={chr => void props.model.onRawKey(String.fromCharCode(chr))} />
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
                    <Button variant="outlined" onClick={() => tapeInput?.current?.click()}>Load Tape</Button>
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
                    <Button variant="outlined" onClick={() => model.clearPunch()}>New Tape</Button>
                </FormControl>
                <FormControl>
                    <Button variant="outlined" onClick={() => void download()}>Download Tape</Button>
                </FormControl>
                <FormControl>
                    <Button variant="outlined" onClick={() => model.addPunchLeader()}>Feed</Button>
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
