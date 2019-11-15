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
import { sleepMs } from '../sleep';

export class ASR33 implements Peripheral {
    private readonly READER_CPS = 10;
    private readonly PUNCH_CPS = 12; // with 10, Focal69 identifies as PDP-8/L

    private readerData: number[] = [];
    private forcePunch: boolean = false;

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
                this.forcePunch = true;
                break;
        }
    }

    public async run(io: IOContext): Promise<void> {
        this.runReader(io);
        this.runPunch(io);
    }

    private async runReader(io: IOContext) {
        while (true) {
            if (io.readRegister(DeviceRegister.REG_B) == 1) {
                // data not taken yet
                await sleepMs(1);
                continue;
            }

            // current word was retrieved, get next
            const data = this.readerData.shift();
            if (data != undefined) {
                console.log(`ASR-33 reader: Next ${data.toString(16)}, ${this.readerData.length} remaining`);
                io.writeRegister(DeviceRegister.REG_A, data);
                io.writeRegister(DeviceRegister.REG_B, 1);
            }

            await sleepMs(1000 / this.READER_CPS);
        }
    }

    private async runPunch(io: IOContext) {
        while (true) {
            if (this.forcePunch) {
                io.writeRegister(DeviceRegister.REG_D, 2);
                this.forcePunch = false;
            }

            let regD = io.readRegister(DeviceRegister.REG_D);
            const newData = (regD & 1) != 0;

            if (!newData) {
                await sleepMs(1);
                continue;
            }

            io.writeRegister(DeviceRegister.REG_D, regD & ~1); // remove request
            const punchData = io.readRegister(DeviceRegister.REG_C);

            await sleepMs(1000 / this.PUNCH_CPS);

            regD = io.readRegister(DeviceRegister.REG_D);
            io.writeRegister(DeviceRegister.REG_D, regD | 2); // ack data
            io.emitEvent('punch', punchData);
        }
    }
}
