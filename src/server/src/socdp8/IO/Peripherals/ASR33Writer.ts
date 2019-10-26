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

import { Peripheral, DeviceRegister, DeviceType, IOContext } from './Peripheral';

export class ASR33Writer extends Peripheral {
    private lastPunchAt: bigint = 0n;
    private onPunch?: (data: number) => Promise<void>;

    constructor(private busNum: number) {
        super();
    }

    public getType(): DeviceType {
        return DeviceType.ASR33_WRITER;
    }

    public getBusConnections(): Map<number, number> {
        const map = new Map<number, number>();
        map.set(this.busNum, 0);
        return map;
    }

    public setOnPunch(callback: (data: number) => Promise<void>) {
        this.onPunch = callback;
    }

    public async onTick(io: IOContext): Promise<void> {
        if (io.readRegister(DeviceRegister.REG_B) != 1) {
            // no new data yet
            return;
        }

        // new word ready
        const now = this.readSteadyClock();
        if (now - this.lastPunchAt > 0.100e9) {
            let data = io.readRegister(DeviceRegister.REG_A);
            if (this.onPunch) {
                io.writeRegister(DeviceRegister.REG_B, 2); // ack data
                this.lastPunchAt = now;
                await this.onPunch(data);
            }
        }
    }
}
