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

import {
    Button, FormControl, FormControlLabel, FormGroup,
    FormLabel, Radio, RadioGroup, Slider, Switch, TextField
} from "@mui/material";
import { FormEvent } from "react";
import { DeviceID, PeripheralConfiguration, PT08Configuration, PT08Style } from "../../../types/PeripheralTypes";
import { getDefaultSysConf, SystemConfiguration } from "../../../types/SystemConfiguration";

export interface SystemFormProps {
    initialState: SystemConfiguration;
    onSubmit(state: SystemConfiguration): void;
    buttonEnabled: boolean;
}

export function SystemForm(props: SystemFormProps) {
    const coreMemoryMarks = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({
        value: i,
        label: `${(i + 1) * 4}`
    }));

    const pt08Marks = [0, 1, 2, 3, 4].map(i => ({
        value: i,
        label: `${i}`
    }));

    const s = props.initialState;

    const peripherals: DeviceID[] = s.peripherals.map(p => p.id);

    return (
        <form autoComplete="off" onSubmit={(ev) => props.onSubmit(toSystemConf(ev))}>
            <FormGroup>
                <FormControl component="fieldset">
                    <FormLabel component="legend">System Name</FormLabel>
                    <TextField required name="name" label="Name" variant="outlined" />
                </FormControl>

                <FormControl component="fieldset">
                    <FormLabel component="legend">CPU Extensions</FormLabel>
                    <FormControlLabel
                        control={<Switch name="eae" defaultChecked={s.cpuExtensions.eae} />}
                        label="KE8/I (EAE)"
                    />
                    <FormControlLabel
                        control={<Switch name="kt8i" defaultChecked={s.cpuExtensions.kt8i} />}
                        label="KT8/I (Time Sharing Option)"
                    />
                    <FormControlLabel
                        control={<Switch name="bsw" defaultChecked={s.cpuExtensions.bsw} />}
                        label="BSW instruction for 8/E programs"
                    />
                </FormControl>

                <FormControl component="fieldset">
                    <FormLabel component="legend">Core Memory (kiW)</FormLabel>
                    <Slider
                        defaultValue={s.maxMemField}
                        valueLabelDisplay="off"
                        step={1}
                        min={0}
                        max={7}
                        marks={coreMemoryMarks}
                        name="maxMemField"
                    />
                </FormControl>

                <FormControl component="fieldset">
                    <FormLabel component="legend">Basic I/O</FormLabel>
                    <FormControlLabel control={
                        <Switch name="serialLine" defaultChecked={peripherals.includes(DeviceID.DEV_ID_PT08)} />
                    } label="Serial Current Loop" />
                    <FormControlLabel control={
                        <Switch name="pc04" defaultChecked={peripherals.includes(DeviceID.DEV_ID_PC04)} />
                    } label="PC04 Reader / Punch" />
                </FormControl>

                <FormControl component="fieldset">
                    <FormLabel component="legend">DECtape</FormLabel>
                    <FormControlLabel control={
                        <Switch name="tc08" defaultChecked={peripherals.includes(DeviceID.DEV_ID_TC08)} />
                    } label="TC08 DECtape Controller" />
                </FormControl>

                <FormControl component="fieldset">
                    <FormLabel component="legend">Hard Disk</FormLabel>
                    <RadioGroup name="disk" defaultValue={getDiskType(s.peripherals)} row>
                        <FormControlLabel value={""} control={<Radio />} label="None" />
                        <FormControlLabel value={DeviceID.DEV_ID_DF32} control={<Radio />} label="DF32" />
                        <FormControlLabel value={DeviceID.DEV_ID_RF08} control={<Radio />} label="RF08" />
                        <FormControlLabel value={DeviceID.DEV_ID_RK08} control={<Radio />} label="RK08" />
                        <FormControlLabel value={DeviceID.DEV_ID_RK8E} control={<Radio />} label="RK8E" />
                    </RadioGroup>
                </FormControl>

                <FormControl component="fieldset">
                    <FormLabel component="legend">Additional PT08 Serial Ports</FormLabel>
                    <Slider
                        defaultValue={countPT08(s.peripherals)}
                        valueLabelDisplay="off"
                        step={1}
                        min={0}
                        max={4}
                        marks={pt08Marks}
                        name="pt08"
                    />
                </FormControl>

                <FormControl component="fieldset">
                    <FormLabel component="legend">Real-Time Clock</FormLabel>
                    <FormControlLabel control={
                        <Switch name="kw8i"defaultChecked={peripherals.includes(DeviceID.DEV_ID_KW8I)} />
                    } label="KW8/I" />
                </FormControl>
            </FormGroup>

            <Button type="submit" variant="contained" disabled={!props.buttonEnabled}>
                Create System
            </Button>
        </form>
    );
}

