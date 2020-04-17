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

import { DeviceRegister, DeviceID } from './Peripheral';
import { DataBreakRequest, DataBreakReply } from './DataBreak';
import { sleepUs } from '../../sleep';

export interface CPUExtensions {
    eae: boolean;
    kt8i: boolean;
    maxMemField: number;
}

export class IOController {
    // system registers
    private readonly SYS_REG_CONFIG = 0;
    private readonly SYS_REG_MAX_DEV = 1;
    private readonly SYS_REG_DEV_ATTN = 2;
    private readonly SYS_REG_BRK_DATA = 3;
    private readonly SYS_REG_BRK_CTRL = 4;

    private readonly NUM_DEV_REGS = 16;

    // mapping table rows
    private readonly TBL_MAPPING_DEV_ID = 0;

    private readonly NUM_BUS_IDS = 64;

    private readonly maxDevices: number;
    private brkBusy = false;

    public constructor(private ioMem: Buffer) {
        this.maxDevices = this.readSystemRegister(this.SYS_REG_MAX_DEV);

        this.clearDeviceTable();

        // clear pending data breaks
        this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 0);
    }

    public configureExtensions(ext: CPUExtensions) {
        this.writeSystemRegister(this.SYS_REG_CONFIG,
                (ext.maxMemField & 7) |
                (ext.eae ? (1 << 3) : 0) |
                (ext.kt8i ? (1 << 4) : 0)
        );
    }

    public getExtensions(): CPUExtensions {
        const conf = this.readSystemRegister(this.SYS_REG_CONFIG);
        return {
            maxMemField: conf & 0o7,
            eae: (conf & (1 << 3)) != 0,
            kt8i: (conf & (1 << 4)) != 0
        };
    }

    public clearDeviceTable(): void {
        for (let devId = 0; devId < this.maxDevices; devId++) {
            for (let reg = 0; reg < this.NUM_DEV_REGS; reg++) {
                this.writePeripheralReg(devId, reg, 0);
            }
        }

        for (let busId = 1; busId < this.NUM_BUS_IDS; busId++) {
            this.writeMappingTable(busId, this.TBL_MAPPING_DEV_ID, 0);
        }
    }

    public getMaxDeviceCount(): number {
        return this.maxDevices;
    }

    public registerPeripheral(busIds: number[], devId: DeviceID): void {
        this.writePeripheralReg(devId, DeviceRegister.REG_ENABLED, 1);

        // connect peripheral to bus at desired locations
        for (const busId of busIds) {
            this.writeMappingTable(busId, this.TBL_MAPPING_DEV_ID, devId);
        }
    }

    public async doDataBreak(req: DataBreakRequest): Promise<DataBreakReply> {
        while (this.brkBusy) {
            await sleepUs(10);
        }
        this.brkBusy = true;

        try {
            // wait for old pending requests to finish
            await this.waitDataBreakReady();
        } catch (e) {
            // remove pending requests
            console.warn('Removed pending BRK');
            this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 0);
        }

        const requestWord: number = this.encodeDataBreak(req);
        this.writeSystemRegister(this.SYS_REG_BRK_DATA, requestWord);
        this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 1);

        this.brkBusy = false;

        try {
            await this.waitDataBreakReady();
        } catch (e) {
            // data break was not accepted, remove request
            this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 0);
            throw e;
        }

        const replyWord = this.readSystemRegister(this.SYS_REG_BRK_DATA);
        if ((replyWord & (1 << 13)) == 0) {
            throw new Error(`Data break request denied, reply: ${replyWord.toString(8)}`);
        }

        return {
            mb: (replyWord & 0o7777),
            wordCountOverflow: (replyWord & (1 << 12)) != 0
        };
    }

    private async waitDataBreakReady() {
        let controlWord = 0;

        for (let i = 0; i < 10; i++) {
            controlWord = this.readSystemRegister(this.SYS_REG_BRK_CTRL);
            if (controlWord == 1) {
                return;
            }
            await sleepUs(5);
        }

        throw new Error(`Timeout waiting for data request, last state: ${controlWord}`);
    }

    private encodeDataBreak(req: DataBreakRequest): number {
        // see io_controller.vhd
        let word = 0;

        word |= (req.data    & 0o7777) << 0;
        word |= (req.address & 0o7777) << 12;
        word |= (req.field   & 0o0007) << 24;

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

    private readSystemRegister(reg: number) {
        return this.ioMem.readUInt32LE(this.getMappingTableAddr(0, reg));
    }

    private writeSystemRegister(reg: number, val: number) {
        return this.ioMem.writeUInt32LE(val, this.getMappingTableAddr(0, reg));
    }

    private writeMappingTable(busId: number, reg: number, val: number) {
        this.ioMem.writeUInt16LE(val, this.getMappingTableAddr(busId, reg));
    }

    public readPeripheralReg(devId: number, reg: number): number {
        return this.ioMem.readUInt16LE(this.getPeripheralRegAddr(devId, reg));
    }

    public writePeripheralReg(devId: number, reg: number,  data: number): void {
        this.ioMem.writeUInt16LE(data, this.getPeripheralRegAddr(devId, reg));
    }

    private getPeripheralRegAddr(devId: number, devReg: number): number {
        return (1 << 12) | (devId * (16 * 4) + devReg * 4);
    }

    private getMappingTableAddr(busId: number, reg: number): number {
        return busId * (16 * 4) + reg * 4;
    }
}
