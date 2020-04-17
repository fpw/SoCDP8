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

import React from 'react';

import FormGroup from '@material-ui/core/FormGroup';
import FormControl from '@material-ui/core/FormControl';
import Slider, { Mark } from '@material-ui/core/Slider';
import FormLabel from '@material-ui/core/FormLabel';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { peripheralConfToName, PeripheralName, PT08Configuration, PeripheralType, PC04Configuration, KW8IConfiguration, TC08Configuration, DF32Configuration, RF08Configuration, RK8Configuration, PeripheralConfiguration } from '../../types/PeripheralTypes';
import { SystemConfiguration, DEFAULT_SYSTEM_CONF } from '../../types/SystemConfiguration';

export interface SystemFormProps {
    initialState: SystemConfiguration;
    onSubmit(state: SystemConfiguration): void;
    buttonEnabled: boolean;
}

const useStyles = makeStyles(theme => createStyles({
    fieldset: {
        paddingTop: 15,
        marginBottom: 20,
    }
}));

export const SystemForm: React.FunctionComponent<SystemFormProps> = (props) => {
    const classes = useStyles();

    const coreMemoryMarks: Mark[] = [0, 1, 2, 3, 4, 5, 6, 7].map(i => {return {
            value: i,
            label: `${(i + 1) * 4}`
        } as Mark}
    );

    const pt08Marks: Mark[] = [0, 1, 2, 3, 4].map(i => {return {
            value: i,
            label: `${i}`
        } as Mark}
    );

    const s = props.initialState;

    const peripherals: PeripheralName[] = s.peripherals.map(p => peripheralConfToName(p));

    return (
        <form autoComplete='off' onSubmit={(ev) => props.onSubmit(toMachineState(ev))}>
            <FormGroup>
                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>Machine Name</FormLabel>
                    <TextField required name='name' label='Name' variant='outlined' />
                </FormControl>

                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>CPU Extensions</FormLabel>
                    <FormControlLabel control={<Switch name='eae' color='primary' defaultChecked={s.cpuExtensions.eae} />} label='KE8/I (EAE)' />
                    <FormControlLabel control={<Switch name='kt8i' color='primary' defaultChecked={s.cpuExtensions.kt8i} />} label='KT8/I (Time Sharing Option)' />
                </FormControl>

                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>Core Memory (kiW)</FormLabel>
                    <Slider
                        defaultValue={s.maxMemField}
                        valueLabelDisplay='off'
                        step={1}
                        min={0}
                        max={7}
                        marks={coreMemoryMarks}
                        name='maxMemField'
                    />
                </FormControl>

                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>Basic I/O</FormLabel>
                    <FormControlLabel control={
                        <Switch name='asr33' color='primary' defaultChecked={peripherals.includes('SerialLine') } />
                    } label='ASR-33 Teletype' />
                    <FormControlLabel control={
                        <Switch name='pc04' color='primary' defaultChecked={peripherals.includes('PC04')} />
                    } label='PC04 Reader / Punch' />
                </FormControl>

                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>DECtape</FormLabel>
                    <FormControlLabel control={
                        <Switch name='tc08' color='primary' defaultChecked={peripherals.includes('TC08')} />
                    } label='TC08 DECtape Controller' />
                </FormControl>

                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>Hard Disk</FormLabel>
                    <RadioGroup name='disk' defaultValue={getDiskType(s.peripherals)} row>
                        <FormControlLabel value='None' control={<Radio />} label='None' />
                        <FormControlLabel value='DF32' control={<Radio />} label='DF32' />
                        <FormControlLabel value='RF08' control={<Radio />} label='RF08' />
                        <FormControlLabel value='RK8' control={<Radio />} label='RK8' />
                    </RadioGroup>
                </FormControl>

                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>Additional PT08 Serial Ports</FormLabel>
                    <Slider
                        defaultValue={countPT08(s.peripherals)}
                        valueLabelDisplay='off'
                        step={1}
                        min={0}
                        max={4}
                        marks={pt08Marks}
                        name='pt08'
                    />
                </FormControl>

                <FormControl component='fieldset' className={classes.fieldset}>
                    <FormLabel component='legend'>Real-Time Clock</FormLabel>
                    <FormControlLabel control={
                        <Switch name='kw8i' color='primary'defaultChecked={peripherals.includes('KW8I')} />
                    } label='KW8/I' />
                </FormControl>
            </FormGroup>
            <Button type='submit' variant='contained' color='primary' disabled={!props.buttonEnabled}>
                Create Machine
            </Button>
        </form>
    );
}

