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
import { Server } from 'http';
import { SoCDP8 } from './models/SoCDP8';

export class AppServer {
    private app: express.Application;
    private pdp8: SoCDP8;
    private socket: io.Server;
    private httpServer: Server;

    constructor(port: number) {
        this.pdp8 = new SoCDP8();

        this.app = express();
        this.app.use(express.static('./public'));

        this.httpServer = new Server(this.app);
        this.socket = io(this.httpServer);
        this.socket.on('connection', client => this.onConnect(client));

        this.httpServer.listen(port);

        this.pdp8.setOnPunch((data: number) => {
            this.socket.emit('punch', data);
            return Promise.resolve();
        });
    }

    private onConnect(client: io.Socket) {
        console.log(`Connection ${client.id} from ${client.handshake.address}`);

        client.on('console-switch', data => this.onConsoleSwitch(client, data));

        client.on('clear-asr33-tape', () => {
            console.log(`${client.id}: Clear ASR33 tape`);
            this.pdp8.clearTapeInput();
        });

        client.on('append-asr33-tape', (buffer: ArrayBuffer) => {
            console.log(`${client.id}: Append to ASR33 tape: ${buffer.byteLength}`);
            const data: number[] = Array.from(new Uint8Array(buffer));
            this.pdp8.appendTapeInput(data);
        });

        client.on('load-pr8-tape', (buffer: ArrayBuffer) => {
            console.log(`${client.id}: Set PR8 tape: ${buffer.byteLength}`);
            const data: number[] = Array.from(new Uint8Array(buffer));
            this.pdp8.setHighTapeInput(data);
        });

        this.socket.emit('console-state', this.pdp8.readConsoleState());
    }

    private onConsoleSwitch(client: io.Socket, data: any): void {
        console.log(`${client.id}: Setting switch ${data.switch} to ${data.state ? '1' : '0'}`);
        this.pdp8.setSwitch(data.switch, data.state);

        if (['start', 'load', 'dep', 'exam', 'cont', 'stop'].includes(data.switch)) {
            setTimeout(() => {
                this.pdp8.setSwitch(data.switch, false);
            }, 150);
        }
    }

    public start(): void {
        setInterval(() => {
            this.socket.emit('console-state', this.pdp8.readConsoleState());
        }, 100);

        setInterval(async () => {
            await this.pdp8.checkDevices();
        }, 1);
    }
}
