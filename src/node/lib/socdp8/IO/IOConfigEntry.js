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
class IOConfigEntry {
    constructor(id) {
        // The IOP pulses should be 1 for IOP1, 2 for IOP2 and 3 for IOP4
        // bus ID
        this.devId = 0;
        // Which IOP pulse should generate an interrupt in the IOController
        this.iopForInterrupt = 0;
        // Which IOP pulse should load the device register
        this.iopForRegisterLoad = 0;
        // Which IOP pulse should clear the AC
        this.iopForACClear = 0;
        // Which IOP pulse should load the AC from the register
        this.iopForACLoad = 0;
        // Which IOP pulse should set the device flag
        this.iopForFlagSet = 0;
        // Which IOP pulse should clear the device flag
        this.iopForFlagClear = 0;
        // Which IOP pulse should skip if flag is set
        this.iopForSkipFlag = 0;
        // Whether to set the flag on write access
        this.setFlagOnWrite = false;
        // Call I/O function when flag is set
        this.onFlagSet = () => { };
        // Call I/O function when flag is not set
        this.onFlagUnset = () => { };
        this.devId = id;
    }
}
exports.IOConfigEntry = IOConfigEntry;
