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
import { Console, LEDState, SwitchState } from './Console/Console';
import { CoreMemory } from "./CoreMemory/CoreMemory";
import { IOController } from './IO/IOController';
import { ASR33 } from './IO/Peripherals/ASR33';

export interface ConsoleState {
    leds: LEDState;
    ledOverride: boolean;
    
    switches: SwitchState;
    switchOverride: boolean;
}

export class SoCDP8 {
    private cons: Console;
    private mem: CoreMemory;
    private io: IOController;

    public constructor() {
        let uio = new UIOMapper();
        let memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        let consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        let ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');

        this.cons = new Console(consBuf);
        this.mem = new CoreMemory(memBuf);
        this.io = new IOController(ioBuf);
    }

    public readCoreDump() {
        return this.mem.dumpCore();
    }

    public readConsoleState(): ConsoleState {
        let state: ConsoleState = {
            ledOverride: this.cons.isLEDOverridden(),
            leds: this.cons.readLEDs(),

            switchOverride: this.cons.isSwitchOverridden(),
            switches: this.cons.readSwitches()
        }

        return state;
    }

    public async run(): Promise<void> {
        let asr = new ASR33(this.io);
        await this.io.runDeviceLoop();
    }
}
