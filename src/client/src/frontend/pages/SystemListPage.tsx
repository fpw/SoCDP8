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

import { useState } from "react";
import { SoCDP8 } from "../../models/SoCDP8";
import { DeviceID } from "../../types/PeripheralTypes";
import { getDefaultSysConf, SystemConfiguration } from "../../types/SystemConfiguration";
import { SystemForm } from "../components/system/SystemForm";
import { Accordion, Box, Button, Group, List, Table, Title } from "@mantine/core";

export function SystemListPage(props: { pdp8: SoCDP8 }) {
    const [formBusy, setFormBusy] = useState<boolean>(false);
    const [open, setOpen] = useState<string | null>(null);
    const activeSys = props.pdp8.useStore(state => state.activeSystem)!;
    const systems = props.pdp8.useStore(state => state.systemList);

    async function addSystem(s: SystemConfiguration) {
        setFormBusy(true);
        await onNewSystem(props.pdp8, s);
        setFormBusy(false);
        setOpen(null);
    }

    return (<>
        <Title order={4}>Manage Systems</Title>

        <Accordion value={open} onChange={setOpen}>
            <Accordion.Item value="New System">
                <Accordion.Control>New System</Accordion.Control>
                <Accordion.Panel>
                    <Box>
                        <SystemForm
                            initialState={getDefaultSysConf()}
                            onSubmit={s => void addSystem(s)}
                            buttonEnabled={!formBusy}
                        />
                    </Box>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>

        <Box mt="xs">
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Td>Name</Table.Td>
                        <Table.Td>Core</Table.Td>
                        <Table.Td>Extensions</Table.Td>
                        <Table.Td>Peripherals</Table.Td>
                        <Table.Td>Actions</Table.Td>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    { systems.map(s =>
                        <SystemEntry
                            key={s.id}
                            pdp8={props.pdp8}
                            system={s}
                            active={s.id == activeSys.id}
                        />
                    )}
                </Table.Tbody>
            </Table>
        </Box>
    </>);
}

function SystemEntry(props: { pdp8: SoCDP8, system: SystemConfiguration, active: boolean }) {
    const [busy, setBusy] = useState<boolean>(false);

    async function activate() {
        setBusy(true);
        await activateSystem(props.pdp8, props.system);
        setBusy(false);
    }

    async function del() {
        setBusy(true);
        await deleteSystem(props.pdp8, props.system);
        setBusy(false);
    }

    return (
        <Table.Tr>
            <Table.Td>
                <Box style={{ fontWeight: props.active ? "bold" : undefined }}>
                    {props.system.name}
                </Box>
            </Table.Td>
            <Table.Td>
                {(props.system.maxMemField + 1) * 4} kiW
            </Table.Td>
            <Table.Td>
                <List>
                    { props.system.maxMemField > 0 && <List.Item>MC8/I</List.Item> }
                    { props.system.cpuExtensions.eae && <List.Item>KE8/I</List.Item> }
                    { props.system.cpuExtensions.kt8i && <List.Item>KT8/I</List.Item> }
                    { props.system.cpuExtensions.bsw && <List.Item>BSW</List.Item> }
                </List>
            </Table.Td>
            <Table.Td>
                <List>
                    { props.system.peripherals.map(conf =>
                        <List.Item key={conf.id}>{getPeripheralName(conf.id)}</List.Item>
                    )}
                </List>
            </Table.Td>
            <Table.Td>
                <Button.Group>
                    <Button disabled={busy} onClick={() => void activate()}>
                        Activate
                    </Button>
                    <Button disabled={busy} onClick={() => void del()}>
                        Delete
                    </Button>
                </Button.Group>
            </Table.Td>
        </Table.Tr>
    );
}

function getPeripheralName(id: DeviceID): string {
    switch (id) {
        case DeviceID.DEV_ID_CPU:   return "PDP-8";
        case DeviceID.DEV_ID_PT08:  return "PT08";
        case DeviceID.DEV_ID_PC04:  return "PC04";
        case DeviceID.DEV_ID_TC08:  return "TC08";
        case DeviceID.DEV_ID_RF08:  return "RF08";
        case DeviceID.DEV_ID_DF32:  return "DF32";
        case DeviceID.DEV_ID_TT1:   return "TT1";
        case DeviceID.DEV_ID_TT2:   return "TT2";
        case DeviceID.DEV_ID_TT3:   return "TT3";
        case DeviceID.DEV_ID_TT4:   return "TT4";
        case DeviceID.DEV_ID_KW8I:  return "KW8I";
        case DeviceID.DEV_ID_RK08:  return "RK08";
        case DeviceID.DEV_ID_RK8E:  return "RK8E";
        default: return "Unknown";
    }
}

async function onNewSystem(pdp8: SoCDP8, state: SystemConfiguration) {
    try {
        await pdp8.createNewSystem(state);
    } catch(e) {
        if (e instanceof Error) {
            alert(`Creating state failed: ${e.message}`);
        } else {
            alert("Creating state failed");
        }
    }
}

async function activateSystem(pdp8: SoCDP8, state: SystemConfiguration) {
    try {
        await pdp8.activateSystem(state.id);
    } catch(e) {
        if (e instanceof Error) {
            alert(`Activating state failed: ${e.message}`);
        } else {
            alert("Activating state failed");
        }
    }
}

async function deleteSystem(pdp8: SoCDP8, state: SystemConfiguration) {
    if (!window.confirm(`Delete system '${state.name}'?`)) {
        return;
    }

    try {
        await pdp8.deleteSystem(state.id);
    } catch(e) {
        if (e instanceof Error) {
            alert(`Deleting system failed: ${e.message}`);
        } else {
            alert("Deleting system failed");
        }
    }
}
