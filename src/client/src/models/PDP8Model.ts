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

import * as io from 'socket.io-client';

import { FrontPanelState } from './FrontPanelState';
import { observable, action, computed } from 'mobx';
import { ASR33Model } from './peripherals/ASR33Model';
import { PeripheralModel } from './peripherals/PeripheralModel';
import { PC04Model } from './peripherals/PC04Model';
import { TC08Model } from './peripherals/TC08Model';
import { CoreMemoryModel } from './CoreMemoryModel';
import { RF08Model } from './peripherals/RF08Model';
import { DF32Model } from './peripherals/DF32Model';
import { RK8Model } from './peripherals/RK8Model';
import { KW8IModel } from './peripherals/KW8IModel';
import { MachineState, DeviceID } from './MachineState';

export class PDP8Model {
    private readonly BASE_URL = 'http://192.168.178.68:8000';

    private socket: SocketIOClient.Socket;

    private coreMemory: CoreMemoryModel;

    @observable
    private frontPanel?: FrontPanelState;

    @observable
    private peripheralModels: Map<number, PeripheralModel> = new Map();

    @observable
    private activeState: MachineState;

    constructor() {
        this.socket = io.connect(this.BASE_URL);
        this.coreMemory = new CoreMemoryModel(this.socket);
        this.activeState = new MachineState();

        this.socket.on('connect', async () => {
            await this.onConnected();
        });

        this.socket.on('disconnect', async() => {
            await this.onDisconnected();
        });

        this.socket.on('console-state', (state: FrontPanelState) => {
            this.onFrontPanelChange(state);
        });

        this.socket.on('peripheral-event', (data: any) => {
            const devId = data.devId as number;
            const action = data.action as string;
            this.onPeripheralEvent(devId, action, data);
        });
    }

    public get core() {
        return this.coreMemory;
    }

    public get currentState() {
        return this.activeState;
    }

    private async onConnected(): Promise<void> {
        const response = await fetch(this.BASE_URL + '/machine-states/active');
        const stateObj = await response.json();
        this.setMachineState(stateObj);
    }

    @action
    private async onDisconnected(): Promise<void> {
        this.frontPanel = undefined;
        this.peripheralModels.clear();
    }

    @action
    private onFrontPanelChange(newState: FrontPanelState): void {
        this.frontPanel = newState;
    }

    @action
    private setMachineState(stateObj: any) {
        const state = MachineState.fromJSONObject(stateObj);
        this.activeState = state;
        this.peripheralModels.clear();

        for (const id of state.peripherals) {
            let peripheral: PeripheralModel;

            switch (id) {
                case DeviceID.DEV_ID_ASR33:
                case DeviceID.DEV_ID_TT1:
                case DeviceID.DEV_ID_TT2:
                case DeviceID.DEV_ID_TT3:
                case DeviceID.DEV_ID_TT4:
                    peripheral = new ASR33Model(id, this.socket);
                    break;
                case DeviceID.DEV_ID_PC04:
                    peripheral = new PC04Model(id, this.socket);
                    break;
                case DeviceID.DEV_ID_TC08:
                    peripheral = new TC08Model(id, this.socket);
                    break;
                case DeviceID.DEV_ID_RF08:
                    peripheral = new RF08Model(id, this.socket);
                    break;
                case DeviceID.DEV_ID_DF32:
                    peripheral = new DF32Model(id, this.socket);
                    break;
                case DeviceID.DEV_ID_RK8:
                    peripheral = new RK8Model(id, this.socket);
                    break;
                case DeviceID.DEV_ID_KW8I:
                    peripheral = new KW8IModel(id, this.socket);
                    break;
                default:
                    continue;
            }

            this.peripheralModels.set(id, peripheral);
        }
    }

    private onPeripheralEvent(devId: number, action: string, data: any) {
        const peripheral = this.peripheralModels.get(devId);
        if (!peripheral) {
            return;
        }

        peripheral.onPeripheralAction(action, data);
    }

    public async fetchStateList(): Promise<MachineState[]> {
        const res: MachineState[] = [];

        const response = await fetch(this.BASE_URL + '/machine-states');
        const listObj = await response.json();
        for (const obj of listObj) {
            const state = MachineState.fromJSONObject(obj);
            res.push(state);
        }

        return res;
    }

    public async saveCurrentState() {
        this.socket.emit('state', {'action': 'save'});
    }

    @computed
    public get panel(): FrontPanelState {
        if (!this.frontPanel) {
            throw Error("Panel state not loaded");
        }

        return this.frontPanel;
    }

    @computed
    public get peripherals(): PeripheralModel[] {
        let res: PeripheralModel[] = [];
        this.peripheralModels.forEach(entry => {
            res.push(entry);
        })
        return res;
    }

    @computed
    public get ready(): boolean {
        if (!this.frontPanel) {
            return false;
        }

        return true;
    }

    public async setPanelSwitch(sw: string, state: boolean): Promise<void> {
        this.socket.emit('console-switch', {'switch': sw, 'state': state});
    }

    public async createNewState(state: MachineState) {
        const location = this.BASE_URL + '/machine-states';
        const settings: RequestInit = {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.toJSONObject())
        }

        const response = await fetch(location, settings);
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }
    }
}
