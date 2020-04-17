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

import * as io from 'socket.io';
import * as express from 'express';
import * as cors from 'cors';
import { Server } from 'http';
import { SoCDP8, ConsoleState } from './models/SoCDP8';
import { isDeepStrictEqual, promisify } from 'util';
import { SystemConfigurationList } from './models/SystemConfigurationList';
import { SystemConfiguration } from './types/SystemConfiguration';
import { mkdirSync } from 'fs';

export class AppServer {
    private readonly DATA_DIR = '/home/socdp8/'
    private readonly MOMENTARY_DEBOUNCE_MS = 150;
    private readonly PANEL_CHECK_MS = 75;

    private app: express.Application;
    private pdp8: SoCDP8;
    private systems: SystemConfigurationList;
    private socket: io.Server;
    private httpServer: Server;

    private lastConsoleState?: ConsoleState;

    constructor() {
        this.systems = new SystemConfigurationList(this.DATA_DIR);

        this.pdp8 = new SoCDP8(this.DATA_DIR, {
            onPeripheralEvent: (name, action, data) => this.onPeripheralEvent(name, action, data)
        });

        let clientDir = './public';
        if (process.env.SOCDP8_CLIENT_DIR) {
            clientDir = process.env.SOCDP8_CLIENT_DIR;
        }

        this.app = express();
        this.app.use(cors());
        this.app.use(express.static(clientDir));

        this.httpServer = new Server(this.app);
        this.socket = io(this.httpServer);
        this.setupSocketAPI();
    }

    public async start(port: number) {
        const defaultSystem = this.systems.findSystemById('default');
        const dir = this.systems.getDirForSystem(defaultSystem);

        await this.pdp8.activateState(defaultSystem, dir);
        this.httpServer.listen(port);
        this.startConsoleCheckLoop();
    }

    private onPeripheralEvent(name: string, action: string, data: any): void {
        this.socket.emit('peripheral-event', {
            peripheral: name,
            action: action,
            data: data
        });
    }

    // Socket API
    private setupSocketAPI(): void {
        this.socket.on('connection', client => this.onClientConnect(client));
    }

    private onClientConnect(client: io.Socket) {
        console.log(`Connection ${client.id} from ${client.handshake.address}`);

        client.on('console-switch', data => this.onConsoleSwitch(client, data));
        client.on('peripheral-action', data => this.onPeripheralAction(client, data));
        client.on('core', data => this.onCoreMemoryAction(client, data));

        client.on('system-list', reply => reply(this.requestSystemList(client)));
        client.on('create-system', (sys, reply) => reply(this.requestSystemCreate(client, sys)));
        client.on('active-system', reply => reply(this.requestActiveSystem(client)));
        client.on('set-active-system', (id, reply) => reply(this.requestSetActiveSystem(client, id)));
        client.on('save-active-system', (reply) => reply(this.saveActiveSate(client)));

        client.emit('console-state', this.pdp8.readConsoleState());
    }

    private requestSystemCreate(client: io.Socket, sys: SystemConfiguration): boolean {
        console.log(`${client.id}: System create`);

        try {
            sys.id = this.systems.generateId();
            this.systems.addState(sys);

            const dir = this.systems.getDirForSystem(sys);
            mkdirSync(dir, {recursive: true});

            return true;
        } catch (e) {
            return false;
        }
    }

    private requestSystemList(client: io.Socket): SystemConfiguration[] {
        console.log(`${client.id}: System list`);
        return this.systems.getSystems();
    }

    private requestActiveSystem(client: io.Socket): SystemConfiguration {
        console.log(`${client.id}: Active system`);
        return this.pdp8.getActiveSystem();
    }

    private async requestSetActiveSystem(client: io.Socket, id: string) {
        console.log(`${client.id}: Set active system`);

        try {
            const system = this.systems.findSystemById(id);
            const dir = this.systems.getDirForSystem(system);
            await this.pdp8.activateState(system, dir);
            this.socket.emit('state', {action: 'active-state-changed'});
            console.log('State changed');
            return true;
        } catch (e) {
            return false;
        }
    }

    private saveActiveSate(client: io.Socket): boolean {
        console.log(`${client.id}: Save active system`);
        const system = this.pdp8.getActiveSystem();
        const dir = this.systems.getDirForSystem(system);
        try {
            this.pdp8.saveState(dir);
            return true;
        }  catch (e) {
            return false;
        }
    }

    private onConsoleSwitch(client: io.Socket, data: any): void {
        console.log(`${client.id}: Setting switch ${data.switch} to ${data.state ? '1' : '0'}`);
        this.pdp8.setSwitch(data.switch, data.state);

        // release momentary switches automatically
        if (['start', 'load', 'dep', 'exam', 'cont', 'stop'].includes(data.switch)) {
            setTimeout(() => {
                this.pdp8.setSwitch(data.switch, false);
            }, this.MOMENTARY_DEBOUNCE_MS);
        }
    }

    private onPeripheralAction(client: io.Socket, data: any): void {
        console.log(`${client.id}: Peripheral action ${data.action} on ${data.peripheral}`);
        this.pdp8.requestDeviceAction(data.peripheral, data.action, data.data);
    }

    private onCoreMemoryAction(client: io.Socket, data: any): void {
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
