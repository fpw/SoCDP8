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
/// <reference types="emscripten" />

import { ConsoleState } from "../../../types/ConsoleTypes";
import { DeviceID } from "../../../types/PeripheralTypes";

declare function createWASM8(options: { locateFile: (path: string) => string }): Promise<{
    addFunction: typeof addFunction;
    cwrap: typeof cwrap;
    getValue: typeof getValue;
    setValue: typeof setValue;
    writeArrayToMemory: typeof writeArrayToMemory;
    _malloc: (n: number) => number;
    _free: (a: number) => void;
}>;

interface Wasm8Calls {
    create(actionFunc: number): number;
    getConsoleOut(ctx: number): number;
    getLampsOut(ctx: number): number;
    getConsoleIn(ctx: number): number;
    setPeripheral(ctx: number, id: number, enable: number): void;
    peripheralAction(ctx: number, id: number, ev: number, p1: number, p2: number): void;
    setThrottle(ctx: number, throttle: number): void;
    destroy(ctx: number): void;

    readPointer(ptr: number, type: string): number;
    writePointer(ptr: number, value: number, type: string): void;

    malloc(len: number): number;
    free(buf: number): void;
    writeArray(array: number[], dst: number): void;
}

export class Wasm8Context {
    private readonly EventConfigure = 1;
    private readonly EventClearCore = 2;
    private readonly EventWriteWord = 3;

    private calls?: Wasm8Calls;
    private ctx?: number;
    private consoleOut?: number;
    private consoleIn?: number;
    private lampsOut?: number;

    public async create(actionListener: (dev: number, action: number, p1: number, p2: number) => void) {
        const inst = await createWASM8({
            locateFile: (path: string) => {
                return `/${path}`;
            },
        });

        const onActionPtr = inst.addFunction(actionListener, "viiii");

        this.calls = {
            create: inst.cwrap("pdp8_create", "number", ["number"]),
            getConsoleIn: inst.cwrap("pdp8_get_console_in", "number", ["number"]),
            getConsoleOut: inst.cwrap("pdp8_get_console_out", "number", ["number"]),
            getLampsOut: inst.cwrap("pdp8_get_lamps_out", "number", ["number"]),
            setPeripheral: inst.cwrap("pdp8_set_peripheral", null, ["number", "number", "number"]),
            peripheralAction: inst.cwrap("pdp8_peripheral_action", null, ["number", "number", "number", "number"]),
            setThrottle: inst.cwrap("pdp8_set_throttle", null, ["number", "number"]),
            destroy: inst.cwrap("pdp8_destroy", null, ["number"]),

            readPointer: inst.getValue,
            writePointer: inst.setValue,

            malloc: inst._malloc,
            free: inst._free,
            writeArray: inst.writeArrayToMemory,
        };

        this.ctx = this.calls.create(onActionPtr);
        this.consoleIn = this.calls.getConsoleIn(this.ctx);
        this.consoleOut = this.calls.getConsoleOut(this.ctx);
        this.lampsOut = this.calls.getLampsOut(this.ctx);
    }

    public setThrottle(throttle: number) {
        if (!this.calls || !this.ctx) {
            throw Error("Not created");
        }

        this.calls.setThrottle(this.ctx, throttle);
    }

