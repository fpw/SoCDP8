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

import * as io from 'socket.io-client'
import { FrontPanelState } from './FrontPanelState';
import { observable, action, computed } from 'mobx'
import { PeripheralList, DeviceType } from './PeripheralList';
import { ASR33Model } from './peripherals/ASR33Model';
import { PeripheralModel } from './peripherals/PeripheralModel';
import { PR8Model } from './peripherals/PR8Model';
import { TC08Model } from './peripherals/TC08Model';

export class PDP8Model {
    private readonly BASE_URL = '';

    private socket: SocketIOClient.Socket;

    @observable
    private frontPanel?: FrontPanelState;

    @observable
    private peripheralModels: Map<number, PeripheralModel> = new Map();

    constructor() {
        this.socket = io.connect(this.BASE_URL);

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

    private async onConnected(): Promise<void> {
        const response = await fetch(this.BASE_URL + '/peripherals');
        const list = await response.json() as PeripheralList;
        this.setPeripherals(list);
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
    private setPeripherals(list: PeripheralList) {
        for (const entry of list.devices) {
            let peripheral: PeripheralModel;

            switch (entry.type) {
                case DeviceType.ASR33:
                    peripheral = new ASR33Model(entry.id, this.socket);
                    break;
                case DeviceType.PR8:
                    peripheral = new PR8Model(entry.id, this.socket);
                    break;
                case DeviceType.TC08:
                    peripheral = new TC08Model(entry.id, this.socket);
                    break;
                default:
                    continue;
            }

            this.peripheralModels.set(entry.id, peripheral);
        }
    }

    private onPeripheralEvent(devId: number, action: string, data: any) {
        const peripheral = this.peripheralModels.get(devId);
        if (!peripheral) {
            return;
        }

        peripheral.onPeripheralAction(action, data);
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
}
