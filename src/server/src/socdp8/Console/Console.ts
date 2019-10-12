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

 enum Lamp {
    DATA_FIELD =    1,
    INST_FIELD =    2,
    PC =            3,
    MEM_ADDR =      4,
    MEM_BUF =       5,
    LINK =          6,
    AC =            7,
    STEP_COUNTER =  8,
    MQR =           9,
    INSTRUCTION =   10,
    STATE =         11,
    ION =           12,
    PAUSE =         13,
    RUN =           14,
}

enum Switch {
    DATA_FIELD =    15,
    INST_FIELD =    16,
    SWR =           17,
    START =         18,
    LOAD =          19,
    DEP =           20,
    EXAM =          21,
    CONT =          22,
    STOP =          23,
    SING_STEP =     24,
    SING_INST =     25,
}

const LAMP_OVERRIDE_MASK = 2;
const SW_OVERRIDE_MASK = 1;

export interface LampState {
    dataField: number;
    instField: number;
    pc: number;
    memAddr: number;
    memBuf: number;
    link: number;
    ac: number;
    stepCounter: number;
    mqr: number;
    instruction: number;
    state: number;
    ion: number;
    pause: number;
    run: number;
}

export interface SwitchState {
    dataField: number;
    instField: number;
    swr: number;
    start: number;
    load: number;
    dep: number;
    exam: number;
    cont: number;
    stop: number;
    singStep: number;
    singInst: number;
}

export class Console {
    private map: Buffer;
    private overridenSwitches: SwitchState;

    public constructor(map: Buffer) {
        this.map = map;
        this.setSwitchOverride(false);
        this.overridenSwitches = this.readSwitches();
    }

    public isSwitchOverridden(): boolean {
        let ovr = this.map.readUInt8(0);
        return (ovr & SW_OVERRIDE_MASK) != 0;
    }

    public isLampOverridden(): boolean {
        let ovr = this.map.readUInt8(0);
        return (ovr & LAMP_OVERRIDE_MASK) != 0;
    }

    public setLampOverride(override: boolean): void {
        let ovr = this.map.readUInt8(0);
        if (override) {
            ovr |= LAMP_OVERRIDE_MASK;
        } else {
            ovr &= ~LAMP_OVERRIDE_MASK;
        }
        this.map.writeUInt8(ovr, 0);
    }

    public setSwitchOverride(override: boolean): void {
        let ovr = this.map.readUInt8(0);
        if (override) {
            ovr |= SW_OVERRIDE_MASK;
        } else {
            ovr &= ~SW_OVERRIDE_MASK;
        }
        this.map.writeUInt8(ovr, 0);
    }

    public readLamps(): LampState {
        let state: LampState = {
            dataField: this.readLamp(Lamp.DATA_FIELD),
            instField: this.readLamp(Lamp.INST_FIELD),
            pc: this.readLamp(Lamp.PC),
            memAddr: this.readLamp(Lamp.MEM_ADDR),
            memBuf: this.readLamp(Lamp.MEM_BUF),
            link: this.readLamp(Lamp.LINK),
            ac: this.readLamp(Lamp.AC),
            stepCounter: this.readLamp(Lamp.STEP_COUNTER),
            mqr: this.readLamp(Lamp.MQR),
            instruction: this.readLamp(Lamp.INSTRUCTION),
            state: this.readLamp(Lamp.STATE),
            ion: this.readLamp(Lamp.ION),
            pause: this.readLamp(Lamp.PAUSE),
            run: this.readLamp(Lamp.RUN)
        }
        return state;
    }

    public readSwitches(): SwitchState {
        if (this.isSwitchOverridden()) {
            return this.overridenSwitches;
        }
        
        let state: SwitchState = {
            dataField: this.readSwitch(Switch.DATA_FIELD),
            instField: this.readSwitch(Switch.INST_FIELD),
            swr: this.readSwitch(Switch.SWR),
            start: this.readSwitch(Switch.START),
            load: this.readSwitch(Switch.LOAD),
            dep: this.readSwitch(Switch.DEP),
            exam: this.readSwitch(Switch.EXAM),
            cont: this.readSwitch(Switch.CONT),
            stop: this.readSwitch(Switch.STOP),
            singStep: this.readSwitch(Switch.SING_STEP),
            singInst: this.readSwitch(Switch.SING_INST)
        }        
        return state;
    }

    public writeSwitches(switches: SwitchState): void {
        this.writeSwitch(Switch.DATA_FIELD, switches.dataField);
        this.writeSwitch(Switch.INST_FIELD, switches.instField);
        this.writeSwitch(Switch.SWR, switches.swr);
        this.writeSwitch(Switch.START, switches.start);
        this.writeSwitch(Switch.LOAD, switches.load);
        this.writeSwitch(Switch.DEP, switches.dep);
        this.writeSwitch(Switch.EXAM, switches.exam);
        this.writeSwitch(Switch.CONT, switches.cont);
        this.writeSwitch(Switch.STOP, switches.stop);
        this.writeSwitch(Switch.SING_STEP, switches.singStep);
        this.writeSwitch(Switch.SING_INST, switches.singInst);
        this.overridenSwitches = switches;
    }

    private readLamp(lamp: Lamp): number {
        return this.map.readUInt16LE(lamp * 4);
    }

    private writeLamp(lamp: Lamp, value: number): void {
        this.map.writeUInt16LE(value, lamp * 4);
    }

    private readSwitch(sw: Switch) {
        return this.map.readUInt16LE(sw * 4);
    }

    private writeSwitch(sw: Switch, value: number): void {
        this.map.writeUInt16LE(value, sw * 4);
    }
}