    public setSwitch(sw: string, state: boolean) {
        if (!this.calls || !this.ctx) {
            throw Error("Not created");
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

        if (["start", "load", "dep", "exam", "cont", "stop"].includes(sw) && state) {
            setTimeout(() => {
                this.setSwitch(sw, false);
            }, 100);
        }
    }

    public getConsoleState(): ConsoleState {
        if (!this.calls || !this.ctx || !this.consoleOut || !this.consoleIn) {
            throw Error("Not created");
        }

        return {
            lampOverride: false,
            switchOverride: false,
            lamps: {
                dataField: this.wordToLamps(0, 3),
                instField: this.wordToLamps(3, 3),
                pc: this.wordToLamps(6, 12),
                memAddr: this.wordToLamps(18, 12),
                memBuf: this.wordToLamps(30, 12),
                link: this.wordToLamp(42),
                ac: this.wordToLamps(43, 12),
                stepCounter: this.wordToLamps(55, 5),
                mqr: this.wordToLamps(60, 12),
                instruction: this.wordToLamps(72, 8),
                state: this.wordToLamps(80, 6),
                ion: this.wordToLamp(86),
                pause: this.wordToLamp(87),
                run: this.wordToLamp(88),
            },
            switches: {
                dataField: this.calls.readPointer(this.consoleIn + 0, "i16"),
                instField: this.calls.readPointer(this.consoleIn + 2, "i16"),
                swr: this.calls.readPointer(this.consoleIn + 4, "i16"),
                start: this.calls.readPointer(this.consoleIn + 6, "i16"),
                load: this.calls.readPointer(this.consoleIn + 8, "i16"),
                dep: this.calls.readPointer(this.consoleIn + 10, "i16"),
                exam: this.calls.readPointer(this.consoleIn + 12, "i16"),
                cont: this.calls.readPointer(this.consoleIn + 14, "i16"),
                stop: this.calls.readPointer(this.consoleIn + 16, "i16"),
                singStep: this.calls.readPointer(this.consoleIn + 18, "i16"),
                singInst: this.calls.readPointer(this.consoleIn + 20, "i16"),
            },
        };
    }

    private wordToLamp(offset: number): number {
        if (!this.lampsOut || !this.calls) {
            throw Error("Not connected");
        }

        return this.calls.readPointer(this.lampsOut + offset, "i8") & 0xFF;
    }

    private wordToLamps(offset: number, size: number): number[] {
        const res: number[] = [];

        for (let i = size - 1; i >= 0; i--) {
            res.push(this.wordToLamp(offset + i));
        }

        return res;
    }

    private writeSwitch(offset: number, index: number, state: boolean) {
        if (!this.consoleIn || !this.calls) {
            throw Error("Not connected");
        }

        let val = this.calls.readPointer(this.consoleIn + offset, "i16");
        if (state) {
            val |= (1 << index);
        } else {
            val &= ~(1 << index);
        }
        this.calls.writePointer(this.consoleIn + offset, val, "i16");
    }

    public configureCPU(maxMemField: number, eae: boolean, kt8i: boolean, bsw: boolean, fixCont: boolean) {
        let confWord = maxMemField;
        if (eae) {
            confWord |= 0o10;
        }
        if (kt8i) {
            confWord |= 0o20;
        }
        if (bsw) {
            confWord |= 0o40;
        }
        if (fixCont) {
            confWord |= 0o60;
        }

        this.sendPeripheralAction(0, this.EventConfigure, confWord, 0);
    }

    public clearPeripherals() {
        if (!this.ctx || !this.calls) {
            throw Error("Not connected");
        }

        for (let i = 1; i < (DeviceID._COUNT as number); i++) {
            this.calls.setPeripheral(this.ctx, i, 0);
        }
    }

    public addPeripheral(id: DeviceID) {
        if (!this.ctx || !this.calls) {
            throw Error("Not connected");
        }
        this.calls.setPeripheral(this.ctx, id, 1);
    }

    public clearCore() {
        this.sendPeripheralAction(0, this.EventClearCore, 0, 0);
    }

    public writeCore(addr: number, value: number) {
        this.sendPeripheralAction(0, this.EventWriteWord, addr, value);
    }

    public sendPeripheralAction(dev: number, action: number, p1: number, p2: number) {
        if (!this.ctx || !this.calls) {
            throw Error("Not connected");
        }

        this.calls.peripheralAction(this.ctx, dev, action, p1, p2);
    }

    public sendPeripheralActionBuffer(dev: number, action: number, buf: Uint8Array) {
        if (!this.ctx || !this.calls) {
            throw Error("Not connected");
        }

        const bufAddr = this.calls.malloc(buf.byteLength);
        if (!bufAddr) {
            throw Error("Out of virtual memory");
        }
        this.calls.writeArray([...buf], bufAddr);
        this.calls.peripheralAction(this.ctx, dev, action, bufAddr, buf.byteLength);
    }

    public fetchBuffer(addr: number, size: number) {
        if (!this.ctx || !this.calls) {
            throw Error("Not connected");
        }

        if (!addr) {
            throw Error("Out of WASM memory");
        }

        const arr = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            arr[i] = this.calls.readPointer(addr + i, "i8");
        }
        this.calls.free(addr);

        return arr;
    }

    public destroy() {
        if (!this.calls || !this.ctx) {
            throw Error("Not created");
        }

        this.calls.destroy(this.ctx);
    }
}
