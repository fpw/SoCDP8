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

import { Peripheral } from './Peripherals/Peripheral';
import { NullPeripheral } from './Peripherals/NullPeripheral';
import { promisify } from 'util';

export interface DataBreakRequest {
    data: number;
    address: number;
    field: number;
    isWrite: boolean;
    incMB: boolean;
    threeCycle: boolean;
    incCA: boolean;
}

export interface DataBreakReply {
    mb: number;
    wordCountOverflow: boolean;
}

export class IOController {
    private readonly SOC_MAX_DEV_CNT_REG = 1;
    private readonly SOC_ATTENTION_REG = 2;
    private readonly BK_DATA_REG = 3;
    private readonly BK_CONTROL_REG = 4;

    private ioMem: Buffer;
    private readonly maxDevices: number;
    private peripherals: Peripheral[] = [];

    public constructor(ioBuf: Buffer) {
        this.ioMem = ioBuf;
        this.maxDevices = this.readSystemRegister(this.SOC_MAX_DEV_CNT_REG);
        this.peripherals.push(new NullPeripheral());
        this.clear();
    }

    private clear(): void {
        for (let i = 0; i < this.maxDevices; i++) {
            for (let reg = 0; reg < 16; reg++) {
                this.writePeripheralReg(i, reg, 0);
            }
            this.writeMappingTable(i, 0, 0);
            this.writeMappingTable(i, 1, 0);
        }
    }

    public registerPeripheral(perph: Peripheral): void {
        const devId = this.peripherals.push(perph) - 1;

        // set peripheral type
        this.writePeripheralReg(devId, 0, perph.getType());

        // connect peripheral to bus at desired locations
        const mapping = perph.getBusConnections();
        for (let [id, subType] of mapping.entries()) {
            this.writeMappingTable(id, 0, devId);
            this.writeMappingTable(id, 1, subType);
        }
    }

    private readSystemRegister(reg: number) {
        return this.ioMem.readUInt32LE(this.getMappingTableAddr(0, reg));
    }

    private writeSystemRegister(reg: number, val: number) {
        return this.ioMem.writeUInt32LE(val, this.getMappingTableAddr(0, reg));
    }

    private writeMappingTable(busId: number, reg: number, val: number) {
        this.ioMem.writeUInt16LE(val, this.getMappingTableAddr(busId, reg));
    }

    private readPeripheralReg(devId: number, reg: number): number {
        return this.ioMem.readUInt16LE(this.getPeripheralRegAddr(devId, reg));
    }

    private writePeripheralReg(devId: number, reg: number,  data: number): void {
        this.ioMem.writeUInt16LE(data, this.getPeripheralRegAddr(devId, reg));
    }

    private getPeripheralRegAddr(devId: number, devReg: number): number {
        return (1 << 12) | (devId * (16 * 4) + devReg * 4);
    }

    private getMappingTableAddr(busId: number, reg: number): number {
        return busId * (16 * 4) + reg * 4;
    }

    public async checkDevices(): Promise<void> {
        const attention = this.readSystemRegister(this.SOC_ATTENTION_REG);

        for (const [devId, perph] of this.peripherals.entries()) {
            await perph.onTick({
                readRegister: reg => this.readPeripheralReg(devId, reg),
                writeRegister: (reg, val) => this.writePeripheralReg(devId, reg, val)
            });
        }
    }

    public async doDataBreak(req: DataBreakRequest): Promise<DataBreakReply> {
        const sleepMs = promisify(setTimeout);

        console.log('BRK: Waiting for ready');
        await this.waitDataBreakReady();

        const requestWord: number = this.dataBreakToNumber(req);
        console.log(`BRK: Request ${requestWord.toString(8)}`);
        this.writeSystemRegister(this.BK_DATA_REG, requestWord);
        this.writeSystemRegister(this.BK_CONTROL_REG, 1);

        console.log('BRK: Waiting for done');
        await this.waitDataBreakReady();

        const replyWord = this.readSystemRegister(this.BK_DATA_REG);
        if ((replyWord & (1 << 13)) == 0) {
            throw new Error(`Data break request denied, reply: ${replyWord.toString(8)}`);
        }

        console.log(`BRK: Reply ${replyWord.toString(8)}`);

        return {
            mb: (replyWord & 0o7777),
            wordCountOverflow: (replyWord & (1 << 12)) != 0
        };
    }

    private async waitDataBreakReady(): Promise<void> {
        const sleepMs = promisify(setTimeout);

        for (let i = 0; i < 10; i++) {
            const ready = (this.readSystemRegister(this.BK_CONTROL_REG) == 1);
            if (ready) {
                return;
            }
            await sleepMs(1);
        }

        throw new Error('timeout waiting for data request');
    }

    private dataBreakToNumber(req: DataBreakRequest): number {
        let word = 0;

        word |= (req.data & 0o7777)     << 0;
        word |= (req.address & 0o7777)  << 12;
        word |= (req.field & 0o7)       << 26;
        
        if (req.isWrite) {
            word |= (1 << 27);
        }

        if (req.incMB) {
            word |= (1 << 28);
        }

        if (req.incCA) {
            word |= (1 << 29);
        }

        if (req.threeCycle) {
            word |= (1 << 30);
        }

        return word;
    }
}
