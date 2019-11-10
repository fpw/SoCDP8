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

import { Peripheral, DeviceRegister, IOContext, DeviceID } from '../drivers/IO/Peripheral';

export class ASR33 extends Peripheral {
    private lastReadAt: bigint = 0n;
    private readerData: number[] = [];

    private gotPunch: boolean = false;
    private punchData: number = 0;
    private gotPunchAt: bigint = 0n;

    public getDeviceID(): DeviceID {
        return DeviceID.DEV_ID_ASR33;
    }

    public getBusConnections(): number[] {
        return [0o03, 0o04];
    }

    public requestAction(action: string, data: any): void {
        switch (action) {
            case 'append-data':
                this.readerData.push(...data);
                break;
            case 'set-data':
                this.readerData = Array.from(data as Buffer);
                break;
            case 'force':
                this.gotPunch = true;
                this.punchData = 0;
                this.gotPunchAt = this.readSteadyClock();
                break;
        }
    }

    public async onTick(io: IOContext): Promise<void> {
        await this.onReaderTick(io);
        await this.onPunchTick(io);
    }

    private async onReaderTick(io: IOContext): Promise<void> {
        if (io.readRegister(DeviceRegister.REG_B) == 1) {
            // data not taken yet
            return;
        }

        // current word was retrieved, get next
        const now = this.readSteadyClock();
        if (now - this.lastReadAt > 0.100e9) {
            const data = this.readerData.shift();
            if (data != undefined) {
                console.log(`ASR-33 reader: Next ${data.toString(16)}, ${this.readerData.length} remaining`);
                io.writeRegister(DeviceRegister.REG_A, data);
                io.writeRegister(DeviceRegister.REG_B, 1);
            }
            this.lastReadAt = this.readSteadyClock();
        }
    }

    private async onPunchTick(io: IOContext): Promise<void> {
        const regD = io.readRegister(DeviceRegister.REG_D);
        const now = this.readSteadyClock();

        // check if pending data
        if (this.gotPunch) {
            if (now - this.gotPunchAt > 0.100e9) {
                io.writeRegister(DeviceRegister.REG_D, regD | 2); // ack data
                io.emitEvent('punch', this.punchData);
                this.gotPunch = false;
            }
        }

        // check if new data
        if (io.readRegister(DeviceRegister.REG_D) & 1) {
            this.gotPunch = true;
            this.punchData = io.readRegister(DeviceRegister.REG_C);
            this.gotPunchAt = now;
            io.writeRegister(DeviceRegister.REG_D, regD & ~1); // remove req
        }
    }
}
