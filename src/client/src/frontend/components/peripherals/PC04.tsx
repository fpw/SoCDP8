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

import { Box, Button, Divider, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Select, Switch, Typography } from "@mui/material";
import { ChangeEvent, useRef } from "react";
import { PC04Model } from "../../../models/peripherals/PC04Model";
import { BaudRate, BAUD_RATES } from "../../../types/PeripheralTypes";
import { downloadData } from "../../../util";
import { PaperTapeBox } from "../common/PaperTapeBox";

export function PC04(props: {model: PC04Model}) {
    return (
        <>
            <ConfigBox {...props} />
            <ReaderBox {...props} />
            <Divider />
            <PunchBox {...props} />
        </>
    );
}

function ConfigBox(props: {model: PC04Model}) {
    const { model } = props;
    const conf = model.useState(state => state.conf!);

    return (
        <Box>
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
            </FormGroup>
        </Box>
    );
}

function ReaderBox(props: {model: PC04Model}) {
    const { model } = props;
    const tapeInput = useRef<HTMLInputElement>(null);
    const readerActive = model.useState(state => state.readerActive);

    return (
        <Box mt={2}>
            <Typography component="h6" variant="h6">Reader</Typography>

            <PaperTapeBox tape={model.readerTape} reverse={false} />

            <FormGroup row>
                <FormControl>
                    <input ref={tapeInput} type="file" onChange={evt => void onLoadFile(evt, model)} hidden/>
                    <Button variant="outlined" onClick={() => tapeInput?.current?.click()}>Load Tape</Button>
                </FormControl>
                <FormControlLabel
                    control={<Switch onChange={(evt: ChangeEvent<HTMLInputElement>) => void model.setReaderActive(evt.target.checked)} checked={readerActive} />}
                    labelPlacement="start"
                    label="Reader On"
                />
            </FormGroup>
        </Box>
    );
}

async function onLoadFile(evt: ChangeEvent, model: PC04Model) {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    await model.loadTape(target.files[0]);
}

function PunchBox(props: {model: PC04Model}) {
    const { model } = props;
    const punchActive = model.useState(state => state.punchActive);

    async function download() {
        const buffer = model.punchTape.useTape.getState().tapeState.buffer;
        await downloadData(Uint8Array.from(buffer), "punch-pc04.bin")
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
