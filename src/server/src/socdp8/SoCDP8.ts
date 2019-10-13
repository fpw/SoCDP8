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

import { UIOMapper } from '../UIO/UIOMapper';
import { Console, LampState, SwitchState } from './Console/Console';
import { CoreMemory } from "./CoreMemory/CoreMemory";
import { IOController } from './IO/IOController';
import { ASR33 } from './IO/Peripherals/ASR33';
import { PR8 } from './IO/Peripherals/PR8';

export interface ConsoleState {
    lamps: LampState;
    lampOverride: boolean;
    
    switches: SwitchState;
    switchOverride: boolean;
}

export class SoCDP8 {
    private cons: Console;
    private mem: CoreMemory;
    private io: IOController;
    private asr33: ASR33;
    private pr8: PR8;

    public constructor() {
        let uio = new UIOMapper();
        let memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        let consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        let ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');

        this.cons = new Console(consBuf);
        this.mem = new CoreMemory(memBuf);
        this.io = new IOController(ioBuf);

        this.asr33 = new ASR33(this.io);

        this.pr8 = new PR8(this.io);
        this.storeRIMLoader();
    }

    public storeRIMLoader(): void {
        this.mem.pokeWord(0o7756, 0o6032); // KCC         / clear keyboard flag and ac
        this.mem.pokeWord(0o7757, 0o6031); // KSF         / skip if keyboard flag
        this.mem.pokeWord(0o7760, 0o5357); // JMP 7757    / jmp -1
        this.mem.pokeWord(0o7761, 0o6036); // KRB         / clear ac, or AC with data (8 bit), clear flag
        this.mem.pokeWord(0o7762, 0o7106); // CLL RTL     / clear link, rotate left 2
        this.mem.pokeWord(0o7763, 0o7006); // RTL         / rotate left 2
        this.mem.pokeWord(0o7764, 0o7510); // SPA         / skip if ac > 0
        this.mem.pokeWord(0o7765, 0o5357); // JMP 7757    / jmp back
        this.mem.pokeWord(0o7766, 0o7006); // RTL         / rotate left 2
        this.mem.pokeWord(0o7767, 0o6031); // KSF         / skip if keyboard flag
        this.mem.pokeWord(0o7770, 0o5367); // JMP 7767    / jmp -1
        this.mem.pokeWord(0o7771, 0o6034); // KRS         / or AC with keyboard (8 bit)
        this.mem.pokeWord(0o7772, 0o7420); // SNL         / skip if link
        this.mem.pokeWord(0o7773, 0o3776); // DCA I 7776  / store ac in [7776], clear ac
        this.mem.pokeWord(0o7774, 0o3376); // DCA 7776    / store ac in 7776, clear ac
        this.mem.pokeWord(0o7775, 0o5356); // JMP 7756
        this.mem.pokeWord(0o7776, 0o0000); // address
    }

    public readCoreDump() {
        return this.mem.dumpCore();
    }

    public readConsoleState(): ConsoleState {
        let state: ConsoleState = {
            lampOverride: this.cons.isLampOverridden(),
            lamps: this.cons.readLamps(),

            switchOverride: this.cons.isSwitchOverridden(),
            switches: this.cons.readSwitches()
        }

        return state;
    }

    public async setSwitch(sw: string, state: boolean) {
        this.cons.setSwitchOverride(true);
        let switches = this.cons.readSwitches();
        switch (sw) {
            case 'df0': switches.dataField = this.setBitValue(switches.dataField, 2, state); break;
            case 'df1': switches.dataField = this.setBitValue(switches.dataField, 1, state); break;
            case 'df2': switches.dataField = this.setBitValue(switches.dataField, 0, state); break;
            case 'if0': switches.instField = this.setBitValue(switches.instField, 2, state); break;
            case 'if1': switches.instField = this.setBitValue(switches.instField, 1, state); break;
            case 'if2': switches.instField = this.setBitValue(switches.instField, 0, state); break;
            case 'swr0': switches.swr = this.setBitValue(switches.swr, 11, state); break;
            case 'swr1': switches.swr = this.setBitValue(switches.swr, 10, state); break;
            case 'swr2': switches.swr = this.setBitValue(switches.swr, 9, state); break;
            case 'swr3': switches.swr = this.setBitValue(switches.swr, 8, state); break;
            case 'swr4': switches.swr = this.setBitValue(switches.swr, 7, state); break;
            case 'swr5': switches.swr = this.setBitValue(switches.swr, 6, state); break;
            case 'swr6': switches.swr = this.setBitValue(switches.swr, 5, state); break;
            case 'swr7': switches.swr = this.setBitValue(switches.swr, 4, state); break;
            case 'swr8': switches.swr = this.setBitValue(switches.swr, 3, state); break;
            case 'swr9': switches.swr = this.setBitValue(switches.swr, 2, state); break;
            case 'swr10': switches.swr = this.setBitValue(switches.swr, 1, state); break;
            case 'swr11': switches.swr = this.setBitValue(switches.swr, 0, state); break;
            case 'start': switches.start = (state ? 1 : 0); break;
            case 'load': switches.load = (state ? 1 : 0); break;
            case 'dep': switches.dep = (state ? 1 : 0); break;
            case 'exam': switches.exam = (state ? 1 : 0); break;
            case 'cont': switches.cont = (state ? 1 : 0); break;
            case 'stop': switches.stop = (state ? 1 : 0); break;
            case 'sing_step': switches.singStep = (state ? 1 : 0); break;
            case 'sing_inst': switches.singInst = (state ? 1 : 0); break;
        }
        this.cons.writeSwitches(switches);
    }

    private setBitValue(input: number, pos: number, val: boolean): number {
        let cleared = input & ~(1 << pos);
        let bitVal = val ? 1 : 0;
        return (cleared | (bitVal << pos));
    }

    public setOnPunch(callback: (data: number) => Promise<void>) {
        this.asr33.setOnPunch(callback);
    }

    private async *readerGenerator(buf: ArrayBuffer): AsyncGenerator<number> {
        let view = new Uint8Array(buf);
        let i = 0;
        for (let num of view) {
            yield num;
            console.log(`Tape position ${++i} / ${view.byteLength} -> ${num}`);
        }
    }

    public setTapeInput(data: ArrayBuffer) {
        this.asr33.setReaderGenerator(this.readerGenerator(data));
    }

    public setHighTapeInput(data: ArrayBuffer) {
        this.pr8.setReaderGenerator(this.readerGenerator(data));
    }

    public async run(): Promise<void> {
        await this.io.runDeviceLoop();
    }
}
