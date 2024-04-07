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

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { PeripheralOutAction } from "../../../types/PeripheralAction";
import { DeviceID, PeripheralConfiguration } from "../../../types/PeripheralTypes";
import { getDefaultSysConf, SystemConfiguration } from "../../../types/SystemConfiguration";
import { downloadData, generateUUID } from "../../../util";
import { TapeState } from "../../DECTape";
import { Backend } from "../Backend";
import { BackendListener } from "../BackendListener";
import { ThrottleController } from "./ThrottleController";
import { Wasm8Context } from "./Wasm8Context";

interface BackendStore {
    activeSystem?: SystemConfiguration;
    systems: SystemConfiguration[];

    setActiveSystem: (sys: SystemConfiguration) => void;
    addSystem: (sys: SystemConfiguration) => void;
    deleteSystem: (id: string) => void;
}

export class Wasm8Backend implements Backend {
    private listener?: BackendListener;
    private pdp8: Wasm8Context;
    private throttler?: ThrottleController;
    private dumpAcceptor?: (dump: Uint8Array) => void;

    private store = create<BackendStore>()(immer(set => ({
        systems: [],

        setActiveSystem: (sys: SystemConfiguration) => set(draft => {
            draft.activeSystem = sys;
        }),
        addSystem: (sys: SystemConfiguration) => set(draft => {
            draft.systems.push(sys);
        }),
        deleteSystem: (id: string) => set(draft => {
            const sys = draft.systems.findIndex(s => s.id == id);
            if (sys < 0) {
                return;
            }

            draft.systems.splice(sys, 1);
        }),
    })));

    public constructor() {
        this.pdp8 = new Wasm8Context();
    }

    public async connect(listener: BackendListener) {
        this.listener = listener;

        await this.pdp8.create((dev, action, p1, p2) => void this.onPeripheralAction(dev, action, p1, p2));
        await this.loadSystems();
        const defaultSys = this.store.getState().systems[0];
        if (defaultSys) {
            await this.setActiveSystem(defaultSys.id);
        }
        await this.listener.onConnect();

        this.throttler = new ThrottleController(t => this.pdp8.setThrottle(t));
        this.throttler.setControl(false);

        const updateConsole = () => {
            const state = this.pdp8.getConsoleState();
            listener.onConsoleState(state);
            setTimeout(updateConsole, 15);
        };
        updateConsole();
    }

    private async loadSystems() {
        const root = await navigator.storage.getDirectory();
        const systemsDir = await root.getDirectoryHandle("systems", { create: true });
        for await (const [name, handle] of systemsDir) {
            if (handle.kind == "directory") {
                try {
                    const sysDir = await systemsDir.getDirectoryHandle(name);
                    const systemHandle = await sysDir.getFileHandle("system.json");
                    const systemFile = await systemHandle.getFile();
                    const systemJson = await systemFile.text();
                    const system = JSON.parse(systemJson) as SystemConfiguration;
                    this.store.getState().addSystem(system);
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(`Couldn't load system ${name}: ${e.message}`);
                    }
                }
            }
        }

