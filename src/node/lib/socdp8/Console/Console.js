"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var LED;
(function (LED) {
    LED[LED["DATA_FIELD"] = 1] = "DATA_FIELD";
    LED[LED["INST_FIELD"] = 2] = "INST_FIELD";
    LED[LED["PC"] = 3] = "PC";
    LED[LED["MEM_ADDR"] = 4] = "MEM_ADDR";
    LED[LED["MEM_BUF"] = 5] = "MEM_BUF";
    LED[LED["LINK"] = 6] = "LINK";
    LED[LED["AC"] = 7] = "AC";
    LED[LED["STEP_COUNTER"] = 8] = "STEP_COUNTER";
    LED[LED["MQR"] = 9] = "MQR";
    LED[LED["INSTRUCTION"] = 10] = "INSTRUCTION";
    LED[LED["STATE"] = 11] = "STATE";
    LED[LED["ION"] = 12] = "ION";
    LED[LED["PAUSE"] = 13] = "PAUSE";
    LED[LED["RUN"] = 14] = "RUN";
})(LED || (LED = {}));
var Switch;
(function (Switch) {
    Switch[Switch["DATA_FIELD"] = 15] = "DATA_FIELD";
    Switch[Switch["INST_FIELD"] = 16] = "INST_FIELD";
    Switch[Switch["SWR"] = 17] = "SWR";
    Switch[Switch["START"] = 18] = "START";
    Switch[Switch["LOAD"] = 19] = "LOAD";
    Switch[Switch["DEP"] = 20] = "DEP";
    Switch[Switch["EXAM"] = 21] = "EXAM";
    Switch[Switch["CONT"] = 22] = "CONT";
    Switch[Switch["STOP"] = 23] = "STOP";
    Switch[Switch["SING_STEP"] = 24] = "SING_STEP";
    Switch[Switch["SING_INST"] = 25] = "SING_INST";
})(Switch || (Switch = {}));
const LED_OVERRIDE_MASK = 2;
const SW_OVERRIDE_MASK = 1;
class Console {
    constructor(map) {
        this.map = map;
    }
    isSwitchOverridden() {
        let ovr = this.map.readUInt8(0);
        return (ovr & SW_OVERRIDE_MASK) != 0;
    }
    isLEDOverridden() {
        let ovr = this.map.readUInt8(0);
        return (ovr & LED_OVERRIDE_MASK) != 0;
    }
    setLEDOverride(override) {
        let ovr = this.map.readUInt8(0);
        if (override) {
            ovr |= LED_OVERRIDE_MASK;
        }
        else {
            ovr &= ~LED_OVERRIDE_MASK;
        }
        this.map.writeUInt8(ovr, 0);
    }
    setSwitchOverride(override) {
        let ovr = this.map.readUInt8(0);
        if (override) {
            ovr |= SW_OVERRIDE_MASK;
        }
        else {
            ovr &= ~SW_OVERRIDE_MASK;
        }
        this.map.writeUInt8(ovr, 0);
    }
    readLEDs() {
        let state = {
            dataField: this.readLED(LED.DATA_FIELD),
            instField: this.readLED(LED.INST_FIELD),
            pc: this.readLED(LED.PC),
            memAddr: this.readLED(LED.MEM_ADDR),
            memBuf: this.readLED(LED.MEM_BUF),
            link: this.readLED(LED.LINK),
            ac: this.readLED(LED.AC),
            stepCounter: this.readLED(LED.STEP_COUNTER),
            mqr: this.readLED(LED.MQR),
            instruction: this.readLED(LED.INSTRUCTION),
            state: this.readLED(LED.STATE),
            ion: this.readLED(LED.ION),
            pause: this.readLED(LED.PAUSE),
            run: this.readLED(LED.RUN)
        };
        return state;
    }
    readSwitches() {
        let state = {
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
        };
        return state;
    }
    readLED(led) {
        return this.map.readUInt16LE(led * 4);
    }
    writeLED(led, value) {
        this.map.writeUInt16LE(value, led * 4);
    }
    readSwitch(sw) {
        return this.map.readUInt16LE(sw * 4);
    }
    writeSwitch(sw, value) {
        this.map.writeUInt16LE(value, sw * 4);
    }
}
exports.Console = Console;
