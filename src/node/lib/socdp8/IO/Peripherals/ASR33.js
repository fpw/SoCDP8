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
const IOConfigEntry_1 = require("../IOConfigEntry");
class ASR33 {
    constructor(io) {
        this.READER_ID = 3;
        this.PUNCH_ID = 4;
        this.io = io;
        this.setupReader();
        this.setupPunch();
    }
    setupReader() {
        let readerEntry = new IOConfigEntry_1.IOConfigEntry(this.READER_ID);
        // IOP1 for reader: Skip if flag is set
        readerEntry.iopForSkipFlag = 1;
        // IOP2 for reader: Clear AC, Clear Flag, generate IRQ so we can reload and request to call us
        readerEntry.iopForACClear = 2;
        readerEntry.iopForFlagClear = 2;
        readerEntry.iopForInterrupt = 2;
        readerEntry.onFlagUnset = () => this.onReaderFlagReset();
        // IOP4 for reader: Load AC with register
        readerEntry.iopForACLoad = 3;
        // Writing data to register should set the flag
        readerEntry.setFlagOnWrite = true;
        this.io.registerDevice(readerEntry);
    }
    setupPunch() {
        let punchEntry = new IOConfigEntry_1.IOConfigEntry(this.PUNCH_ID);
        // IOP1 for punch: Skip if flag is set
        punchEntry.iopForSkipFlag = 1;
        // IOP2 for reader: Clear Flag, generate IRQ so we can retrieve the data
        punchEntry.iopForFlagClear = 2;
        punchEntry.iopForInterrupt = 2;
        punchEntry.onFlagUnset = () => this.onPunchFlagReset();
        // IOP4 for reader: Load register with AC
        punchEntry.iopForRegisterLoad = 3;
        // Writing data to register should set the flag
        punchEntry.setFlagOnWrite = true;
        this.io.registerDevice(punchEntry);
    }
    onReaderFlagReset() {
        this.io.writeDeviceRegister(this.READER_ID, 0o1234);
    }
    onPunchFlagReset() {
        let [data, isNew] = this.io.readDeviceRegister(this.PUNCH_ID);
        if (isNew) {
            let char = data & 0x7F;
            this.io.writeDeviceRegister(this.PUNCH_ID, 0);
            console.log('Got ' + char);
        }
    }
}
exports.ASR33 = ASR33;
