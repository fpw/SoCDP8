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

import { LampState } from "./LampState";
import { SwitchState } from "./SwitchState";
import { LampBrightness } from "./LampBrightness";
import { SW_OVERRIDE_MASK, LAMP_OVERRIDE_MASK, LampGroupIndex, SwitchIndex, LampBrightnessIndex } from "./ConsoleConstants";

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
            dataField: this.readLamp(LampGroupIndex.DATA_FIELD),
            instField: this.readLamp(LampGroupIndex.INST_FIELD),
            pc: this.readLamp(LampGroupIndex.PC),
            memAddr: this.readLamp(LampGroupIndex.MEM_ADDR),
            memBuf: this.readLamp(LampGroupIndex.MEM_BUF),
            link: this.readLamp(LampGroupIndex.LINK),
            ac: this.readLamp(LampGroupIndex.AC),
            stepCounter: this.readLamp(LampGroupIndex.STEP_COUNTER),
            mqr: this.readLamp(LampGroupIndex.MQR),
            instruction: this.readLamp(LampGroupIndex.INSTRUCTION),
            state: this.readLamp(LampGroupIndex.STATE),
            ion: this.readLamp(LampGroupIndex.ION),
            pause: this.readLamp(LampGroupIndex.PAUSE),
            run: this.readLamp(LampGroupIndex.RUN)
        }
        return state;
    }

    public readSwitches(): SwitchState {
        if (this.isSwitchOverridden()) {
            return Object.assign({}, this.overridenSwitches);
        }

        let state: SwitchState = {
            dataField: this.readSwitch(SwitchIndex.DATA_FIELD),
            instField: this.readSwitch(SwitchIndex.INST_FIELD),
            swr: this.readSwitch(SwitchIndex.SWR),
            start: this.readSwitch(SwitchIndex.START),
            load: this.readSwitch(SwitchIndex.LOAD),
            dep: this.readSwitch(SwitchIndex.DEP),
            exam: this.readSwitch(SwitchIndex.EXAM),
            cont: this.readSwitch(SwitchIndex.CONT),
            stop: this.readSwitch(SwitchIndex.STOP),
            singStep: this.readSwitch(SwitchIndex.SING_STEP),
            singInst: this.readSwitch(SwitchIndex.SING_INST)
        }
        return state;
    }

    public writeSwitches(switches: SwitchState): void {
        this.writeSwitch(SwitchIndex.DATA_FIELD, switches.dataField);
        this.writeSwitch(SwitchIndex.INST_FIELD, switches.instField);
        this.writeSwitch(SwitchIndex.SWR, switches.swr);
        this.writeSwitch(SwitchIndex.START, switches.start);
        this.writeSwitch(SwitchIndex.LOAD, switches.load);
        this.writeSwitch(SwitchIndex.DEP, switches.dep);
        this.writeSwitch(SwitchIndex.EXAM, switches.exam);
        this.writeSwitch(SwitchIndex.CONT, switches.cont);
        this.writeSwitch(SwitchIndex.STOP, switches.stop);
        this.writeSwitch(SwitchIndex.SING_STEP, switches.singStep);
        this.writeSwitch(SwitchIndex.SING_INST, switches.singInst);
        this.overridenSwitches = switches;
    }

    private readLamp(lamp: LampGroupIndex): number {
        return this.map.readUInt16LE(lamp * 4);
    }

    private writeLamp(lamp: LampGroupIndex, value: number): void {
        this.map.writeUInt16LE(value, lamp * 4);
    }

    private readSwitch(sw: SwitchIndex) {
        return this.map.readUInt16LE(sw * 4);
    }

    private writeSwitch(sw: SwitchIndex, value: number): void {
        this.map.writeUInt16LE(value, sw * 4);
    }

    public readBrightness(): LampBrightness {
        const data = this.map.slice(32 * 4, 32 * 4 + 88 / 2 + 1);

        const fetchOne = (idx: number) => {
            const byteIdx = Math.floor(idx / 2);
            const brtByte = data[byteIdx];
            if (idx % 2 == 0) {
                return brtByte & 0x0F;
            } else {
                return (brtByte >> 4) & 0x0F;
            }
        };

        const fetchMany = (idx: number, width: number) => {
            let res: number[] = [];
            for (let i = idx + width - 1; i >= idx; i--) {
                res.push(fetchOne(i));
            }
            return res;
        }

        return {
            dataField:      fetchMany(LampBrightnessIndex.LAMP_DF, 3),
            instField:      fetchMany(LampBrightnessIndex.LAMP_IF, 3),
            pc:             fetchMany(LampBrightnessIndex.LAMP_PC, 12),
            memAddr:        fetchMany(LampBrightnessIndex.LAMP_MA, 12),
            memBuf:         fetchMany(LampBrightnessIndex.LAMP_MB, 12),
            link:           fetchOne(LampBrightnessIndex.LAMP_L),
            ac:             fetchMany(LampBrightnessIndex.LAMP_AC, 12),
            stepCounter:    fetchMany(LampBrightnessIndex.LAMP_SC, 5),
            mqr:            fetchMany(LampBrightnessIndex.LAMP_MQR, 12),
            instruction:    fetchMany(LampBrightnessIndex.LAMP_IR, 8),
            state:          fetchMany(LampBrightnessIndex.LAMP_STATE, 6),
            ion:            fetchOne(LampBrightnessIndex.LAMP_ION),
            pause:          fetchOne(LampBrightnessIndex.LAMP_PAUSE),
            run:            fetchOne(LampBrightnessIndex.LAMP_RUN),
        }
    }
}
