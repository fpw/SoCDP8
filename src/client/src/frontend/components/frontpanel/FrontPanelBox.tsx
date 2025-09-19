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

import { Button, Card, Checkbox, FileButton, Group, List, Modal, NavLink } from "@mantine/core";
import { useState } from "react";
import { ProgramSnippet, ProgramSnippets } from "../../../models/ProgramSnippets";
import { SoCDP8 } from "../../../models/SoCDP8";
import { DeviceID } from "../../../types/PeripheralTypes";
import { downloadData, loadFile } from "../../../util";
import { FrontPanel } from "./FrontPanel";

export function FrontPanelBox(props: { pdp8: SoCDP8 }) {
    const [throttle, setThrottle] = useState(false);
    const [busy, setBusy] = useState(false);
    const [showSnippets, setShowSnippets] = useState(false);
    const simSpeed = props.pdp8.useStore(state => state.simSpeed);
    const sys = props.pdp8.useStore(state => state.activeSystem!);

    async function saveState() {
        setBusy(true);
        await props.pdp8.saveCurrentState();
        setBusy(false);
    }

    async function loadSnippet(snippet: ProgramSnippet) {
        for (const s of snippet.snippets) {
            await props.pdp8.writeCore(s.start, s.data);
        }
        setShowSnippets(false);
    }

    async function toggleThrottle() {
        await props.pdp8.setThrottleControl(!throttle);
        setThrottle(!throttle);
    }

    async function uploadCore(file: File) {
        if (file.size > 65536) {
            alert("File too big, max allowed size is 65536 bytes.");
            return;
        }
        const data = await loadFile(file);
        await props.pdp8.loadCoreDump(data);
    }

    async function downloadCore() {
        const dump = await props.pdp8.getCoreDump();
        await downloadData(dump, "core.dat");
    }

    return (<>
        <Card mb="sm">
            <Card.Section>
                <FrontPanel pdp8={props.pdp8} />
            </Card.Section>
            <Group justify="space-between">
                <Button.Group borderWidth={15}>
                    <Button size="compact-md" onClick={() => setShowSnippets(true)}>
                        Load Snippet
                    </Button>
                    <Button size="compact-md" onClick={() => void saveState()} disabled={busy}>
                        Save State
                    </Button>
                    <FileButton onChange={file => file ? void uploadCore(file) : undefined}>
                        { props => <Button size="compact-md" {...props}>Upload Dump</Button> }
                    </FileButton>
                    <Button size="compact-md" onClick={() => void downloadCore()}>
                        Download Dump
                    </Button>
                    <Button size="compact-md" onClick={() => void props.pdp8.clearCore()}>
                        Clear Core
                    </Button>
                </Button.Group>
                <Group>
                    Simulation Speed: { simSpeed.toFixed(2) }
                    <Checkbox label="Control" checked={throttle} onChange={() => void toggleThrottle()} />
                </Group>
            </Group>
        </Card>
        <SnippetDialog
            open={showSnippets}
            onClose={() => setShowSnippets(false)}
            onSelect={(snippet) => void loadSnippet(snippet)}
            devices={sys.peripherals.map(p => p.id)}
        />
    </>);
}

interface SnippetProps {
    onSelect: ((s: ProgramSnippet) => void);
    open: boolean; onClose: (() => void);
    devices: DeviceID[];
}

function SnippetDialog(props: SnippetProps) {
    return (
        <Modal opened={props.open} onClose={props.onClose} title="Select Snippet">
            <List>
                { ProgramSnippets.filter(s => s.requirements.every(dev => props.devices.includes(dev))).map(snippet =>
                    <NavLink key={snippet.label} onClick={() => props.onSelect(snippet)} label={snippet.label} description={snippet.desc} />
                )}
            </List>
        </Modal>
    );
}
