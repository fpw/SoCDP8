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

import { Box, Button, Divider, FileButton, Select, Switch, Title } from "@mantine/core";
import { PC04Model } from "../../../models/peripherals/PC04Model";
import { BAUD_RATES, BaudRate } from "../../../types/PeripheralTypes";
import { downloadData } from "../../../util";
import { PaperTapeBox } from "../common/PaperTapeBox";

export function PC04(props: { model: PC04Model }) {
    return (
        <>
            <ConfigBox {...props} />
            <ReaderBox {...props} />
            <Divider />
            <PunchBox {...props} />
        </>
    );
}

function ConfigBox(props: { model: PC04Model }) {
    const { model } = props;
    const conf = model.useState(state => state.conf);

    return (
        <Box>
            <Select
                label="Baud Rate"
                value={conf.baudRate.toString()}
                onChange={val => {
                    if (val !== null) {
                        const rate = Number.parseInt(val) as BaudRate;
                        void model.updateConfig({ ...conf, baudRate: rate });
                    }
                }}
                data={BAUD_RATES.map(x => ({ value: x.toString(), label: x.toString() }))}
            />
        </Box>
    );
}

function ReaderBox(props: { model: PC04Model }) {
    const { model } = props;
    const readerActive = model.useState(state => state.readerActive);

    return (
        <Box mt={2}>
            <Title order={6}>Reader</Title>

            <PaperTapeBox tape={model.readerTape} reverse={false} />

            <Box>
                <FileButton onChange={f => void onLoadFile(f, model)}>
                    { props => <Button {...props}>Load Tape</Button> }
                </FileButton>
                <Switch label="Reader On" checked={readerActive} onChange={ev => void model.setReaderActive(ev.currentTarget.checked)}/>
            </Box>
        </Box>
    );
}

async function onLoadFile(file: File | null, model: PC04Model) {
    if (file) {
        await model.loadTape(file);
    }
}

function PunchBox(props: { model: PC04Model }) {
    const { model } = props;
    const punchActive = model.useState(state => state.punchActive);

    async function download() {
        const buffer = model.punchTape.useTape.getState().tapeState.buffer;
        await downloadData(Uint8Array.from(buffer), "punch-pc04.bin");
    }

    return (
        <Box mt={2}>
            <Title order={6}>Punch</Title>

            <PaperTapeBox tape={model.punchTape} reverse={true} />

            <Box>
                <Button onClick={() => model.clearPunch()}>New Tape</Button>
                <Button onClick={() => void download()}>Download Tape</Button>
                <Button onClick={() => model.addPunchLeader()}>Feed</Button>
                <Switch label="Punch On" onChange={evt => void model.setPunchActive(evt.target.checked)} checked={punchActive} />
            </Box>
        </Box>
    );
}
