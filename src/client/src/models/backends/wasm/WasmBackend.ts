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

import { DeviceID, PeripheralConfiguration } from "../../../types/PeripheralTypes";
import { SystemConfiguration } from "../../../types/SystemConfiguration";
import { TapeState } from "../../DECTape";
import { Backend } from "../Backend";
import { BackendListener } from "../BackendListener";
import { PeripheralOutAction } from "../../../types/PeripheralAction";
import { Wasm8Context } from "./Wasm8Context";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { generateUUID } from "../../../util";

interface BackendStore {
    activeSystem?: SystemConfiguration;
    systems: SystemConfiguration[];

    setActiveSystem: (sys: SystemConfiguration) => void;
    addSystem: (sys: SystemConfiguration) => void;
    deleteSystem: (id: string) => void;
}

export class WasmBackend implements Backend {
    private listener?: BackendListener;
    private pdp8: Wasm8Context;
    private controlThrottle = true;
    private throttle = 0;

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
        this.store.getState().addSystem({
            id: "default",
            name: "TSS/8",
            description: "default",
            maxMemField: 7,
            cpuExtensions: {
                eae: true,
                kt8i: true,
                bsw: false,
            },
            peripherals: [
                {
                    id: DeviceID.DEV_ID_PT08,
                    eightBit: false,
                    autoCaps: true,
                    baudRate: 1200,
                },
                {
                    id: DeviceID.DEV_ID_PC04,
                    baudRate: 1200,
                },
                {
                    id: DeviceID.DEV_ID_TC08,
                    numTapes: 2,
                },
                {
                    id: DeviceID.DEV_ID_TT1,
                    baudRate: 1200,
                    eightBit: false,
                    autoCaps: true,
                },
                {
                    id: DeviceID.DEV_ID_TT2,
                    baudRate: 1200,
                    eightBit: false,
                    autoCaps: true,
                },
                {
                    id: DeviceID.DEV_ID_TT3,
                    baudRate: 1200,
                    eightBit: false,
                    autoCaps: true,
                },
                {
                    id: DeviceID.DEV_ID_TT4,
                    baudRate: 1200,
                    eightBit: false,
                    autoCaps: true,
                },
                {
                    id: DeviceID.DEV_ID_RF08,
                },
                {
                    id: DeviceID.DEV_ID_KW8I,
                    useExternalClock: true,
                    use50Hz: false,
                },
            ],
        });
    }

    public async connect(listener: BackendListener) {
        this.listener = listener;

        await this.pdp8.create((dev, action, p1, p2) => void this.onPeripheralAction(dev, action, p1, p2));
        await this.setActiveSystem("default");

        this.listener.onConnect();

        const updateConsole = () => {
            listener.onConsoleState(this.pdp8.getConsoleState());
            setTimeout(updateConsole, 15);
        }
        updateConsole();
    }

    public async readActiveSystem(): Promise<SystemConfiguration> {
        const sys = this.store.getState().activeSystem;
        if (!sys) {
            throw Error("No active system");
        }
        return sys;
    }

    public async readSystems(): Promise<SystemConfiguration[]> {
        return this.store.getState().systems;
    }

    public async createSystem(system: SystemConfiguration) {
        system.id = generateUUID();
        this.store.getState().addSystem(system);
        this.listener?.onStateChange({type: "state-list-changed"});
    }

    public async deleteSystem(id: string) {
        const activeSys = this.store.getState().activeSystem;
        if (activeSys?.id == id) {
            throw Error("Can't delete active system");
        }

        this.store.getState().deleteSystem(id);
        this.listener?.onStateChange({type: "state-list-changed"});
    }

    public async saveActiveSystem(): Promise<boolean> {
        return true;
    }

    public async setActiveSystem(id: string) {
        const sys = this.store.getState().systems.find(s => s.id == id);
        if (!sys) {
            throw Error(`Unknown system ${id}`);
        }

        this.pdp8.clearPeripherals();
        this.pdp8.clearCore();
        this.pdp8.configureCPU(sys.maxMemField, sys.cpuExtensions.eae, sys.cpuExtensions.kt8i, sys.cpuExtensions.bsw);

        for (const peripheral of sys.peripherals) {
            this.pdp8.addPeripheral(peripheral.id);
            await this.changePeripheralConfig(peripheral.id, peripheral);
        }
        this.store.getState().setActiveSystem(sys);
        this.listener?.onStateChange({type: "active-state-changed"});
    }

    public async setThrottleControl(control: boolean) {
        this.controlThrottle = control;
        if (!control) {
            this.throttle = 0;
            this.pdp8.setThrottle(0);
        }
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
        if (
            id == DeviceID.DEV_ID_PT08 ||
            id == DeviceID.DEV_ID_TT1 ||
            id == DeviceID.DEV_ID_TT2 ||
            id == DeviceID.DEV_ID_TT3 ||
            id == DeviceID.DEV_ID_TT4
        ) {
            if (action.type == "key-press") {
                this.pdp8.sendPeripheralAction(id, 3, action.key, 0);
            } else if (action.type == "reader-tape-set") {
                this.pdp8.sendPeripheralActionBuffer(id, 4, action.tapeData);
            } else if (action.type == "reader-set-active") {
                this.pdp8.sendPeripheralAction(id, 5, action.active ? 1 : 0, 0);
            }
        } else if (id == DeviceID.DEV_ID_PC04) {
            if (action.type == "reader-tape-set") {
                this.pdp8.sendPeripheralActionBuffer(DeviceID.DEV_ID_PC04, 4, action.tapeData);
            } else if (action.type == "reader-set-active") {
                this.pdp8.sendPeripheralAction(DeviceID.DEV_ID_PC04, 5, action.active ? 1 : 0, 0);
            }
        } else if (id == DeviceID.DEV_ID_TC08) {
            if (action.type == "load-tape") {
                this.pdp8.sendPeripheralActionBuffer(DeviceID.DEV_ID_TC08, 1 + action.unit, action.data);
            } else if (action.type == "get-tape") {
                this.pdp8.sendPeripheralAction(DeviceID.DEV_ID_TC08, 11, action.unit, 0);
            }
        } else if (id == DeviceID.DEV_ID_CPU) {
            if (action.type == "load-core") {
                this.pdp8.sendPeripheralActionBuffer(DeviceID.DEV_ID_CPU, 5, action.data);
            } else if (action.type == "get-core") {
                this.pdp8.sendPeripheralAction(DeviceID.DEV_ID_CPU, 6, 0, 0);
            }
        } else if (id == DeviceID.DEV_ID_RF08) {
            if (action.type == "load-core") {
                this.pdp8.sendPeripheralActionBuffer(DeviceID.DEV_ID_RF08, 1, action.data);
            } else if (action.type == "get-core") {
                this.pdp8.sendPeripheralAction(DeviceID.DEV_ID_RF08, 2, 0, 0);
            }
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
                    if (this.controlThrottle) {
                        this.doThrottleControl(simSpeed);
                    }
                    this.listener.onPerformanceReport(simSpeed);
                } else if (action == 6) {
                    const dump = this.pdp8.fetchBuffer(p1, p2);
                    this.listener.onPeripheralEvent(DeviceID.DEV_ID_CPU, {type: "core-dump", dump});
                }
                break;
            case DeviceID.DEV_ID_RF08:
                if (action == 2) {
                    const dump = this.pdp8.fetchBuffer(p1, p2);
                    this.listener.onPeripheralEvent(DeviceID.DEV_ID_RF08, {type: "core-dump", dump});
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
                if (action == 10) {
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
                        this.listener.onPeripheralEvent(DeviceID.DEV_ID_TC08, {
                            type: "tapeStates",
                            states: this.tapeStatus,
                        });
                    }
                } else if (action == 11) {
                    const dump = this.pdp8.fetchBuffer(p1, p2);
                    this.listener.onPeripheralEvent(DeviceID.DEV_ID_TC08, {type: "core-dump", dump});
                }
                break;
        }
    }

    private doThrottleControl(simSpeed: number) {
        if (this.throttle == 0) {
            this.throttle = 5000;
            this.pdp8.setThrottle(this.throttle);
            // console.log(`throttle: start at ${this.throttle}`);
            return;
        }

        const delta = 1 - simSpeed;
        const abs = Math.abs(delta);
        let step;
        if (abs > 1) {
            step = 2500;
        } else if (abs > 0.1) {
            step = 1500;
        } else if (abs > 0.01) {
            step = 250;
        } else {
            step = 0;
        }
        const incr = step * Math.sign(delta);

        if (incr != 0) {
            this.throttle = Math.max(1, this.throttle + incr);
            this.pdp8.setThrottle(this.throttle);
            // console.log(`throttle: change by ${incr.toFixed(0)} to ${this.throttle}`);
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

    public async readPeripheralBlock(id: DeviceID, block: number): Promise<Uint16Array> {
        return Uint16Array.from([]);
    }
}
