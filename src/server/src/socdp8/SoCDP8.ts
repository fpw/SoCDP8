import { ASR33Reader } from './IO/Peripherals/ASR33Reader';
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
import { promisify } from 'util';
import { ASR33Writer } from './IO/Peripherals/ASR33Writer';
import { PR8Reader } from './IO/Peripherals/PR8Reader';
import { TC08 } from './IO/Peripherals/TC08';

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
    private asr33reader: ASR33Reader;
    private asr33writer: ASR33Writer;
    private pr8Reader: PR8Reader;
    private tc08: TC08;

    public constructor() {
        let uio = new UIOMapper();
        let memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        let consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        let ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');

        this.cons = new Console(consBuf);
        this.mem = new CoreMemory(memBuf);
        this.io = new IOController(ioBuf, this.mem, this.cons);

        this.pr8Reader = new PR8Reader(0o01);
        this.asr33reader = new ASR33Reader(0o03);
        this.asr33writer = new ASR33Writer(0o04);
        this.tc08 = new TC08(0o76);

        this.io.registerPeripheral(this.asr33reader);
        this.io.registerPeripheral(this.asr33writer);
        this.io.registerPeripheral(this.pr8Reader);
        this.io.registerPeripheral(this.tc08);

        this.mem.clear();
        this.storeRIMLoader();
        this.storeTC08Loader();
    }

    public storeRIMLoader(): void {
        const program = [
            0o6032, // KCC         / clear keyboard flag and ac
            0o6031, // KSF         / skip if keyboard flag
            0o5357, // JMP 7757    / jmp -1
            0o6036, // KRB         / clear ac, or AC with data (8 bit), clear flag
            0o7106, // CLL RTL     / clear link, rotate left 2
            0o7006, // RTL         / rotate left 2
            0o7510, // SPA         / skip if ac > 0
            0o5357, // JMP 7757    / jmp back
            0o7006, // RTL         / rotate left 2
            0o6031, // KSF         / skip if keyboard flag
            0o5367, // JMP 7767    / jmp -1
            0o6034, // KRS         / or AC with keyboard (8 bit)
            0o7420, // SNL         / skip if link
            0o3776, // DCA I 7776  / store ac in [7776], clear ac
            0o3376, // DCA 7776    / store ac in 7776, clear ac
            0o5356, // JMP 7756
            0o0000, // address
        ];
        this.mem.writeData(0o7756, program);
    }

    public storeTC08Loader(): void {
        const program = [
            0o6774, // 7613: DTLB        / set TC08 field to 0, clear AC
            0o1222, // 7614: TAD K0600   / set reverse and run
            0o6766, // 7615: DTCA!DTXA   / load status register A, clear AC
            0o6771, // 7616: DTSF        / wait until done
            0o5216, // 7617: JMP .-1
            0o1223, // 7620: TAD K0220   / set forward read
            0o5215, // 7621: JMP 7615    / execute - that loop will run until block loaded, but that won't happen before overwritten
            0o0600, // 7622: K0600
            0o0220, // 7623: K0220
        ];
        this.mem.writeData(0o7613, program);

        const dataBreak = [
            0o7577, // 7754: data break word count
            0o7577, // 7755: data break current addr
        ]
        this.mem.writeData(0o7754, dataBreak);

        /**
         * OS 8 bootloader writes:
         * 7600: 1236 TAD K0600
         * 7601: 6766 DTCA!DTXA     / Load status register A: stop and backward, clear AC
         * 7602: 6771 DTSF          / Wait until stopped
         * 7603: 5202 JMP .-1
         * 7604: 3231 DCA 7631
         * 7605: 3232 DCA 7632
         * 7606: 1237 TAD K0620
         * 7607: 5224 JMP 7624
         * 7610: 0000
         * 7611: 0137
         * 7612: 1355 TAD [7755]    / load CA
         * 7613: 1211 TAD K0137     / check if CA = 7640
         * 7614: 7650 SNA CLA       / if yes, clear AC and jump to 7620. If not, loop again.
         * 7615: 5220 JMP 7620
         * 7616: 7000 NOP           / ATTN PC will be here in bootstrap loop
         * 7617: 5212 JMP 7612      / ATTN or here
         * 
         * 7620: 1235 TAD K0010     / AC = 0010
         * 7621: 6774 DTLB          / set TC08 field to 1, clear AC
         * 7622: 6771 DTSF          / wait until block read finished
         * 7623: 5222 JMP .-1
         * 7624: 6764 DTXA          / read another block, clear AC
         * 7625: 6774 DTLB          / set TC08 memory field to 0, clear AC
         * 7626: 1234 TAD K7577     / AC = 7577
         * 7627: 3355 DCA 7755      / CA = 7577, AC = 0
         * 7630: 3354 DCA 7754      / WC = 0
         * 7631: 6213 CIF CDF 1     / change to data and inst field 1
         * 7632: 5242 JMP 7642
         * 7633: 5212 JMP 7612
         * 7634: 7577 K7577
         * 7635: 0010 K0010
         * 7636: 0600 K0600
         * 7637: 0620 K0620
         * 7640: 0000 K0000
         * 
         * 17642: 3344 DCA 17744    / Clear CA
         * 17643: 6771 DTSF         / Wait until block read finished, block 1 overwrites 7600..7777
         * 17644: 5243 JMP .-1
         * 17645: 6203 CDF CIF 0    / Back to data and inst field 0
         * 17646: 5205 JMP 7605
         */
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
        this.asr33writer.setOnPunch(callback);
    }

    public clearTapeInput() {
        this.asr33reader.clearReaderData();
    }

    public appendTapeInput(data: number[]) {
        this.asr33reader.appendReaderData(data);
    }

    public setHighTapeInput(data: number[]) {
        this.pr8Reader.clearReaderData();
        this.pr8Reader.appendReaderData(data);
    }

    public async run(): Promise<void> {
        const sleepMs = promisify(setTimeout);

        while (true) {
            await this.io.checkDevices();
            await sleepMs(1);
        }
    }
}
