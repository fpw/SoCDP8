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

import { SoCDP8, ConsoleState } from './socdp8/SoCDP8';
import feathers, { Id } from '@feathersjs/feathers'
import '@feathersjs/transport-commons';
import express from '@feathersjs/express';
import socketio from '@feathersjs/socketio'
import { Params } from "express-serve-static-core";

console.log("SoCDP8 starting...");

const pdp8 = new SoCDP8();


class CoreMemoryService {
    async find(): Promise<number[]> {
        return Array.from(pdp8.readCoreDump())
    }
}

class ConsoleService {
    async find(): Promise<ConsoleState> {
        return pdp8.readConsoleState();
    }
}

const app = express(feathers());
app.use(express.json());
app.use(express.urlencoded({'extended': true}));
app.use(express.static(__dirname + '/static'));

app.configure(express.rest());
app.configure(socketio());

app.use('/core-memory', new CoreMemoryService());
app.use('/console', new ConsoleService());
app.use(express.errorHandler());

app.on('connection', connection => {
    app.channel('everybody').join(connection);
});

app.publish(data => app.channel('everybody'));

app.listen(8000).on('listening', () => {
    console.log('Service started');
});
