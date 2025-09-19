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

import { Accordion, Box, Button, Divider, FileButton, Group, Switch, Title } from "@mantine/core";
import { useState } from "react";
import { PT08Model } from "../../../../models/peripherals/PT08Model";
import { downloadData } from "../../../../util";
import { PaperTapeBox } from "../../common/PaperTapeBox";
import { ASR33Keyboard } from "./ASR33Keyboard";
import { VT100 } from "./VT100";

export function ASR33(props: { model: PT08Model }) {
    const set8 = props.model.useState(state => state.conf!.eightBit);
    const [readerPunchOpen, setReaderPunchOpen] = useState<string | null>(null);

    return (<>
        <VT100 model={props.model} />
        <ASR33Keyboard set8={set8} onKey={chr => void props.model.onRawKey(String.fromCharCode(chr))} />
        <Accordion value={readerPunchOpen} onChange={setReaderPunchOpen} >
            <Accordion.Item value="Reader & Punch">
                <Accordion.Control>Reader & Punch</Accordion.Control>
                <Accordion.Panel>
                    <ReaderBox {...props} />
                    <Divider mt="xs" mb="xs" />
                    <PunchBox {...props} />
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    </>);
}

function ReaderBox(props: { model: PT08Model }) {
    const { model } = props;
    const readerTape = model.readerTape;
    const readerActive = model.useState(state => state.readerActive);

    return (
        <Box mt={2}>
            <Title order={6}>Reader</Title>

            <PaperTapeBox tape={readerTape} reverse={false} />

            <Group>
                <FileButton onChange={f => void onLoadFile(f, model)}>
                    { props => <Button {...props}>Load Tape</Button> }
                </FileButton>
                <Switch label="Reader On" checked={readerActive} onChange={ev => void model.setReaderActive(ev.currentTarget.checked)}/>
            </Group>
        </Box>
    );
}

async function onLoadFile(f: File | null, model: PT08Model) {
    if (f) {
        void model.loadTape(f);
    }
}

function PunchBox(props: { model: PT08Model }) {
    const { model } = props;
    const punchActive = model.useState(state => state.punchActive);

    async function download() {
        const buffer = model.punchTape.useTape.getState().tapeState.buffer;
        await downloadData(Uint8Array.from(buffer), "punch-pt08.bin");
    }

    return (
        <Box mt={2}>
            <Title order={6}>Punch</Title>

            <PaperTapeBox tape={model.punchTape} reverse={true} />

            <Group>
                <Button.Group>
                    <Button onClick={() => model.clearPunch()}>New Tape</Button>
                    <Button onClick={() => void download()}>Download Tape</Button>
                    <Button onClick={() => model.addPunchLeader()}>Feed</Button>
                </Button.Group>
                <Switch label="Punch On" onChange={evt => void model.setPunchActive(evt.target.checked)} checked={punchActive} />
            </Group>
        </Box>
    );
}
