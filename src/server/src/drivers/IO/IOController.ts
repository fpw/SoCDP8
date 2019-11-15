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

import { Peripheral, DeviceRegister } from './Peripheral';
import { DataBreakRequest, DataBreakReply } from './DataBreak';

export interface IOListener {
    onPeripheralEvent(devId: number, action: string, data: any): void
}

export class IOController {
    // system registers
    private readonly SYS_REG_MAGIC = 0;
    private readonly SYS_REG_MAX_DEV = 1;
    private readonly SYS_REG_DEV_ATTN = 2;
    private readonly SYS_REG_BRK_DATA = 3;
    private readonly SYS_REG_BRK_CTRL = 4;

    // mapping table rows
    private readonly TBL_MAPPING_DEV_ID = 0;

    private readonly NUM_BUS_IDS = 64;

    private readonly maxDevices: number;
    private peripherals: Peripheral[] = [];

    public constructor(private ioMem: Buffer, private listener: IOListener) {
        this.maxDevices = this.readSystemRegister(this.SYS_REG_MAX_DEV);
        this.clearDeviceTable();
    }

    private clearDeviceTable(): void {
        for (let devId = 0; devId < this.maxDevices; devId++) {
            for (let reg = 0; reg < 16; reg++) {
                this.writePeripheralReg(devId, reg, 0);
            }
        }

        for (let busId = 0; busId < this.NUM_BUS_IDS; busId++) {
            this.writeMappingTable(busId, this.TBL_MAPPING_DEV_ID, 0);
        }

        this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 0);
    }

    public getMaxDeviceCount(): number {
        return this.maxDevices;
    }

    public registerPeripheral(perph: Peripheral): void {
        const devId = perph.getDeviceID();

        this.peripherals[devId] = perph;

        this.writePeripheralReg(devId, DeviceRegister.REG_ENABLED, 1);

        // connect peripheral to bus at desired locations
        const mapping = perph.getBusConnections();
        for (const busId of mapping) {
            this.writeMappingTable(busId, this.TBL_MAPPING_DEV_ID, devId);
        }

        perph.run({
            readRegister: reg => this.readPeripheralReg(devId, reg),
            writeRegister: (reg, val) => this.writePeripheralReg(devId, reg, val),
            dataBreak: req => this.doDataBreak(req),
            emitEvent: (action, data) => this.listener.onPeripheralEvent(devId, action, data)
        });
    }

    public getRegisteredDevices(): readonly Peripheral[] {
        return this.peripherals;
    }

    public requestDeviceAction(devId: number, action: string, data: any) {
        const peripheral = this.peripherals[devId];
        if (!peripheral) {
            return;
        }

        peripheral.requestAction(action, data);
    }

    // this must not be async - the lowest sleep resolution is 1ms and we need to be faster...
    private doDataBreak(req: DataBreakRequest): DataBreakReply {
        try {
            // wait for old pending requests to finish
            this.waitDataBreakReady();
        } catch (e) {
            // remove pending requests
            console.warn('Removed pending BRK');
            this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 0);
        }

        const requestWord: number = this.encodeDataBreak(req);
        //console.log(`BRK: Request ${requestWord.toString(8)}`);
        this.writeSystemRegister(this.SYS_REG_BRK_DATA, requestWord);
        this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 1);

        try {
            this.waitDataBreakReady();
        } catch (e) {
            // data break was not accepted, remove request
            this.writeSystemRegister(this.SYS_REG_BRK_CTRL, 0);
            throw e;
        }

        const replyWord = this.readSystemRegister(this.SYS_REG_BRK_DATA);
        if ((replyWord & (1 << 13)) == 0) {
            throw new Error(`Data break request denied, reply: ${replyWord.toString(8)}`);
        }
        //console.log(`BRK: Reply ${replyWord.toString(8)}`);

        return {
            mb: (replyWord & 0o7777),
            wordCountOverflow: (replyWord & (1 << 12)) != 0
        };
    }

    private waitDataBreakReady(): void {
        let controlWord = 0;

        // TODO: Not sure what to do against busy waiting since this must be sync
        for (let i = 0; i < 50; i++) {
            controlWord = this.readSystemRegister(this.SYS_REG_BRK_CTRL);
            if (controlWord == 1) {
                return;
            }
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
}
