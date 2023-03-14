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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { ConsoleState } from "../types/ConsoleTypes";
import { DeviceID } from "../types/PeripheralTypes";
import { SystemConfiguration } from "../types/SystemConfiguration";
import { Backend } from "./backends/Backend";
import { BackendListener } from "./backends/BackendListener";
import { DF32Model } from "./peripherals/DF32Model";
import { KW8IModel } from "./peripherals/KW8IModel";
import { PC04Model } from "./peripherals/PC04Model";
import { PeripheralModel } from "./peripherals/PeripheralModel";
import { PT08Model } from "./peripherals/PT08Model";
import { RF08Model } from "./peripherals/RF08Model";
import { RK8Model } from "./peripherals/RK8Model";
import { TC08Model } from "./peripherals/TC08Model";

interface SoCDP8Store {
    frontPanel?: ConsoleState;
    activeSystem?: SystemConfiguration;
    peripheralModels: Map<DeviceID, PeripheralModel>;
    simSpeed: number;
    systemList: SystemConfiguration[];

    clearPeripherals: () => void;
    setFrontPanel: (state?: ConsoleState) => void;
    setPeripheral: (id: DeviceID, model: PeripheralModel) => void;
    setActiveSystem: (sys: SystemConfiguration) => void;
    setSimSpeed: (speed: number) => void;
    setSystemList: (list: SystemConfiguration[]) => void;
}

export class SoCDP8 {
    private backend: Backend;

    private store = create<SoCDP8Store>()(immer(devtools(set => ({
        peripheralModels: new Map(),
        simSpeed: 1.0,
        systemList: [],

        clearPeripherals: () => set(draft => {
            draft.frontPanel = undefined;
            draft.peripheralModels.clear();
        }),
        setPeripheral: (id: DeviceID, model: PeripheralModel) => set(draft => {
            draft.peripheralModels.set(id, model);
        }),
        setFrontPanel: (state?: ConsoleState) => set(draft => {
            draft.frontPanel = state;
        }),
        setActiveSystem: (sys: SystemConfiguration) => set(draft => {
            draft.activeSystem = sys;
        }),
        setSimSpeed: (speed: number) => set(draft => {
            draft.simSpeed = speed;
        }),
        setSystemList: (list: SystemConfiguration[]) => set(draft => {
            draft.systemList = list;
        }),
    }))));

    constructor(backend: Backend) {
        this.backend = backend;

        const listener: BackendListener = {
            onConnect: () => {
                this.readActiveState();
                this.fetchStateList();
            },

            onDisconnect: () => {
                this.onDisconnected();
            },

            onConsoleState: (state: ConsoleState) => {
                this.onFrontPanelChange(state);
            },

            onPeripheralEvent: (data: any) => {
                const id = data.id as number;
                const action = data.action as string;
                this.onPeripheralEvent(id, action, data);
            },

            onStateChange: (data: any) => {
                this.onStateEvent(data);
            },

            onPerformanceReport: (simSpeed: number) => {
                this.store.getState().setSimSpeed(simSpeed);
            },
        };
        backend.connect(listener);
    }

    private async readActiveState(): Promise<void> {
        const sys = await this.backend.readActiveSystem();
        this.onActiveSystemChanged(sys);
    }

    private async fetchStateList(): Promise<void> {
        const list = await this.backend.readSystems();
        this.store.getState().setSystemList(list);
    }

    public onDisconnected(): void {
        this.store.getState().setFrontPanel(undefined);
        this.store.getState().clearPeripherals();
    }

    public onFrontPanelChange(newState: ConsoleState): void {
        this.store.getState().setFrontPanel(newState);
    }

    public get useStore() {
        return this.store;
    }

    public onActiveSystemChanged(sys: SystemConfiguration) {
        this.store.getState().setActiveSystem(sys);
        this.store.getState().clearPeripherals();

        for (const conf of sys.peripherals) {
            let peripheral: PeripheralModel;

            switch (conf.id) {
                case DeviceID.DEV_ID_PT08:
                case DeviceID.DEV_ID_TT1:
                case DeviceID.DEV_ID_TT2:
                case DeviceID.DEV_ID_TT3:
                case DeviceID.DEV_ID_TT4:
                    peripheral = new PT08Model(this.backend, conf);
                    break;
                case DeviceID.DEV_ID_PC04:
                    peripheral = new PC04Model(this.backend, conf);
                    break;
                case DeviceID.DEV_ID_TC08:
                    peripheral = new TC08Model(this.backend, conf);
                    break;
                case DeviceID.DEV_ID_RF08:
                    peripheral = new RF08Model(this.backend, conf);
                    break;
                case DeviceID.DEV_ID_DF32:
                    peripheral = new DF32Model(this.backend, conf);
                    break;
                case DeviceID.DEV_ID_RK8:
                    peripheral = new RK8Model(this.backend, conf);
                    break;
                case DeviceID.DEV_ID_KW8I:
                    peripheral = new KW8IModel(this.backend, conf);
                    break;
            }

            this.store.getState().setPeripheral(conf.id, peripheral);
        }
    }

    private onPeripheralEvent(id: number, action: string, data: any) {
        const peripheral = this.store.getState().peripheralModels.get(id);
        if (!peripheral) {
            return;
        }

        peripheral.onPeripheralAction(action, data);
    }

    public async saveCurrentState() {
        const res = await this.backend.saveActiveSystem();
        if (!res) {
            throw Error("Couldn't save system state");
        }
    }

    public async setPanelSwitch(sw: string, state: boolean): Promise<void> {
        await this.backend.setPanelSwitch(sw, state);
    }

    public async createNewSystem(state: SystemConfiguration): Promise<void> {
        return await this.backend.createSystem(state);
    }

    public async activateSystem(id: string): Promise<void> {
        await this.backend.setActiveSystem(id);
    }

    public async deleteSystem(id: string): Promise<void> {
        await this.backend.deleteSystem(id);
    }

    public async clearCore(): Promise<void> {
        await this.backend.clearCore();
    }

    public async writeCore(addr: number, fragment: number[]): Promise<void> {
        await this.backend.writeCore(addr, fragment);
    }

    private onStateEvent(data: any) {
        switch (data.action) {
            case "active-state-changed":
                this.readActiveState();
                break;
            case "state-list-changed":
                this.fetchStateList();
                break;
        }
    }
}