        if (this.store.getState().systems.length == 0) {
            const system = getDefaultSysConf();
            await this.saveSystem(system);
            this.store.getState().addSystem(system);
        }
    }

    public async createSystem(system: SystemConfiguration) {
        system.id = generateUUID();
        await this.saveSystem(system);
        this.store.getState().addSystem(system);
        this.listener?.onStateChange({ type: "state-list-changed" });
    }

    private async saveSystem(system: SystemConfiguration) {
        const sysDir = await this.getSystemDirectory(system);
        const systemFile = await sysDir.getFileHandle("system.json", { create: true });
        const writable = await systemFile.createWritable();
        await writable.write(JSON.stringify(system));
        await writable.close();
    }

    public async deleteSystem(id: string) {
        const activeSys = this.store.getState().activeSystem;
        if (activeSys?.id == id) {
            throw Error("Can't delete active system");
        }

        const root = await navigator.storage.getDirectory();
        const systemsDir = await root.getDirectoryHandle("systems");
        await systemsDir.removeEntry(id, { recursive: true });

        this.store.getState().deleteSystem(id);
        this.listener?.onStateChange({ type: "state-list-changed" });
    }

    public async saveActiveSystem(): Promise<boolean> {
        const sys = this.store.getState().activeSystem;
        if (!sys) {
            throw Error("No active system");
        }

        const sysDir = await this.getSystemDirectory(sys);
        const dumpPromise = new Promise<Uint8Array>((resolve, _reject) => {
            this.dumpAcceptor = resolve;
            void this.sendPeripheralAction(DeviceID.DEV_ID_CPU, { type: "download-disk", unit: 0 });
        });
        const coreDump = await dumpPromise;
        this.dumpAcceptor = undefined;

        await downloadData(coreDump, "core.dat");

        return true;
    }

    private async getSystemDirectory(system: SystemConfiguration): Promise<FileSystemDirectoryHandle> {
        const root = await navigator.storage.getDirectory();
        const systemsDir = await root.getDirectoryHandle("systems", { create: true });
        const sysDir = await systemsDir.getDirectoryHandle(system.id, { create: true });
        return sysDir;
    }

    public async readSystems(): Promise<SystemConfiguration[]> {
        return this.store.getState().systems;
    }

    public async readActiveSystem(): Promise<SystemConfiguration> {
        const sys = this.store.getState().activeSystem;
        if (!sys) {
            throw Error("No active system");
        }
        return sys;
    }

    public async setActiveSystem(id: string) {
        const sys = this.store.getState().systems.find(s => s.id == id);
        if (!sys) {
            throw Error(`Unknown system ${id}`);
        }

        this.pdp8.setSwitch("stop", true);
        this.pdp8.clearPeripherals();
        this.pdp8.clearCore();
        this.pdp8.configureCPU(
            sys.maxMemField,
            sys.cpuExtensions.eae,
            sys.cpuExtensions.kt8i,
            sys.cpuExtensions.bsw,
        );

        for (const peripheral of sys.peripherals) {
            this.pdp8.addPeripheral(peripheral.id);
            await this.changePeripheralConfig(peripheral.id, peripheral);
        }
        this.store.getState().setActiveSystem(sys);
        this.listener?.onStateChange({ type: "active-state-changed" });
    }

    public async setThrottleControl(control: boolean) {
        this.throttler?.setControl(control);
        this.pdp8.setThrottle(0);
    }

    public async setPanelSwitch(sw: string, state: boolean): Promise<void> {
        this.pdp8.setSwitch(sw, state);
    }

    public async clearCore() {
        this.pdp8.clearCore();
    }

    public async writeCore(addr: number, fragment: number[]) {
        for (let i = 0; i < fragment.length; i++) {
            this.pdp8.writeCore(addr + i, fragment[i]);
        }
    }

    public async sendPeripheralAction(id: DeviceID, action: PeripheralOutAction): Promise<void> {
        switch (id) {
            case DeviceID.DEV_ID_CPU:
                if (action.type == "upload-disk") {
                    this.pdp8.sendPeripheralActionBuffer(DeviceID.DEV_ID_CPU, 5, action.data);
                } else if (action.type == "download-disk") {
                    this.pdp8.sendPeripheralAction(DeviceID.DEV_ID_CPU, 6, 0, 0);
                }
                break;
            case DeviceID.DEV_ID_PT08:
            case DeviceID.DEV_ID_TT1:
            case DeviceID.DEV_ID_TT2:
            case DeviceID.DEV_ID_TT3:
            case DeviceID.DEV_ID_TT4:
                if (action.type == "key-press") {
                    this.pdp8.sendPeripheralAction(id, 3, action.key, 0);
                } else if (action.type == "reader-tape-set") {
                    this.pdp8.sendPeripheralActionBuffer(id, 4, action.tapeData);
                } else if (action.type == "reader-set-active") {
                    this.pdp8.sendPeripheralAction(id, 5, action.active ? 1 : 0, 0);
                }
                break;
            case DeviceID.DEV_ID_PC04:
                if (action.type == "reader-tape-set") {
                    this.pdp8.sendPeripheralActionBuffer(id, 4, action.tapeData);
                } else if (action.type == "reader-set-active") {
                    this.pdp8.sendPeripheralAction(id, 5, action.active ? 1 : 0, 0);
                }
                break;
            case DeviceID.DEV_ID_TC08:
            case DeviceID.DEV_ID_DF32:
            case DeviceID.DEV_ID_RF08:
            case DeviceID.DEV_ID_RK08:
            case DeviceID.DEV_ID_RK8E:
                if (action.type == "upload-disk") {
                    this.pdp8.sendPeripheralActionBuffer(id, 10 + action.unit, action.data);
                } else if (action.type == "download-disk") {
                    this.pdp8.sendPeripheralAction(id, 20 + action.unit, 0, 0);
                }
                break;
        }
    }

    private tapeStatus: TapeState[] = [];
    private async onPeripheralAction(dev: DeviceID, action: number, p1: number, p2: number) {
        if (!this.listener) {
            return;
        }

        switch (dev) {
            case DeviceID.DEV_ID_CPU:
                if (action == 4) {
                    const simSpeed = p1 / 100;
                    this.throttler?.onPerformanceReport(simSpeed);
                    this.listener.onPerformanceReport(simSpeed);
                } else if (action == 6) {
                    const dump = this.pdp8.fetchBuffer(p1, p2);
                    if (this.dumpAcceptor) {
                        this.dumpAcceptor(dump);
                    } else {
                        this.listener.onPeripheralEvent(DeviceID.DEV_ID_CPU, { type: "dump-data", dump });
                    }
                }
                break;
            case DeviceID.DEV_ID_DF32:
            case DeviceID.DEV_ID_RF08:
            case DeviceID.DEV_ID_RK08:
            case DeviceID.DEV_ID_RK8E:
                if (action >= 20 && action < 30) {
                    const dump = this.pdp8.fetchBuffer(p1, p2);
                    this.listener.onPeripheralEvent(dev, { type: "dump-data", dump });
                }
                break;
            case DeviceID.DEV_ID_PT08:
            case DeviceID.DEV_ID_TT1:
            case DeviceID.DEV_ID_TT2:
            case DeviceID.DEV_ID_TT3:
            case DeviceID.DEV_ID_TT4:
                if (action == 1) {
                    this.listener.onPeripheralEvent(dev, {
                        type: "readerPos",
                        pos: p1,
                    });
                } else if (action == 2) {
                    this.listener.onPeripheralEvent(dev, {
                        type: "punch",
                        char: p1,
                    });
                }
                break;
            case DeviceID.DEV_ID_PC04:
                if (action == 1) {
                    this.listener.onPeripheralEvent(DeviceID.DEV_ID_PC04, {
                        type: "readerPos",
                        pos: p1,
                    });
                } else if (action == 2) {
                    this.listener.onPeripheralEvent(DeviceID.DEV_ID_PC04, {
                        type: "punch",
                        char: p1,
                    });
                }
                break;
            case DeviceID.DEV_ID_TC08:
                if (action == 1) {
                    const status = p2;
                    this.tapeStatus[p1] = {
                        address: p1,
                        loaded: (status & 1) != 0,
                        selected: (status & 2) != 0,
                        moving: (status & 4) != 0,
                        reverse: (status & 8) != 0,
                        writing: (status & 16) != 0,
                        normalizedPosition: ((status & 0xFFFF0000) >> 16) / 1000,
                    };
                    if (p1 == 7) {
                        this.listener.onPeripheralEvent(dev, {
                            type: "tapeStates",
                            states: this.tapeStatus,
                        });
                    }
                } else if (action >= 20 && action < 30) {
                    const dump = this.pdp8.fetchBuffer(p1, p2);
                    this.listener.onPeripheralEvent(dev, { type: "dump-data", dump });
                }
                break;
        }
    }

    public async changePeripheralConfig(id: DeviceID, config: PeripheralConfiguration): Promise<void> {
        switch (config.id) {
            case DeviceID.DEV_ID_PT08:
            case DeviceID.DEV_ID_TT1:
            case DeviceID.DEV_ID_TT2:
            case DeviceID.DEV_ID_TT3:
            case DeviceID.DEV_ID_TT4:
                this.pdp8.sendPeripheralAction(id, 6, config.baudRate, 0);
                break;
            case DeviceID.DEV_ID_PC04:
                this.pdp8.sendPeripheralAction(id, 6, config.baudRate, 0);
                break;
            case DeviceID.DEV_ID_KW8I:
                this.pdp8.sendPeripheralAction(id, 1, (+config.use50Hz << 1) | +config.useExternalClock, 0);
                break;
        }
    }
}
