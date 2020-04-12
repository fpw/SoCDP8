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
import { Response, Request } from 'express-serve-static-core';
import { isDeepStrictEqual, promisify } from 'util';

export class AppServer {
    private readonly DATA_DIR = '/home/socdp8/'
    private readonly MOMENTARY_DEBOUNCE_MS = 150;
    private readonly PANEL_CHECK_MS = 75;

    private app: express.Application;
    private pdp8: SoCDP8;
    private socket: io.Server;
    private httpServer: Server;

    private lastConsoleState?: ConsoleState;

    constructor(port: number) {
        this.pdp8 = new SoCDP8(this.DATA_DIR, {
            onPeripheralEvent: (id, action, data) => this.onPeripheralEvent(id, action, data)
        });

        this.pdp8.activateState('default');

        let clientDir = './public';
        if (process.env.SOCDP8_CLIENT_DIR) {
            clientDir = process.env.SOCDP8_CLIENT_DIR;
        }

        this.app = express();
        this.app.use(cors());
        this.app.use(express.static(clientDir));
        this.setupJSONApi();

        this.httpServer = new Server(this.app);
        this.socket = io(this.httpServer);
        this.setupSocketAPI();

        this.httpServer.listen(port);
    }

    public start(): void {
        this.startConsoleCheckLoop();
    }

    private onPeripheralEvent(devId: number, action: string, data: any): void {
        this.socket.emit('peripheral-event', {
            devId: devId,
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
        client.on('core', (data) => this.onCoreMemoryAction(client, data));
        client.on('state', (data) => this.onStateAction(client, data));

        client.emit('console-state', this.pdp8.readConsoleState());
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
        console.log(`${client.id}: Peripheral action ${data.action} on ${data.devId}`);
        const devId = data.devId as number;
        const action = data.action as string;
        this.pdp8.requestDeviceAction(devId, action, data.data);
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

    private onStateAction(client: io.Socket, data: any): void {
        console.log(`${client.id}: State action: ${data.action}`);
        switch (data.action) {
            case 'save':
                this.pdp8.saveState();
                break;
        }
    }

    // JSON API

    private setupJSONApi(): void {
        this.app.get('/machine-states', (req, res) => this.requestStateList(req, res));
        this.app.get('/machine-states/active', (req, res) => this.requestActiveState(req, res));
    }

    private requestStateList(request: Request, response: Response): void {
        console.log('Sending state list');
        const list = this.pdp8.getStateList().map(e => e.toJSONObject());
        response.json(list);
    }

    private requestActiveState(request: Request, response: Response): void {
        console.log('Sending active state');
        const state = this.pdp8.getActiveState();
        response.json(state.toJSONObject());
    }

    // State maintenance

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
