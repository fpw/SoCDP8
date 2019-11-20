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

import { Peripheral, IOContext, DeviceRegister, DeviceID } from '../drivers/IO/Peripheral';
import { sleepMs } from '../sleep';

export class PC04 implements Peripheral {
    private readonly READER_CPS = 300;
    private readonly PUNCH_CPS = 50;

    private readerData: number[] = [];

    public getDeviceID(): DeviceID {
        return DeviceID.DEV_ID_PC04;
    }

    public getBusConnections(): number[] {
        return [0o01, 0o02];
    }

    public requestAction(action: string, data: any): any {
        switch (action) {
            case 'append-data':
                this.readerData.push(...data);
                break;
            case 'set-data':
                this.readerData = Array.from(data as Buffer);
                break;
        }
    }

    public async run(io: IOContext): Promise<void> {
        this.runReader(io);
        this.runPunch(io);
    }

    public async runReader(io: IOContext): Promise<void> {
        while (true) {
            if ((io.readRegister(DeviceRegister.REG_B) & 1) == 0) {
                // no data request
                await sleepMs(1);
                continue;
            }

            // current word was retrieved, get next
            const data = this.readerData.shift();
            if (data != undefined) {
                console.log(`PC04 reader: Next ${data.toString(16)}, ${this.readerData.length} remaining`);
                io.writeRegister(DeviceRegister.REG_A, data);
                io.writeRegister(DeviceRegister.REG_B, 2); // notify of new data
            }

            await sleepMs(1000 / this.READER_CPS);
        }
    }

    private async runPunch(io: IOContext) {
        while (true) {
            let regD = io.readRegister(DeviceRegister.REG_D);
            const newData = (regD & 1) != 0;

            if (!newData) {
                await sleepMs(1);
                continue;
            }

            io.writeRegister(DeviceRegister.REG_D, regD & ~1); // remove request
            const punchData = io.readRegister(DeviceRegister.REG_C) & 0xFF;

            await sleepMs(1000 / this.PUNCH_CPS);

            regD = io.readRegister(DeviceRegister.REG_D);
            io.writeRegister(DeviceRegister.REG_D, regD | 2); // ack data
            console.log(`PC04: Punch ${punchData.toString(16)}`);
            io.emitEvent('punch', punchData);
        }
    }
}
