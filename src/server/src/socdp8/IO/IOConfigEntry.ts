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

export class IOConfigEntry {
    // The IOP pulses should be 1 for IOP1, 2 for IOP2 and 3 for IOP4

    // bus ID
    public devId: number = 0;

    // Which IOP pulse should generate an interrupt in the IOController
    public iopForInterrupt: number = 0;

    // Which IOP pulse should load the device register
    public iopForRegisterLoad: number = 0;

    // Which IOP pulse should clear the AC
    public iopForACClear: number = 0;

    // Which IOP pulse should load the AC from the register
    public iopForACLoad: number = 0;

    // Which IOP pulse should set the device flag
    public iopForFlagSet: number = 0;

    // Which IOP pulse should clear the device flag
    public iopForFlagClear: number = 0;

    // Which IOP pulse should skip if flag is set
    public iopForSkipFlag: number = 0;
    
    // Whether to set the flag on write access
    public setFlagOnWrite: boolean = false;

    // Call I/O function when flag is set
    public onFlagSet?: () => Promise<void>;

    // Call I/O function when flag is not set
    public onFlagUnset?: () => Promise<void>;

    constructor(id: number) {
        this.devId = id;
    }
}
