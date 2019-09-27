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

 export enum LED {
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

export enum Switch {
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

const LED_OVERRIDE_MASK = 2;
const SW_OVERRIDE_MASK = 1;

export class Console {
    private map: Buffer;

    public constructor(map: Buffer) {
        this.map = map;
    }

    public isSwitchOverridden(): boolean {
        let ovr = this.map.readUInt8(0);
        return (ovr & SW_OVERRIDE_MASK) != 0;
    }

    public isLEDOverridden(): boolean {
        let ovr = this.map.readUInt8(0);
        return (ovr & LED_OVERRIDE_MASK) != 0;
    }

    public setLEDOverride(override: boolean): void {
        let ovr = this.map.readUInt8(0);
        if (override) {
            ovr |= LED_OVERRIDE_MASK;
        } else {
            ovr &= ~LED_OVERRIDE_MASK;
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

    public readLED(led: LED): number {
        return this.map.readUInt16LE(led * 4);
    }

    public writeLED(led: LED, value: number): void {
        this.map.writeUInt16LE(value, led * 4);
    }

    public readSwitch(sw: Switch) {
        return this.map.readUInt16LE(sw * 4);
    }

    public writeSwitch(sw: Switch, value: number): void {
        this.map.writeUInt16LE(value, sw * 4);
    }
}
