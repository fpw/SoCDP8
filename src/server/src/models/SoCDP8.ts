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
import { PeripheralList, CPUExtensions } from './PeripheralList';
import { ASR33 } from '../peripherals/ASR33';
import { PC04 } from '../peripherals/PC04';
import { RF08 } from '../peripherals/RF08';
import { DeviceID } from '../drivers/IO/Peripheral';
import { DF32 } from '../peripherals/DF32';
import { KW8I } from '../peripherals/KW8I';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';
import { RK8 } from '../peripherals/RK8';

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

    public constructor(private ioListener: IOListener) {
        const uio = new UIOMapper();
        const memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        const consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        const ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');

        this.cons = new Console(consBuf);
        this.mem = new CoreMemory(memBuf);
        this.io = new IOController(ioBuf, this.ioListener);

        this.io.registerPeripheral(new ASR33(DeviceID.DEV_ID_ASR33));
        this.io.registerPeripheral(new PC04());
        this.io.registerPeripheral(new TC08());

        // this.io.registerPeripheral(new ASR33(DeviceID.DEV_ID_TT1));
        // this.io.registerPeripheral(new ASR33(DeviceID.DEV_ID_TT2));
        // this.io.registerPeripheral(new ASR33(DeviceID.DEV_ID_TT3));
        // this.io.registerPeripheral(new ASR33(DeviceID.DEV_ID_TT4));

        // this.io.registerPeripheral(new KW8I());

        // this.io.registerPeripheral(new DF32());
        this.io.registerPeripheral(new RF08());
        // this.io.registerPeripheral(new RK8());
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

    public getCPUExtensions(): CPUExtensions {
        return this.io.getExtensions();
    }

    public getPeripherals(): PeripheralList {
        const list: PeripheralList = {
            cpuExtensions: this.io.getExtensions(),
            maxDevices: this.io.getMaxDeviceCount(),
            devices: []
        };

        const peripherals = this.io.getRegisteredDevices();
        for (const perph of peripherals) {
            if (!perph) {
                continue;
            }

            const id = perph.getDeviceID();

            list.devices.push({
                id: id,
                typeString: DeviceID[id],
                connections: perph.getBusConnections(),
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

    public async loadState() {
        const fsRead = promisify(readFile);

        try {
            const data = await fsRead('core.dat');
            this.mem.loadCore(new Uint16Array(data.buffer));
        } catch (Error) {
            console.warn('Error loading state');
        }
    }

    public async saveState() {
        const memory = this.mem.dumpCore();
        const fsWrite = promisify(writeFile);
        try {
            await fsWrite('core.dat', memory);
        } catch (Error) {
            console.warn('Error saving state');
        }
    }
}
