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
    REG_E           = 5,
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
    DEV_ID_RK8      = 11,
}

export enum BaudSelect {
    BAUD_110        = 0,
    BAUD_150        = 1,
    BAUD_300        = 2,
    BAUD_1200       = 3,
    BAUD_2400       = 4,
    BAUD_4800       = 5,
    BAUD_9600       = 6,
    BAUD_19200      = 7,
}

export interface IOContext {
    readRegister(reg: DeviceRegister): number;
    writeRegister(reg: DeviceRegister, value: number): void;
    dataBreak(req: DataBreakRequest): Promise<DataBreakReply>;

    emitEvent(action: string, data: any): void;
}

export abstract class Peripheral {
    private keepRunning = true;

    public abstract getDeviceID(): DeviceID;
    public abstract getBusConnections(): number[];
    public abstract run(io: IOContext): Promise<void>;

    public requestAction(action: string, data: any): void {
    }

    public async saveState(): Promise<void> {
    }

    public stop(): void {
        this.keepRunning = false;
    }

    protected baudToCPS(sel: BaudSelect): number {
        const symbolsPerChar = 10;

        switch (sel) {
            case BaudSelect.BAUD_110:   return 110 / symbolsPerChar;
            case BaudSelect.BAUD_150:   return 150 / symbolsPerChar;
            case BaudSelect.BAUD_300:   return 300 / symbolsPerChar;
            case BaudSelect.BAUD_1200:  return 1200 / symbolsPerChar;
            case BaudSelect.BAUD_2400:  return 2400 / symbolsPerChar;
            case BaudSelect.BAUD_4800:  return 4800 / symbolsPerChar;
            case BaudSelect.BAUD_9600:  return 9600 / symbolsPerChar;
            case BaudSelect.BAUD_19200: return 19200 / symbolsPerChar;
        }
    }

    protected get keepAlive(): boolean {
        return this.keepRunning;
    }
}
