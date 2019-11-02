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

import { UIOMapper } from '../drivers/UIO/UIOMapper';
import { Console } from '../drivers/Console/Console';
import { SwitchState } from "../drivers/Console/SwitchState";
import { CoreMemory } from "../drivers/CoreMemory/CoreMemory";
import { IOController, IOListener } from '../drivers/IO/IOController';
import { TC08 } from '../peripherals/TC08';
import { LampBrightness } from '../drivers/Console/LampBrightness';
import { PeripheralList, BusConnection } from './PeripheralList';
import { DeviceType } from '../drivers/IO/Peripheral';
import { ASR33 } from '../peripherals/ASR33';
import { PR8 } from '../peripherals/PR8';

export interface ConsoleState {
    lamps: LampBrightness;
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
    private tc08: TC08;

    public constructor(private ioListener: IOListener) {
        const uio = new UIOMapper();
        const memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        const consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        const ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');

        this.cons = new Console(consBuf);
        this.mem = new CoreMemory(memBuf);
        this.io = new IOController(ioBuf, this.ioListener);

        this.pr8 = new PR8(0o01);
        this.asr33 = new ASR33(0o03);
        this.tc08 = new TC08(0o76);

        this.io.registerPeripheral(this.asr33);
        this.io.registerPeripheral(this.pr8);
        this.io.registerPeripheral(this.tc08);

        this.storeBlinker();
        this.storeRIMLoader();
        this.storeTC08Loader();
    }

    public storeBlinker(): void {
        // source: http://dustyoldcomputers.com/pdp8/pdp8i/testprogs/acmqblinker.html
        const program = [
            0o2012, // isz   delay  / create a delay
            0o5000, // jmp   loop
            0o7200, // cla          / clear AC so we can load it
            0o1013, // tad   value  / get value
            0o7421, // mql          / stash AC into MQ
            0o1013, // tad   value  / fetch value again
            0o7040, // cma          / complement AC
            0o2013, // isz   value  / get to next value
            0o7000, // nop          / ignore possible "skip" from ISZ
            0o5000, // jmp   loop   / and do it all again
            0o0000, // delay
            0o0000, // value
        ];
        this.mem.writeData(0, program);
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
    }

    public readConsoleState(): ConsoleState {
        return {
            lampOverride: this.cons.isLampOverridden(),
            lamps: this.cons.readBrightness(),

            switchOverride: this.cons.isSwitchOverridden(),
            switches: this.cons.readSwitches()
        }
    }

    public getPeripherals(): PeripheralList {
        const list: PeripheralList = {
            maxDevices: this.io.getMaxDeviceCount(),
            devices: []
        };

        const peripherals = this.io.getRegisteredDevices();
        for (const [idx, peripheral] of peripherals.entries()) {
            const type = peripheral.getType();

            if (type == DeviceType.NULL) {
                continue;
            }

            let connections: BusConnection[] = [];
            for (const [busId, subType] of peripheral.getBusConnections()) {
                connections.push({busId: busId, subType: subType});
            }

            list.devices.push({
                id: idx,
                type: type,
                typeString: DeviceType[type],
                connections: connections,
            });
        }

        return list;
    }

    public requestDeviceAction(devId: number, action: string, data: any) {
        this.io.requestDeviceAction(devId, action, data);
    }

    public setSwitch(sw: string, state: boolean): void {
        this.cons.setSwitchOverride(true);
        const switches = this.cons.readSwitches();
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
        const cleared = input & ~(1 << pos);
        const bitVal = val ? 1 : 0;
        return (cleared | (bitVal << pos));
    }

    public async checkDevices(): Promise<void> {
        await this.io.checkDevices();
    }
}
