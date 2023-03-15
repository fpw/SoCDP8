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
import { PeripheralOutAction } from "../PeripheralAction";
import { Wasm8Context } from "./Wasm8Context";

export class WasmBackend implements Backend {
    private listener?: BackendListener;
    private pdp8: Wasm8Context;

    private systems: SystemConfiguration[] = [
        {
            id: "default",
            name: "default",
            description: "default",
            maxMemField: 7,
            cpuExtensions: {
                eae: true,
                kt8i: true,
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
            ],
        },
    ];

    public constructor() {
        this.pdp8 = new Wasm8Context();
    }

    public async connect(listener: BackendListener) {
        this.listener = listener;

        await this.pdp8.create((dev, action, p1, p2) => void this.onPeripheralAction(dev, action, p1, p2));

        await this.setActiveSystem("default");

        this.listener.onConnect();

        const updateConsole = () => {
            listener.onConsoleState(this.pdp8.getConsoleState());
            requestAnimationFrame(updateConsole);
        }
        updateConsole();
    }

    public async readActiveSystem(): Promise<SystemConfiguration> {
        return this.systems[0];
    }

    public async saveActiveSystem(): Promise<boolean> {
        return true;
    }

    public async readSystems(): Promise<SystemConfiguration[]> {
        return this.systems;
    }

    public async createSystem(system: SystemConfiguration) {
    }

    public async setActiveSystem(id: string) {
        for (const sys of this.systems) {
            if (sys.id == id) {
                this.pdp8.configure(sys.maxMemField, sys.cpuExtensions.eae, sys.cpuExtensions.kt8i, false);

                for (const peripheral of this.systems[0].peripherals) {
                    await this.changePeripheralConfig(peripheral.id, peripheral);
                }
                break;
            }
        }
    }

    public async deleteSystem(id: string) {
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
            }
        }
    }

    private tapeStatus: TapeState[] = [];
    private async onPeripheralAction(dev: DeviceID, action: number, p1: number, p2: number) {
        if (!this.listener) {
            return;
        }

        switch (dev) {
            case DeviceID.DEV_ID_NULL:
                if (action == 4) {
                    const simSpeed = p1 / 10;
                    this.listener.onPerformanceReport(simSpeed);
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
        }
    }

    public async readPeripheralBlock(id: DeviceID, block: number): Promise<Uint16Array> {
        return Uint16Array.from([]);
    }
}
