/*
 *   SoCDP8 - A PDP-8/I implementation on a SoC
 *   Copyright (C) 2021 Folke Will <folko@solhost.org>
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

import { ConsoleState } from '../../../types/ConsoleTypes';

declare const createWASM8: any;

interface Wasm8Calls {
    create(actionFunc: number): number;
    getConsoleOut(ctx: number): number;
    getConsoleIn(ctx: number): number;
    writeCore(ctx: number, addr: number, word: number): void;
    peripheralAction(ctx: number, id: number, action: number, data: number): void;
    destroy(ctx: number): void;

    readPointer(ptr: number, type: string): number;
    writePointer(ptr: number, value: number, type: string): void;
}

export class Wasm8Context {
    private calls?: Wasm8Calls;
    private ctx?: number;
    private consoleOut?: number;
    private consoleIn?: number;

    public async create(actionListener: (dev: number, action: number, data: number) => void) {
        const inst = await createWASM8({
            locateFile: (path: string) => {
                return `${process.env.PUBLIC_URL}/${path}`;
            },
        });

        const onActionPtr = inst.addFunction(actionListener, 'viii');

        this.calls = {
            create: inst.cwrap("pdp8_create", 'number', ['number']),
            getConsoleOut: inst.cwrap("pdp8_get_console_out", 'number', ['number']),
            getConsoleIn: inst.cwrap("pdp8_get_console_in", 'number', ['number']),
            writeCore: inst.cwrap("pdp8_write_core", '', ['number', 'number', 'number']),
            peripheralAction: inst.cwrap("pdp8_peripheral_action", '', ['number', 'number', 'number', 'number']),
            destroy: inst.cwrap("pdp8_destroy", '', ['number']),

            readPointer: inst.getValue,
            writePointer: inst.setValue,
        };

        this.ctx = this.calls.create(onActionPtr);
        this.consoleOut = this.calls.getConsoleOut(this.ctx);
        this.consoleIn = this.calls.getConsoleIn(this.ctx);
        console.log(this.ctx, this.consoleOut, this.consoleIn);
    }

    public setSwitch(sw: string, state: boolean) {
        if (!this.calls || !this.ctx) {
            throw Error(`Not created`);
        }

        switch (sw) {
            case "df0": this.writeSwitch(0, 2, state); break;
            case "df1": this.writeSwitch(0, 1, state); break;
            case "df2": this.writeSwitch(0, 0, state); break;
            case "if0": this.writeSwitch(2, 2, state); break;
            case "if1": this.writeSwitch(2, 1, state); break;
            case "if2": this.writeSwitch(2, 0, state); break;
            case "swr0": this.writeSwitch(4, 11, state); break;
            case "swr1": this.writeSwitch(4, 10, state); break;
            case "swr2": this.writeSwitch(4, 9, state); break;
            case "swr3": this.writeSwitch(4, 8, state); break;
            case "swr4": this.writeSwitch(4, 7, state); break;
            case "swr5": this.writeSwitch(4, 6, state); break;
            case "swr6": this.writeSwitch(4, 5, state); break;
            case "swr7": this.writeSwitch(4, 4, state); break;
            case "swr8": this.writeSwitch(4, 3, state); break;
            case "swr9": this.writeSwitch(4, 2, state); break;
            case "swr10": this.writeSwitch(4, 1, state); break;
            case "swr11": this.writeSwitch(4, 0, state); break;
            case "start": this.writeSwitch(6, 0, state); break;
            case "load": this.writeSwitch(8, 0, state); break;
            case "dep": this.writeSwitch(10, 0, state); break;
            case "exam": this.writeSwitch(12, 0, state); break;
            case "cont": this.writeSwitch(14, 0, state); break;
            case "stop": this.writeSwitch(16, 0, state); break;
            case "sing_step": this.writeSwitch(18, 0, state); break;
            case "sing_inst": this.writeSwitch(20, 0, state); break;
        }

        if (["start", "load", "dep", "exam", "cont", "stop"].includes(sw) && state == true) {
            setTimeout(() => {
                this.setSwitch(sw, false);
            }, 100);
        }
    }

    public getConsoleState(): ConsoleState {
        if (!this.calls || !this.ctx || !this.consoleOut || !this.consoleIn) {
            throw Error(`Not created`);
        }

        return {
            lampOverride: false,
            switchOverride: false,
            lamps: {
                dataField: this.wordToLamps(0, 3),
                instField: this.wordToLamps(2, 3),
                pc: this.wordToLamps(4, 12),
                memAddr: this.wordToLamps(6, 12),
                memBuf: this.wordToLamps(8, 12),
                link: this.wordToLamp(10),
                ac: this.wordToLamps(12, 12),
                stepCounter: this.wordToLamps(14, 5),
                mqr: this.wordToLamps(16, 12),
                instruction: this.wordToLamps(18, 8),
                state: this.wordToLamps(20, 6),
                ion: this.wordToLamp(22),
                pause: this.wordToLamp(24),
                run: this.wordToLamp(26),
            },
            switches: {
                dataField: this.calls.readPointer(this.consoleIn + 0, 'i16'),
                instField: this.calls.readPointer(this.consoleIn + 2, 'i16'),
                swr: this.calls.readPointer(this.consoleIn + 4, 'i16'),
                start: this.calls.readPointer(this.consoleIn + 6, 'i16'),
                load: this.calls.readPointer(this.consoleIn + 8, 'i16'),
                dep: this.calls.readPointer(this.consoleIn + 10, 'i16'),
                exam: this.calls.readPointer(this.consoleIn + 12, 'i16'),
                cont: this.calls.readPointer(this.consoleIn + 14, 'i16'),
                stop: this.calls.readPointer(this.consoleIn + 16, 'i16'),
                singStep: this.calls.readPointer(this.consoleIn + 18, 'i16'),
                singInst: this.calls.readPointer(this.consoleIn + 20, 'i16'),
            },
        };
    }

    private wordToLamp(offset: number, lampIndex = 0): number {
        if (!this.consoleOut || !this.calls) {
            throw Error('Not conncted');
        }

        const word = this.calls.readPointer(this.consoleOut + offset, 'i16');
        return (word & (1 << lampIndex)) ? 15 : 0;
    }

    private wordToLamps(offset: number, size: number): number[] {
        const res: number[] = [];

        for (let i = size - 1; i >= 0; i--) {
            res.push(this.wordToLamp(offset, i));
        }

        return res;
    }

    private writeSwitch(offset: number, index: number, state: boolean) {
        if (!this.consoleIn || !this.calls) {
            throw Error('Not conncted');
        }

        let val = this.calls.readPointer(this.consoleIn + offset, 'i16');
        if (state) {
            val |= (1 << index);
        } else {
            val &= ~(1 << index);
        }
        this.calls.writePointer(this.consoleIn + offset, val, 'i16');
    }

    public writeCore(addr: number, value: number) {
        if (!this.ctx || !this.calls) {
            throw Error('Not conncted');
        }

        this.calls.writeCore(this.ctx, addr, value);
    }

    public sendPeripheralAction(dev: number, action: number, data: number) {
        if (!this.ctx || !this.calls) {
            throw Error('Not conncted');
        }

        this.calls.peripheralAction(this.ctx, dev, action, data);
    }

    public destroy() {
        if (!this.calls || !this.ctx) {
            throw Error(`Not created`);
        }

        this.calls.destroy(this.ctx);
    }
}
