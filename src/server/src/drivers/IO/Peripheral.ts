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

export enum DeviceRegister {
    REG_ENABLED     = 0,
    REG_A           = 1,
    REG_B           = 2,
    REG_C           = 3,
    REG_D           = 4,
}

export enum DeviceID {
    DEV_ID_NULL     = 0,
    DEV_ID_ASR33    = 1,
    DEV_ID_PC04     = 2,
    DEV_ID_TC08     = 3,
    DEV_ID_RF08     = 4,
    DEV_ID_DF32     = 5,
    DEV_ID_TT1      = 6,
    DEV_ID_TT2      = 7,
    DEV_ID_TT3      = 8,
    DEV_ID_TT4      = 9,
    DEV_ID_KW8I     = 10,
}

export interface IOContext {
    readRegister(reg: DeviceRegister): number;
    writeRegister(reg: DeviceRegister, value: number): void;
    dataBreak(req: DataBreakRequest): Promise<DataBreakReply>;

    emitEvent(action: string, data: any): void;
}

export interface Peripheral {
    getDeviceID(): DeviceID;
    getBusConnections(): number[];
    requestAction(action: string, data: any): void;
    run(io: IOContext): Promise<void>;
}
