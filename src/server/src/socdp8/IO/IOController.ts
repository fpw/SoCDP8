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

export class IOController {
    private ioMem: Buffer;
    private readonly maxDevices: number;
    private peripherals: Peripheral[] = [];

    public constructor(ioBuf: Buffer) {
        this.ioMem = ioBuf;
        this.maxDevices = this.readSystemRegister(1);
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
        return this.getMappingTableAddr(0, reg);
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
        for (const [devId, perph] of this.peripherals.entries()) {
            await perph.onTick({
                readRegister: reg => this.readPeripheralReg(devId, reg),
                writeRegister: (reg, val) => this.writePeripheralReg(devId, reg, val)
            });
        }
    }
}
