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
import { SystemConfiguration } from '../types/SystemConfiguration';
import { PeripheralType, peripheralConfToName } from '../types/PeripheralTypes';
import { ConsoleState } from '../types/ConsoleTypes';

export class SoCDP8 {
    private socket: SocketIOClient.Socket;

    private coreMemory: CoreMemoryModel;

    @observable
    private frontPanel?: ConsoleState;

    @observable
    private peripheralModels: Map<string, PeripheralModel> = new Map();

    @observable
    private activeSystem: SystemConfiguration | undefined;

    constructor() {
        let url = '';
        if (window.location.toString().includes('localhost')) {
            url = 'http://192.168.178.68:8000';
        }

        this.socket = io.connect(url);
        this.coreMemory = new CoreMemoryModel(this.socket);

        this.socket.on('connect', () => {
            this.readActiveState();
        });

        this.socket.on('disconnect', () => {
            this.onDisconnected();
        });

        this.socket.on('console-state', (state: ConsoleState) => {
            this.onFrontPanelChange(state);
        });

        this.socket.on('peripheral-event', (data: any) => {
            const name = data.peripheral as string;
            const action = data.action as string;
            this.onPeripheralEvent(name, action, data);
        });

        this.socket.on('state', (data: any) => {
            this.onStateEvent(data);
        });
    }

    public get core() {
        return this.coreMemory;
    }

    public get currentState(): SystemConfiguration {
        if (!this.activeSystem) {
            throw Error('No active system');
        }

        return this.activeSystem;
    }

    private async readActiveState(): Promise<void> {
        return new Promise<void>((accept, reject) => {
            this.socket.emit('active-system', (sys: SystemConfiguration) => {
                this.onActiveSystemChanged(sys);
                accept();
            });
        });
    }

    @action
    private onDisconnected(): void {
        this.frontPanel = undefined;
        this.peripheralModels.clear();
    }

    @action
    private onFrontPanelChange(newState: ConsoleState): void {
        this.frontPanel = newState;
    }

    @action
    private onActiveSystemChanged(sys: SystemConfiguration) {
        this.activeSystem = sys;
        this.peripheralModels.clear();

        for (const conf of sys.peripherals) {
            let peripheral: PeripheralModel;

            switch (conf.kind) {
                case PeripheralType.PERPH_PT08:
                    peripheral = new ASR33Model(this.socket, conf);
                    break;
                case PeripheralType.PERPH_PC04:
                    peripheral = new PC04Model(this.socket, conf);
                    break;
                case PeripheralType.PERPH_TC08:
                    peripheral = new TC08Model(this.socket, conf);
                    break;
                case PeripheralType.PERPH_RF08:
                    peripheral = new RF08Model(this.socket, conf);
                    break;
                case PeripheralType.PERPH_DF32:
                    peripheral = new DF32Model(this.socket, conf);
                    break;
                case PeripheralType.PERPH_RK8:
                    peripheral = new RK8Model(this.socket, conf);
                    break;
                case PeripheralType.PERPH_KW8I:
                    peripheral = new KW8IModel(this.socket, conf);
                    break;
            }

            this.peripheralModels.set(peripheralConfToName(conf), peripheral);
        }
    }

    private onPeripheralEvent(name: string, action: string, data: any) {
        const peripheral = this.peripheralModels.get(name);
        if (!peripheral) {
            return;
        }

        peripheral.onPeripheralAction(action, data);
    }

    public async fetchStateList(): Promise<SystemConfiguration[]> {
        return new Promise<SystemConfiguration[]>((accept, reject) => {
            this.socket.emit('system-list', (list: SystemConfiguration[]) => {
                accept(list);
            })
        });
    }

    public async saveCurrentState() {
        return new Promise<void>((accept, reject) => {
            this.socket.emit('save-active-system', (res: boolean) => {
                if (res) {
                    accept();
                } else {
                    reject();
                }
            })
        });
    }

    @computed
    public get panel(): ConsoleState {
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
        if (!this.frontPanel || !this.activeSystem) {
            return false;
        }

        return true;
    }

    public async setPanelSwitch(sw: string, state: boolean): Promise<void> {
        this.socket.emit('console-switch', {'switch': sw, 'state': state});
    }

    public async createNewState(state: SystemConfiguration) {
        return new Promise<boolean>((accept, reject) => {
            this.socket.emit('create-system', state, (res: boolean) => {
                if (res) {
                    accept();
                } else {
                    reject();
                }
            });
        });
    }

    public async activateState(id: string) {
        return new Promise<boolean>((accept, reject) => {
            this.socket.emit('set-active-system', id, (res: boolean) => {
                if (res) {
                    accept();
                } else {
                    reject();
                }
            });
        });
    }

    private onStateEvent(data: any) {
        switch (data.action) {
            case 'active-state-changed':
                this.readActiveState();
                break;
        }
    }
}
