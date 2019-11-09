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
import { PC04 } from '../peripherals/PC04';
import { RF08 } from '../peripherals/RF08';

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
    private pc04: PC04;
    private tc08: TC08;
    private rf08: RF08;

    public constructor(private ioListener: IOListener) {
        const uio = new UIOMapper();
        const memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        const consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        const ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');

        this.cons = new Console(consBuf);
        this.mem = new CoreMemory(memBuf);
        this.io = new IOController(ioBuf, this.ioListener);

        this.pc04 = new PC04(0o01);
        this.asr33 = new ASR33(0o03);
        this.tc08 = new TC08(0o76);
        this.rf08 = new RF08(0o60);

        this.io.registerPeripheral(this.asr33);
        this.io.registerPeripheral(this.pc04);
        this.io.registerPeripheral(this.tc08);
        this.io.registerPeripheral(this.rf08);
    }

    public clearCoreMemory() {
        this.mem.clear();
    }

    public writeCoreMemory(addr: number, fragment: number[]) {
        this.mem.writeData(addr, fragment);
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
