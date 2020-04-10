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
import { DeviceID, Peripheral } from '../drivers/IO/Peripheral';
import { promises } from 'fs';
import { LampBrightness } from '../drivers/Console/LampBrightness';
import { PeripheralList, CPUExtensions } from './PeripheralList';
import { MachineStateList } from './MachineStateList';
import { MachineState } from './MachineState';
import { TC08 } from '../peripherals/TC08';
import { ASR33 } from '../peripherals/ASR33';
import { PC04 } from '../peripherals/PC04';
import { RF08 } from '../peripherals/RF08';
import { DF32 } from '../peripherals/DF32';
import { KW8I } from '../peripherals/KW8I';
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

    private stateList: MachineStateList;
    private currentState: MachineState;

    public constructor(private readonly dataDir: string, private ioListener: IOListener) {
        const uio = new UIOMapper();
        const memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        const consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        const ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');

        this.cons = new Console(consBuf);
        this.mem = new CoreMemory(memBuf);
        this.io = new IOController(ioBuf, this.ioListener);

        this.stateList = new MachineStateList(this.dataDir);
        this.currentState = this.stateList.getStateByName('default');
    }

    public async saveState() {
        const dir = this.currentState.directory;

        console.log('Saving state to ' + dir);

        try {
            // Save config
            await this.currentState.save(dir);

            // Save core memory
            const memory = this.mem.dumpCore();
            await promises.writeFile(dir + '/core.dat', memory);

            // Save all peripherals
            for (const peripheral of this.io.getRegisteredDevices()) {
                await peripheral.saveState();
            }
        } catch (e) {
            console.warn('Error saving state: ' + e);
        }

        console.log('State saved');
    }

    public async activateState(stateName: string) {
        const state = this.stateList.getStateByName(stateName);

        // Restore config
        this.io.configureExtensions({
            eae: state.eaePresent,
            kt8i: state.kt8iPresent,
            maxMemField: state.maxMemField
        });

        // Restore peripherals
        this.io.clearDeviceTable();
        for (const id of state.peripherals) {
            const peripheral = this.createPeripheral(state.directory, id);
            this.io.registerPeripheral(peripheral);
        }

        // Restore core memory
        try {
            const core = await promises.readFile(state.directory + '/core.dat');
            this.mem.loadCore(new Uint16Array(core.buffer));
        } catch (e) {
            console.warn('Core memory not loaded: ' + e);
        }

        this.currentState = state;
    }

    private createPeripheral(dir: string, id: DeviceID): Peripheral {
        switch (id) {
            case DeviceID.DEV_ID_ASR33:
            case DeviceID.DEV_ID_TT1:
            case DeviceID.DEV_ID_TT2:
            case DeviceID.DEV_ID_TT3:
            case DeviceID.DEV_ID_TT4:
                return new ASR33(id);
            case DeviceID.DEV_ID_PC04:
                return new PC04();
            case DeviceID.DEV_ID_TC08:
                return new TC08();
            case DeviceID.DEV_ID_DF32:
                return new DF32(dir);
            case DeviceID.DEV_ID_RF08:
                return new RF08(dir);
            case DeviceID.DEV_ID_RK8:
                return new RK8(dir);
            case DeviceID.DEV_ID_KW8I:
                return new KW8I();
            default:
                throw new Error('No implementation for device ID ' + id);
        }
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
}
