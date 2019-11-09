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

import { Peripheral, DeviceType, IOContext, DeviceRegister } from '../drivers/IO/Peripheral';

export class RF08 extends Peripheral {
    private readonly DEBUG = true;
    private readonly BRK_ADDR   = 0o7750;
    private lastAccess: bigint = 0n;
    private data = Buffer.alloc(128 * 2048 * 2);

    public constructor(private busNum: number) {
        super();
    }

    public getType(): DeviceType {
        return DeviceType.RF08;
    }

    public getBusConnections(): Map<number, number> {
        const map = new Map<number, number>();
        map.set(this.busNum, 0);        // 60
        map.set(this.busNum + 1, 1);    // 61
        map.set(this.busNum + 2, 2);    // 62
        map.set(this.busNum + 4, 4);    // 64
        return map;
    }

    public requestAction(action: string, data: any): void {
    }

    public async onTick(io: IOContext): Promise<void> {
        const now = this.readSteadyClock();
        if (now - this.lastAccess < 0.01e9) {
            return;
        }

        const regA = io.readRegister(DeviceRegister.REG_A);

        if (regA & (1 << 15)) {
            // read
            io.writeRegister(DeviceRegister.REG_A, regA & ~(1 << 15));
            this.doRead(io);
        } else if (regA & (1 << 14)) {
            // write
            io.writeRegister(DeviceRegister.REG_A, regA & ~(1 << 14));
            this.doWrite(io);
        }

        this.lastAccess = this.readSteadyClock();
    }

    private doRead(io: IOContext) {
        let addr = this.readAddress(io);

        if (this.DEBUG) {
            console.log(`RF08: Read ${addr}`)
        }

        let overflow = false;
        do {
            const data = this.data.readUInt16LE(addr * 2);
            const memField = this.readMemField(io);

            const brkReply = io.dataBreak({
                threeCycle: true,
                isWrite: true,
                data: data,
                address: this.BRK_ADDR,
                field: memField,
                incMB: false,
                incCA: true
            });

            addr = (addr + 1) & 0o3777777;
            this.writeAddress(io, addr);

            overflow = brkReply.wordCountOverflow;
        } while (!overflow);

        this.setDoneFlag(io);
    }

    private doWrite(io: IOContext) {
        let addr = this.readAddress(io);

        if (this.DEBUG) {
            console.log(`RF08: Write ${addr}`)
        }

        let overflow = false;
        do {
            const memField = this.readMemField(io);

            const brkReply = io.dataBreak({
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

            addr = (addr + 1) & 0o3777777;
            this.writeAddress(io, addr);
            overflow = brkReply.wordCountOverflow;
        } while (!overflow);

        this.setDoneFlag(io);
    }

    private readMemField(io: IOContext): number {
        const regC = io.readRegister(DeviceRegister.REG_C);
        return (regC & 0o0070) >> 3;
    }

    private readAddress(io: IOContext): number {
        const regA = io.readRegister(DeviceRegister.REG_A);
        const regB = io.readRegister(DeviceRegister.REG_B);
        return ((regB & 0xFF) << 12) | (regA & 0o7777);
    }

    private writeAddress(io: IOContext, addr: number): void {
        const regA = addr & 0o7777;
        const regB = (addr >> 12) & 0xFF;
        io.writeRegister(DeviceRegister.REG_A, regA);
        io.writeRegister(DeviceRegister.REG_B, regB);
    }

    private setDoneFlag(io: IOContext) {
        const regC = io.readRegister(DeviceRegister.REG_C);
        io.writeRegister(DeviceRegister.REG_C, regC | (1 << 15));
    }
}