function toMachineState(ev: React.FormEvent<HTMLFormElement>): SystemConfiguration {
    const form = ev.currentTarget;
    const s = DEFAULT_SYSTEM_CONF;
    s.peripherals = [];

    s.name = (form.elements.namedItem('name') as HTMLInputElement).value;

    s.cpuExtensions.eae = (form.elements.namedItem('eae') as HTMLInputElement).checked;
    s.cpuExtensions.kt8i = (form.elements.namedItem('kt8i') as HTMLInputElement).checked;
    s.maxMemField = Number.parseInt((form.elements.namedItem('maxMemField') as HTMLInputElement).value);

    if ((form.elements.namedItem('asr33') as HTMLInputElement).checked) {
        const conf: PT08Configuration = {
            kind: PeripheralType.PERPH_PT08,
            bus: 0o03,
            baudRate: 110,
        }
        s.peripherals.push(conf);
    }

    if ((form.elements.namedItem('pc04') as HTMLInputElement).checked) {
        const conf: PC04Configuration = {
            kind: PeripheralType.PERPH_PC04,
            baudRate: 4800,
        }
        s.peripherals.push(conf);
    }

    if ((form.elements.namedItem('kw8i') as HTMLInputElement).checked) {
        const conf: KW8IConfiguration =  {
            kind: PeripheralType.PERPH_KW8I
        }
        s.peripherals.push(conf);
    }

    if ((form.elements.namedItem('tc08') as HTMLInputElement).checked) {
        const conf: TC08Configuration = {
            kind: PeripheralType.PERPH_TC08,
            numTapes: 2,
        }
        s.peripherals.push(conf);
    }

    switch (Number.parseInt((form.elements.namedItem('pt08') as HTMLInputElement).value)) {
        case 4: {
            const conf: PT08Configuration = {
                kind: PeripheralType.PERPH_PT08,
                bus: 0o46,
                baudRate: 9600,
            }
            s.peripherals.push(conf);
        }
        case 3: {
            const conf: PT08Configuration = {
                kind: PeripheralType.PERPH_PT08,
                bus: 0o44,
                baudRate: 9600,
            }
            s.peripherals.push(conf);
        }
        case 2: {
            const conf: PT08Configuration = {
                kind: PeripheralType.PERPH_PT08,
                bus: 0o42,
                baudRate: 9600,
            }
            s.peripherals.push(conf);
        }
        case 1: {
            const conf: PT08Configuration = {
                kind: PeripheralType.PERPH_PT08,
                bus: 0o40,
                baudRate: 9600,
            }
            s.peripherals.push(conf);
        }
    }

    const diskStr = (form.elements.namedItem('disk') as HTMLInputElement).value;
    switch (diskStr) {
        case 'DF32': {
            const conf: DF32Configuration = {
                kind: PeripheralType.PERPH_DF32
            }
            s.peripherals.push(conf);
            break;
        }
        case 'RF08': {
            const conf: RF08Configuration = {
                kind: PeripheralType.PERPH_RF08
            }
            s.peripherals.push(conf);
            break;
        }
        case 'RK8': {
            const conf: RK8Configuration = {
                kind: PeripheralType.PERPH_RK8
            }
            s.peripherals.push(conf);
            break;
        }
    }

    ev.preventDefault();
    return s;
}

function countPT08(list: PeripheralConfiguration[]): number {
    let count = 0;

    for (const conf of list) {
        if (conf.kind == PeripheralType.PERPH_PT08 && conf.bus != 0o03) {
            count++;
        }
    }

    return count;
}

function getDiskType(list: PeripheralConfiguration[]): string {
    for (const conf of list) {
        switch (conf.kind) {
            case PeripheralType.PERPH_DF32: return 'DF32';
            case PeripheralType.PERPH_RF08: return 'RF08';
            case PeripheralType.PERPH_RK8:  return 'RK8';
        }
    }
    return 'None';
}