function toSystemConf(ev: FormEvent<HTMLFormElement>): SystemConfiguration {
    const form = ev.currentTarget;
    const s: SystemConfiguration = getDefaultSysConf();
    s.peripherals = [];

    s.name = (form.elements.namedItem("name") as HTMLInputElement).value;

    s.cpuExtensions.eae = (form.elements.namedItem("eae") as HTMLInputElement).checked;
    s.cpuExtensions.kt8i = (form.elements.namedItem("kt8i") as HTMLInputElement).checked;
    s.cpuExtensions.bsw = (form.elements.namedItem("bsw") as HTMLInputElement).checked;
    s.maxMemField = Number.parseInt((form.elements.namedItem("maxMemField") as HTMLInputElement).value);

    if ((form.elements.namedItem("serialLine") as HTMLInputElement).checked) {
        s.peripherals.push({
            id: DeviceID.DEV_ID_PT08,
            baudRate: 110,
            eightBit: false,
            autoCaps: true,
            style: PT08Style.ASR33
        });
    }

    if ((form.elements.namedItem("pc04") as HTMLInputElement).checked) {
        s.peripherals.push({ id: DeviceID.DEV_ID_PC04, baudRate: 4800 });
    }

    if ((form.elements.namedItem("kw8i") as HTMLInputElement).checked) {
        s.peripherals.push({ id: DeviceID.DEV_ID_KW8I, use50Hz: false, useExternalClock: true });
    }

    if ((form.elements.namedItem("tc08") as HTMLInputElement).checked) {
        s.peripherals.push({ id: DeviceID.DEV_ID_TC08, numTapes: 2 });
    }

    const pt08Count = Number.parseInt((form.elements.namedItem("pt08") as HTMLInputElement).value);
    const baseTT: Omit<PT08Configuration, "id"> = {
        baudRate: 9600,
        eightBit: false,
        autoCaps: false,
        style: PT08Style.ASR33
    };

    if (pt08Count >= 4) {
        s.peripherals.push({ id: DeviceID.DEV_ID_TT4, ...baseTT });
    }
    if (pt08Count >= 3) {
        s.peripherals.push({ id: DeviceID.DEV_ID_TT3, ...baseTT });
    }
    if (pt08Count >= 2) {
        s.peripherals.push({ id: DeviceID.DEV_ID_TT2, ...baseTT });
    }
    if (pt08Count >= 1) {
        s.peripherals.push({ id: DeviceID.DEV_ID_TT1, ...baseTT });
    }

    const diskStr = (form.elements.namedItem("disk") as HTMLInputElement).value;
    const diskId = Number.parseInt(diskStr, 10) as DeviceID;
    switch (diskId) {
        case DeviceID.DEV_ID_DF32:
            s.peripherals.push({ id: DeviceID.DEV_ID_DF32 });
            break;
        case DeviceID.DEV_ID_RF08:
            s.peripherals.push({ id: DeviceID.DEV_ID_RF08 });
            break;
        case DeviceID.DEV_ID_RK08:
            s.peripherals.push({ id: DeviceID.DEV_ID_RK08 });
            break;
        case DeviceID.DEV_ID_RK8E:
            s.peripherals.push({ id: DeviceID.DEV_ID_RK8E });
            break;
    }

    ev.preventDefault();
    return s;
}

function countPT08(list: PeripheralConfiguration[]): number {
    let count = 0;

    for (const conf of list) {
        if (conf.id >= DeviceID.DEV_ID_TT1 && conf.id <= DeviceID.DEV_ID_TT4) {
            count++;
        }
    }

    return count;
}

function getDiskType(list: PeripheralConfiguration[]): DeviceID | "" {
    for (const conf of list) {
        switch (conf.id) {
            case DeviceID.DEV_ID_DF32: return conf.id;
            case DeviceID.DEV_ID_RF08: return conf.id;
            case DeviceID.DEV_ID_RK08: return conf.id;
            case DeviceID.DEV_ID_RK8E: return conf.id;
        }
    }
    return "";
}
