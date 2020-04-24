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
import { sleepMs } from '../sleep';
import { PC04Configuration } from '../types/PeripheralTypes';

export class PC04 extends Peripheral {
    private readerActive: boolean = false;
    private readerTape: number[] = [];
    private readerTapePos: number = 0;

    constructor(private readonly conf: PC04Configuration) {
        super(conf.id);
    }

    public getConfiguration(): PC04Configuration {
        return this.conf;
    }

    public reconfigure(newConf: PC04Configuration) {
        const io = this.io;

        const baudSel = this.toBaudSel(newConf.baudRate);
        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, (regB & 0o0777) | (baudSel << 9));

        Object.assign(this.conf, newConf);
    }

    public getBusConnections(): number[] {
        return [0o01, 0o02];
    }

    public requestAction(action: string, data: any): any {
        switch (action) {
            case 'reader-tape-set':
                this.readerTape = Array.from(data as Buffer);
                this.readerTapePos = 0;
                break;
            case 'reader-set-active':
                this.readerActive = data;
                break;
        }
    }

    public async run(): Promise<void> {
        this.reconfigure(this.conf);

        const io = this.io;
        this.runReader(io);
        this.runPunch(io);
    }

    public async runReader(io: IOContext): Promise<void> {
        while (this.keepAlive) {
            const wantData =(io.readRegister(DeviceRegister.REG_B) & 1) != 0;
            if (!wantData || !this.readerActive) {
                // no data request
                await sleepMs(1);
                continue;
            }

            // current word was retrieved, get next
            const data = this.readNextFromTape();
            if (data !== null) {
                io.writeRegister(DeviceRegister.REG_A, data);

                const regB = io.readRegister(DeviceRegister.REG_B);
                io.writeRegister(DeviceRegister.REG_B, regB & 0o7000 | 2); // notify of new data
            }

            await sleepMs(1000 / this.baudRateToCPS(this.conf.baudRate));
        }
    }

    private readNextFromTape(): number | null {
        if (this.readerTapePos < this.readerTape.length) {
            const data = this.readerTape[this.readerTapePos++];
            console.log(`PC04: Read ${data.toString(16)}, ${this.readerTapePos} / ${this.readerTape.length}`);
            this.io.emitEvent('readerPos', this.readerTapePos);
            return data;
        } else {
            return null;
        }
    }


    private async runPunch(io: IOContext) {
        while (this.keepAlive) {
            let regD = io.readRegister(DeviceRegister.REG_D);
            const newData = (regD & 1) != 0;

            if (!newData) {
                await sleepMs(1);
                continue;
            }

            io.writeRegister(DeviceRegister.REG_D, regD & ~1); // remove request
            const punchData = io.readRegister(DeviceRegister.REG_C) & 0xFF;

            await sleepMs(1000 / this.baudRateToCPS(this.conf.baudRate));

            regD = io.readRegister(DeviceRegister.REG_D);
            io.writeRegister(DeviceRegister.REG_D, regD | 2); // ack data

            console.log(`PC04: Punch ${punchData.toString(16)}`);
            io.emitEvent('punch', punchData);
        }
    }
}
