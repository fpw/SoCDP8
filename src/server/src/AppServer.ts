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

import * as express from 'express';
import * as cors from 'cors';
import { Server as HTTPServer } from 'http';
import { SoCDP8 } from './models/SoCDP8';
import { isDeepStrictEqual, promisify } from 'util';
import { SystemConfigurationList } from './models/SystemConfigurationList';
import { SystemConfiguration } from './types/SystemConfiguration';
import { ConsoleState } from './types/ConsoleTypes';
import { Server, Socket } from 'socket.io';
import * as io from 'socket.io';
import { PeripheralInAction, PeripheralOutAction } from './types/PeripheralAction';

export class AppServer {
    private readonly DATA_DIR = '/home/socdp8/'
    private readonly MOMENTARY_DEBOUNCE_MS = 150;
    private readonly PANEL_CHECK_MS = 75;

    private app: express.Application;
    private pdp8: SoCDP8;
    private systems: SystemConfigurationList;
    private socket: Server;
    private httpServer: HTTPServer;

    private lastConsoleState?: ConsoleState;

    constructor() {
        this.systems = new SystemConfigurationList(this.DATA_DIR);

        this.pdp8 = new SoCDP8(this.DATA_DIR, {
            onPeripheralEvent: (id, action) => this.sendPeripheralEvent(id, action),
        });

        this.app = express();
        this.app.use(cors());
        this.app.use(express.static(__dirname + '/../public'));

        this.httpServer = new HTTPServer(this.app);
        this.socket = new Server(this.httpServer, {
            cors: {
                origin: "*",
            }
        });
        this.setupSocketAPI();
    }

    public async start(port: number) {
        const defaultSystem = this.systems.findSystemById('default');
        const dir = this.systems.getDirForSystem(defaultSystem);

        await this.pdp8.activateSystem(defaultSystem, dir);
        this.httpServer.listen(port);
        this.startConsoleCheckLoop();
    }

    private sendPeripheralEvent(id: number, action: PeripheralInAction): void {
        this.socket.emit('peripheral-event', {
            id: id,
            action: action,
        });
    }

    // Socket API
    private setupSocketAPI(): void {
        this.socket.on('connection', client => this.onClientConnect(client));
    }

    private onClientConnect(client: Socket) {
        console.log(`Connection ${client.id} from ${client.handshake.address}`);

        client.on('console-switch', data => this.setConsoleSwitch(client, data));
        client.on('peripheral-action', data => this.execPeripheralAction(client, data));
        client.on('peripheral-change-conf', data => this.changePeripheralConfig(client, data));
        client.on('core', data => this.execCoreMemoryAction(client, data));
        client.on('read-disk-block', (id: number, block: number, reply) => reply(this.readDiskBlock(client, id, block)));

        client.on('system-list', reply => reply(this.getSystemList(client)));
        client.on('create-system', (sys, reply) => reply(this.createSystem(client, sys)));
        client.on('active-system', reply => reply(this.getActiveSystem(client)));
        client.on('set-active-system', (id, reply) => reply(this.setActiveSystem(client, id)));
        client.on('save-active-system', reply => reply(this.saveActiveSystem(client)));
        client.on('delete-system', (id, reply) => reply(this.deleteSystem(client, id)));

        client.emit('console-state', this.pdp8.readConsoleState());
    }

    private getSystemList(client: Socket): SystemConfiguration[] {
        console.log(`${client.id}: Get system list`);
        return this.systems.getSystems();
    }

    private createSystem(client: Socket, sys: SystemConfiguration): boolean {
        console.log(`${client.id}: Create system`);

        try {
            this.systems.addSystem(sys);
            this.sendSystemListChange();
            return true;
        } catch (e) {
            return false;
        }
    }

    private deleteSystem(client: Socket, id: string): boolean {
        console.log(`${client.id}: Delete system`);
        try {
            const sys = this.systems.findSystemById(id);
            if (sys == this.pdp8.getActiveSystem()) {
                return false;
            } else if (sys.id == 'default') {
                return false;
            }
            this.systems.deleteSystem(sys);
            this.sendSystemListChange();
            return true;
        } catch (e) {
            return false;
        }
    }

    private sendSystemListChange() {
        this.socket.emit('state', {type: 'state-list-changed'} as PeripheralInAction);
    }

    private getActiveSystem(client: Socket): SystemConfiguration {
        console.log(`${client.id}: Get active system`);
        return this.pdp8.getActiveSystem();
    }

    private async setActiveSystem(client: Socket, id: string) {
        console.log(`${client.id}: Set active system`);

        try {
            const system = this.systems.findSystemById(id);
            const dir = this.systems.getDirForSystem(system);
            await this.pdp8.activateSystem(system, dir);
            this.socket.emit('state', {type: 'active-state-changed'} as PeripheralInAction);
            console.log('State changed');
            return true;
        } catch (e) {
            return false;
        }
    }

    private async saveActiveSystem(client: Socket): Promise<boolean> {
        console.log(`${client.id}: Save active system`);
        const system = this.pdp8.getActiveSystem();
        const dir = this.systems.getDirForSystem(system);
        try {
            await this.systems.saveSystem(system);
            await this.pdp8.saveSystemState(dir);
            return true;
        }  catch (e) {
            return false;
        }
    }

    private setConsoleSwitch(client: Socket, data: any): void {
        console.log(`${client.id}: Setting switch ${data.switch} to ${data.state ? '1' : '0'}`);
        this.pdp8.setSwitch(data.switch, data.state);

        // release momentary switches automatically
        if (['start', 'load', 'dep', 'exam', 'cont', 'stop'].includes(data.switch)) {
            setTimeout(() => {
                this.pdp8.setSwitch(data.switch, false);
            }, this.MOMENTARY_DEBOUNCE_MS);
        }
    }

    private execPeripheralAction(client: Socket, data: any): void {
        const id: number = data.id;
        const action: PeripheralOutAction = data.action;

        console.log(`${client.id}: Peripheral action ${action.type} on ${id}`);
        this.pdp8.requestDeviceAction(data.id, data.action);
    }

    private changePeripheralConfig(client: Socket, data: any): void {
        console.log(`${client.id}: Change peripheral config on ${data.id}`);
        this.pdp8.updatePeripheralConfig(data.id, data.config);
    }

    private execCoreMemoryAction(client: Socket, data: any): void {
        console.log(`${client.id}: Core memory action: ${data.action}`);
        switch (data.action) {
            case 'clear':
                this.pdp8.clearCoreMemory();
                break;
            case 'write':
                this.pdp8.writeCoreMemory(data.addr, data.fragment);
                break;
        }
    }

    private readDiskBlock(client: Socket, id: number, block: number): Uint16Array {
        console.log(`${client.id}: Read disk ${id} block ${block}`);
        try {
            return this.pdp8.readPeripheralBlock(id, block);
        } catch (e) {
            console.warn(e);
            return new Uint16Array();
        }
    }

    // Console maintenance

    private async startConsoleCheckLoop(): Promise<void> {
        const sleepMs = promisify(setTimeout);

        while (true) {
            const curState = this.pdp8.readConsoleState();
            if (!isDeepStrictEqual(this.lastConsoleState, curState)) {
                this.broadcastConsoleState(curState);
                this.lastConsoleState = curState;
            }

            await sleepMs(this.PANEL_CHECK_MS);
        }
    }

    private broadcastConsoleState(state: ConsoleState) {
        // since we are only sending changes, do not send as volatile
        this.socket.emit('console-state', state);
    }
}
