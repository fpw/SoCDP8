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

import { DataBreakRequest, DataBreakReply } from "./DataBreak";

 // musst match dev_type in peripheral.vhd
export enum DeviceType {
    NULL            = 0,
    ASR33           = 1,
    PR8             = 2,
    TC08            = 3,
}

export enum DeviceRegister {
    REG_TYPE        = 0,
    REG_A           = 1,
    REG_B           = 2,
    REG_C           = 3,
    REG_D           = 4,
}

export interface IOContext {
    readRegister(reg: DeviceRegister): number;
    writeRegister(reg: DeviceRegister, value: number): void;
    dataBreak(req: DataBreakRequest): DataBreakReply;

    emitEvent(action: string, data: any): void;
}

export abstract class Peripheral {
    public abstract getType(): DeviceType;

    public abstract getBusConnections(): Map<number, number>;

    public abstract onTick(io: IOContext): Promise<void>;

    public abstract requestAction(action: string, data: any): void;

    protected readSteadyClock(): bigint {
        return process.hrtime.bigint();
    }
}
