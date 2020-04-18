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
import { PeripheralConfiguration, DeviceID } from '../../types/PeripheralTypes';

export enum DeviceRegister {
    REG_ENABLED     = 0,
    REG_A           = 1,
    REG_B           = 2,
    REG_C           = 3,
    REG_D           = 4,
    REG_E           = 5,
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
    private ctx?: IOContext;

    constructor(protected readonly id: DeviceID) {
    }

    public setIOContext(ctx: IOContext) {
        this.ctx = ctx;
    }

    protected get io(): IOContext {
        if (!this.ctx) {
            throw Error('No I/O context');
        }
        return this.ctx;
    }

    public abstract getBusConnections(): number[];

    public abstract run(): Promise<void>;

    public getDeviceID(): DeviceID {
        return this.id;
    }

    public requestAction(action: string, data: any): void {
    }

    public abstract getConfiguration(): PeripheralConfiguration;
    public abstract reconfigure(conf: PeripheralConfiguration): void;

    public async saveState(): Promise<void> {
    }

    public stop(): void {
        this.keepRunning = false;
    }

    protected toBaudRate(sel: BaudSelect): number {
        switch (sel) {
            case BaudSelect.BAUD_110:   return 110;
            case BaudSelect.BAUD_150:   return 150;
            case BaudSelect.BAUD_300:   return 300;
            case BaudSelect.BAUD_1200:  return 1200;
            case BaudSelect.BAUD_2400:  return 2400;
            case BaudSelect.BAUD_4800:  return 4800;
            case BaudSelect.BAUD_9600:  return 9600;
            case BaudSelect.BAUD_19200: return 19200;
        }
    }

    protected toBaudSel(rate: number): BaudSelect {
        switch (rate) {
            case 110:   return BaudSelect.BAUD_110;
            case 150:   return BaudSelect.BAUD_150;
            case 300:   return BaudSelect.BAUD_300;
            case 1200:  return BaudSelect.BAUD_1200;
            case 2400:  return BaudSelect.BAUD_2400;
            case 4800:  return BaudSelect.BAUD_4800;
            case 9600:  return BaudSelect.BAUD_9600;
            case 19200: return BaudSelect.BAUD_19200;
            default:    throw Error('Invalid baud select');
        }
    }

    protected baudToCPS(sel: BaudSelect): number {
        const symbolsPerChar = 10;
        return this.toBaudRate(sel) / symbolsPerChar;
    }

    protected get keepAlive(): boolean {
        return this.keepRunning;
    }
}
