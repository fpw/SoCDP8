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

import { IOController } from '../IOController';
import { IOConfigEntry } from '../IOConfigEntry';

export class PR8 {
    private readonly READER_ID = 1;
    private readonly PUNCH_ID = 2;
    private lastReadAt: bigint = 0n;
    private lastPunchAt: bigint = 0n;
    private io: IOController;
    private onPunch?: (data: number) => Promise<void>;
    private readerData: number[] = [];

    public constructor(io: IOController) {
        this.io = io;
        this.setupReader();
        this.setupPunch();
    }

    public setOnPunch(callback: (data: number) => Promise<void>) {
        this.onPunch = callback;
    }

    public setReaderData(data: number[]) {
        this.readerData = data;
        this.lastReadAt = this.readSteadyClock();
    }

    private setupReader(): void {
        let readerEntry = new IOConfigEntry(this.READER_ID);

        // IOP1 for reader: Skip if flag is set
        readerEntry.iopForSkipFlag = 1;

        // IOP2 for reader
        readerEntry.iopForACLoad = 2;
        readerEntry.iopForFlagClear = 2;
        readerEntry.onFlagUnset = () => this.onReaderFlagReset();

        // IOP4 for reader
        readerEntry.iopForInterrupt = 3;

        // Writing data to register should set the flag
        readerEntry.setFlagOnWrite = true;

        this.io.registerDevice(readerEntry);
    }

    private setupPunch(): void {
        let punchEntry = new IOConfigEntry(this.PUNCH_ID);

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

    private readSteadyClock(): bigint {
        return process.hrtime.bigint();
    }

    private async onReaderFlagReset(): Promise<void> {
        // current word was retrieved, get next
        const now = this.readSteadyClock();
        if (now - this.lastReadAt > (1.0 / 300) * 1e9) {
            const data = this.readerData.shift();
            if (data) {
                this.io.writeDeviceRegister(this.READER_ID, data);
            }
            this.lastReadAt = this.readSteadyClock();
        }
    }

    private async onPunchFlagReset(): Promise<void> {
        // new word ready
        const now = this.readSteadyClock();
        if (now - this.lastPunchAt > 0.020e9) {
            let [data, isNew] = this.io.readDeviceRegister(this.PUNCH_ID);
            if (isNew) {
                if (this.onPunch) {
                    this.io.writeDeviceRegister(this.PUNCH_ID, 0);
                    this.lastPunchAt = now;
                    await this.onPunch(data);
                }
            }
        }
    }
}
