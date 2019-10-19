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

import { SoCDP8 } from './socdp8/SoCDP8';
import * as express from 'express';
import * as io from 'socket.io';
import { Server } from 'http';

console.log('SoCDP8 starting...');

const app = express();
const server = new Server(app);
const sockServer = io(server);

const pdp8 = new SoCDP8();
app.use(express.static('./public'));

sockServer.on('connection', (client: io.Socket) => {
    const addr = client.handshake.address;
    console.log(`Connection ${client.id} from ${addr}`);

    client.on('console-switch', (data: any) => {
        console.log(`${addr}: Setting switch ${data.switch} to ${data.state ? '1' : '0'}`);
        pdp8.setSwitch(data.switch, data.state);
        if (['start', 'load', 'dep', 'exam', 'cont', 'stop'].includes(data.switch)) {
            setTimeout(() => {
                pdp8.setSwitch(data.switch, false);
            }, 110);
        }
    });

    client.on('load-asr33-tape', (data: ArrayBuffer) => {
        console.log(`${addr}: Set ASR33 tape: ${data.byteLength}`);
        pdp8.setTapeInput(data);
    });

    client.on('load-pr8-tape', (data: ArrayBuffer) => {
        console.log(`${addr}: Set PR8 tape: ${data.byteLength}`);
        pdp8.setHighTapeInput(data);
    });
});

server.listen(8000);

pdp8.setOnPunch((data: number) => {
    sockServer.emit('punch', data);
    return Promise.resolve();
});

setInterval(() => {
    sockServer.emit('console-state', pdp8.readConsoleState());
}, 100);

setImmediate(async () => {
    await pdp8.run();
});
