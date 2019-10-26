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

import { Peripheral, DeviceType, IOContext, DeviceRegister } from './Peripheral';

export class PR8Reader extends Peripheral {
    private lastReadAt: bigint = 0n;
    private readerData: number[] = [];

    public constructor(private busNum: number) {
        super();
    }

    public getType(): DeviceType {
        return DeviceType.PR8_READER;
    }

    public getBusConnections(): Map<number, number> {
        const map = new Map<number, number>();
        map.set(this.busNum, 0);
        return map;
    }

    public appendReaderData(data: number[]) {
        this.readerData.push(...data);
    }

    public clearReaderData() {
        this.readerData = [];
        this.lastReadAt = this.readSteadyClock();
    }

    public async onTick(io: IOContext): Promise<void> {
        if ((io.readRegister(DeviceRegister.REG_B) & 1) == 0) {
            // no data request
            return;
        }

        // current word was retrieved, get next
        const now = this.readSteadyClock();
        if (now - this.lastReadAt > (1.0 / 300) * 1e9) {
            const data = this.readerData.shift();
            if (data != undefined) {
                console.log(`Next ${data}, ${this.readerData.length} remaining`);
                io.writeRegister(DeviceRegister.REG_A, data);
                io.writeRegister(DeviceRegister.REG_B, 2); // notify new data
            }
            this.lastReadAt = this.readSteadyClock();
        }
    }
}
