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

import { observable, action, computed, makeObservable } from "mobx";
import { PT08Model } from "./peripherals/PT08Model";
import { PeripheralModel } from "./peripherals/PeripheralModel";
import { PC04Model } from "./peripherals/PC04Model";
import { TC08Model } from "./peripherals/TC08Model";
import { RF08Model } from "./peripherals/RF08Model";
import { DF32Model } from "./peripherals/DF32Model";
import { RK8Model } from "./peripherals/RK8Model";
import { KW8IModel } from "./peripherals/KW8IModel";
import { SystemConfiguration } from "../types/SystemConfiguration";
import { ConsoleState } from "../types/ConsoleTypes";
import { DeviceID } from "../types/PeripheralTypes";
import { BackendListener } from "./backends/BackendListener";
import { Backend } from "./backends/Backend";

export class SoCDP8 {
    private frontPanel?: ConsoleState;
    private peripheralModels = new Map<DeviceID, PeripheralModel>();
    private activeSystem_: SystemConfiguration | undefined;
    private systemList: SystemConfiguration[] = [];
    private backend: Backend;
    private simSpeed = 1.0;

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
                this.setSimSpeed(simSpeed);
            },
        };
        backend.connect(listener);

        makeObservable<SoCDP8, "simSpeed" | "setSimSpeed" | "frontPanel" | "peripheralModels" | "activeSystem_" | "systemList">(this, {
            frontPanel: observable,
            peripheralModels: observable,
            activeSystem_: observable,
            systemList: observable,
            simSpeed: observable,

            onDisconnected: action,
            setSimSpeed: action,
            onFrontPanelChange: action,
            onActiveSystemChanged: action,
            onSystemListChanged: action,

            systems: computed,
            panel: computed,
            peripherals: computed,
            ready: computed,
            speed: computed,
        });
    }

    public get activeSystem(): SystemConfiguration {
        if (!this.activeSystem_) {
            throw Error("No active system");
        }

        return this.activeSystem_;
    }

    private setSimSpeed(speed: number) {
        this.simSpeed = speed;
    }

    private async readActiveState(): Promise<void> {
        const sys = await this.backend.readActiveSystem();
        this.onActiveSystemChanged(sys);
    }

    private async fetchStateList(): Promise<void> {
        const list = await this.backend.readSystems();
        this.onSystemListChanged(list);
    }

    public onDisconnected(): void {
        this.frontPanel = undefined;
        this.peripheralModels.clear();
    }

    public onFrontPanelChange(newState: ConsoleState): void {
        this.frontPanel = newState;
    }

    public onActiveSystemChanged(sys: SystemConfiguration) {
        this.activeSystem_ = sys;
        this.peripheralModels.clear();

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

            this.peripheralModels.set(conf.id, peripheral);
        }
    }

    public onSystemListChanged(list: SystemConfiguration[]) {
        this.systemList = list;
    }

    private onPeripheralEvent(id: number, action: string, data: any) {
        const peripheral = this.peripheralModels.get(id);
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

    public get systems(): SystemConfiguration[] {
        return this.systemList;
    }

    public get panel(): ConsoleState {
        if (!this.frontPanel) {
            throw Error("Panel state not loaded");
        }

        return this.frontPanel;
    }

    public get speed(): number {
        return this.simSpeed;
    }

    public get peripherals(): PeripheralModel[] {
        const res: PeripheralModel[] = [];
        this.peripheralModels.forEach(entry => {
            res.push(entry);
        })
        return res;
    }

    public getPeripheralById(id: number): PeripheralModel {
        const res = this.peripheralModels.get(id);
        if (!res) {
            throw Error("Unknown peripheral id");
        }
        return res;
    }

    public get ready(): boolean {
        if (!this.frontPanel || !this.activeSystem_) {
            return false;
        }

        return true;
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
