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
import { observer } from "mobx-react-lite";
import React, { ChangeEvent } from "react";
import { PaperTape } from "../../models/PaperTape";
import { BaudRate, BAUD_RATES, PC04Configuration } from "../../types/PeripheralTypes";
import { downloadData } from "../../util";
import { PaperTapeBox } from "./PaperTapeBox";

export interface PC04Props {
    conf: PC04Configuration;
    onConfigChange(conf: PC04Configuration): void;

    readerTape?: PaperTape;
    readerActive: boolean;
    onReaderActivationChange(state: boolean): void;
    onReaderTapeLoad(tape: File): void;

    punchTape: PaperTape;
    punchActive: boolean;
    onPunchActivationChange(state: boolean): void;
    onPunchClear(): void;
    onPunchLeader(): void;
}

export function PC04(props: PC04Props) {
    const tapeInput = React.useRef<HTMLInputElement>(null);

    return (
        <section>
            <ConfigBox {...props} />

            <ReaderBox {...props} />
            <Divider />
            <PunchBox {...props} />
        </section>
    );
}

const ConfigBox: React.FunctionComponent<PC04Props> = observer(props =>
    <Box>
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
        </FormGroup>
    </Box>
);

const ReaderBox: React.FunctionComponent<PC04Props> = observer(props => {
    const tapeInput = React.useRef<HTMLInputElement>(null);

    return (
        <Box mt={2}>
            <Typography component='h6' variant='h6'>Reader</Typography>

            <PaperTapeBox tape={props.readerTape} reverse={false} />

            <FormGroup row>
                <FormControl>
                    <input ref={tapeInput} type='file' onChange={evt => onLoadFile(evt, props)} hidden/>
                    <Button variant='outlined' color='primary' onClick={() => tapeInput?.current?.click()}>Load Tape</Button>
                </FormControl>
                <FormControlLabel
                    control={<Switch onChange={(evt: ChangeEvent<HTMLInputElement>) => props.onReaderActivationChange(evt.target.checked)} checked={props.readerActive} />}
                    labelPlacement='start'
                    label='Reader On'
                />
            </FormGroup>
        </Box>
    );
});

function onLoadFile(evt: React.ChangeEvent, props: PC04Props): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    props.onReaderTapeLoad(target.files[0]);
}

const PunchBox: React.FunctionComponent<PC04Props> = observer(props =>
    <Box mt={2}>
        <Typography component='h6' variant='h6'>Punch</Typography>

        <PaperTapeBox tape={props.punchTape} reverse={true} />

        <FormGroup row>
            <FormControl>
                <Button variant='outlined' color='primary' onClick={() => props.onPunchClear()}>New Tape</Button>
            </FormControl>
            <FormControl>
                <Button variant='outlined' color='primary' onClick={() => downloadData(Uint8Array.from(props.punchTape.buffer), "punch.bin")}>Download Tape</Button>
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
