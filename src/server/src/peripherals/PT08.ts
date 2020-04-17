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

import { Peripheral, DeviceRegister, IOContext, BaudSelect } from '../drivers/IO/Peripheral';
import { sleepMs } from '../sleep';
import { PT08Configuration, DeviceID } from '../types/PeripheralTypes';

export class PT08 extends Peripheral {
    private readerActive: boolean = false;
    private readerTape: number[] = [];
    private readerTapePos: number = 0;
    private keyBuffer: number[] = [];

    constructor(private conf: PT08Configuration) {
        super(conf.id);
    }

    public getBusConnections(): number[] {
        switch (this.id) {
            case DeviceID.DEV_ID_PT08:  return [0o03, 0o04];
            case DeviceID.DEV_ID_TT1:   return [0o40, 0o41];
            case DeviceID.DEV_ID_TT2:   return [0o42, 0o43];
            case DeviceID.DEV_ID_TT3:   return [0o44, 0o45];
            case DeviceID.DEV_ID_TT4:   return [0o46, 0o47];
        }

        throw Error(`Invalid PT08 id: ${this.id}`)
    }

    public getConfiguration(): PT08Configuration {
        return this.conf;
    }

    public requestAction(action: string, data: any): void {
        switch (action) {
            case 'key-press':
                this.onKey(data);
                break;
            case 'reader-tape-set':
                this.readerTape = Array.from(data as Buffer);
                this.readerTapePos = 0;
                break;
            case 'reader-set-active':
                this.readerActive = data;
                break;
        }
    }

    private onKey(key: number): void {
        if (!this.readerActive) {
            this.keyBuffer.push(key);
        }
    }

    public async run(io: IOContext): Promise<void> {
        io.writeRegister(DeviceRegister.REG_B, BaudSelect.BAUD_110 << 9);

        this.runReader(io);
        this.runPunch(io);
    }

    private async runReader(io: IOContext) {
        while (this.keepAlive) {
            const data = this.readNext();
            const regB = io.readRegister(DeviceRegister.REG_B);
            if (data !== null) {
                io.writeRegister(DeviceRegister.REG_A, data);
                io.writeRegister(DeviceRegister.REG_B, regB & 0o7000 | 1);
            }

            await sleepMs(1000 / this.baudToCPS(regB >> 9));
        }
    }

    private readNext(): number | null {
        if (this.readerActive) {
            return this.readNextFromTape();
        } else {
            return this.readNextKey();
        }
    }

    private readNextKey(): number | null {
        const data = this.keyBuffer.shift();
        if (data !== undefined) {
            return data;
        } else {
            return null;
        }
    }

    private readNextFromTape(): number | null {
        if (this.readerTapePos < this.readerTape.length) {
            const data = this.readerTape[this.readerTapePos++];
            console.log(`PT08: Read ${data.toString(16)}, ${this.readerTapePos} / ${this.readerTape.length}`);
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
            const punchData = io.readRegister(DeviceRegister.REG_C);

            const baud = io.readRegister(DeviceRegister.REG_B) >> 9;
            await sleepMs(1000 / this.baudToCPS(baud));

            regD = io.readRegister(DeviceRegister.REG_D);
            io.writeRegister(DeviceRegister.REG_D, regD | 2); // ack data
            io.emitEvent('punch', punchData);
        }
    }
}
