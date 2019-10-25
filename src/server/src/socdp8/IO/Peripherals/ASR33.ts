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

export class ASR33 {
    private readonly READER_ID = 3;
    private readonly PUNCH_ID = 4;
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

    public appendReaderData(data: number[]) {
        this.readerData.push(...data);
    }

    public clearReaderData() {
        this.readerData = [];
        this.lastReadAt = this.readSteadyClock();
    }

    private setupReader(): void {
        let readerEntry = new IOConfigEntry(this.READER_ID, 1);
        readerEntry.onTick = () => this.onReaderTick();


        this.io.registerDevice(readerEntry);
    }

    private setupPunch(): void {
        let punchEntry = new IOConfigEntry(this.PUNCH_ID, 2);
        punchEntry.onTick = () => this.onPunchTick();
        this.io.registerDevice(punchEntry);
    }

    private readSteadyClock(): bigint {
        return process.hrtime.bigint();
    }

    private async onReaderTick(): Promise<void> {
        if (this.io.readDeviceRegister(this.READER_ID, 2) == 1) {
            // data not taken yet
            return;
        }

        // current word was retrieved, get next
        const now = this.readSteadyClock();
        if (now - this.lastReadAt > 0.100e9) {
            const data = this.readerData.shift();
            if (data != undefined) {
                console.log(`Next ${data}, ${this.readerData.length} remaining`);
                this.io.writeDeviceRegister(this.READER_ID, 1, data);
                this.io.writeDeviceRegister(this.READER_ID, 2, 1);
            }
            this.lastReadAt = this.readSteadyClock();
        }
    }

    private async onPunchTick(): Promise<void> {
        if (this.io.readDeviceRegister(this.PUNCH_ID, 2) != 1) {
            // no new data yet
            return;
        }

        // new word ready
        const now = this.readSteadyClock();
        if (now - this.lastPunchAt > 0.100e9) {
            let data = this.io.readDeviceRegister(this.PUNCH_ID, 1);
            if (this.onPunch) {
                this.io.writeDeviceRegister(this.PUNCH_ID, 2, 2); // ack data
                this.lastPunchAt = now;
                await this.onPunch(data);
            }
        }
    }
}
