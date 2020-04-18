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

import { Peripheral, IOContext, DeviceRegister } from '../drivers/IO/Peripheral';
import { existsSync, readFileSync, promises } from 'fs';
import { sleepMs, sleepUs } from '../sleep';
import { DF32Configuration } from '../types/PeripheralTypes';

export class DF32 extends Peripheral {
    private readonly DEBUG = true;
    private readonly BRK_ADDR = 0o7750;
    private readonly DATA_FILE: string;
    private data = Buffer.alloc(4 * 16 * 2048 * 2); // 4 disks, each with 16 tracks of 2048 words, stored as 2 bytes each

    constructor(private readonly conf: DF32Configuration, dir: string) {
        super(conf.id);

        this.DATA_FILE = dir + '/df32.dat';

        if (existsSync(this.DATA_FILE)) {
            const buf = readFileSync(this.DATA_FILE);
            buf.copy(this.data);
        }
    }

    public getConfiguration(): DF32Configuration {
        return this.conf;
    }

    public reconfigure(newConf: DF32Configuration) {
        Object.assign(this.conf, newConf);
    }

    public async saveState() {
        await promises.writeFile(this.DATA_FILE, this.data);
    }

    public getBusConnections(): number[] {
        return [0o60, 0o61, 0o62];
    }

    public async run(): Promise<void> {
        const io = this.io;

        while (this.keepAlive) {
            const regA = io.readRegister(DeviceRegister.REG_A);

            if (regA & (1 << 15)) {
                // read
                await sleepMs(20);
                io.writeRegister(DeviceRegister.REG_A, regA & ~(1 << 15)); // remove request
                await this.doRead(io);
            } else if (regA & (1 << 14)) {
                // write
                await sleepMs(20);
                io.writeRegister(DeviceRegister.REG_A, regA & ~(1 << 14)); // remove request
                await this.doWrite(io);
            } else {
                await sleepMs(1);
            }
        }
    }

    private async doRead(io: IOContext) {
        let addr = this.readAddress(io);

        if (this.DEBUG) {
            console.log(`DF32: Read ${addr}`)
        }

        let overflow = false;
        do {
            const data = this.data.readUInt16LE(addr * 2);
            const memField = this.readMemField(io);

            const brkReply = await io.dataBreak({
                threeCycle: true,
                isWrite: true,
                data: data,
                address: this.BRK_ADDR,
                field: memField,
                incMB: false,
                incCA: true
            });

            addr = (addr + 1) & 0o377777;
            this.writeAddress(io, addr);

            overflow = brkReply.wordCountOverflow;

            await sleepUs(65);
        } while (!overflow);

        this.setDoneFlag(io);
    }

    private async doWrite(io: IOContext) {
        let addr = this.readAddress(io);

        if (this.DEBUG) {
            console.log(`DF32: Write ${addr}`)
        }

        let overflow = false;
        do {
            const memField = this.readMemField(io);

            const brkReply = await io.dataBreak({
                threeCycle: true,
                isWrite: false,
                data: 0,
                address: this.BRK_ADDR,
                field: memField,
                incMB: false,
                incCA: true
            });

            const data = brkReply.mb;
            this.data.writeUInt16LE(data, addr * 2);

            addr = (addr + 1) & 0o377777;
            this.writeAddress(io, addr);
            overflow = brkReply.wordCountOverflow;

            await sleepUs(65);
        } while (!overflow);

        this.setDoneFlag(io);
    }

    private readMemField(io: IOContext): number {
        const regB = io.readRegister(DeviceRegister.REG_B);
        return (regB & 0o0070) >> 3;
    }

    private readAddress(io: IOContext): number {
        const regA = io.readRegister(DeviceRegister.REG_A);
        const regB = io.readRegister(DeviceRegister.REG_B);
        const addr = (((regB >> 6) & 0o37) << 12) | (regA & 0o7777);
        return addr;
    }

    private writeAddress(io: IOContext, addr: number): void {
        const regA = addr & 0o7777;
        const regBOld = io.readRegister(DeviceRegister.REG_B);
        let regB = (regBOld & ~(0o3700)) | ((addr & 0o370000) >> 6)
        io.writeRegister(DeviceRegister.REG_A, regA);
        io.writeRegister(DeviceRegister.REG_B, regB);
    }

    private setDoneFlag(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 15));
    }
}
