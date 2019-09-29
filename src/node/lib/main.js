"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoCDP8_1 = require("./socdp8/SoCDP8");
const feathers_1 = __importDefault(require("@feathersjs/feathers"));
require("@feathersjs/transport-commons");
const express_1 = __importDefault(require("@feathersjs/express"));
const socketio_1 = __importDefault(require("@feathersjs/socketio"));
console.log("SoCDP8 starting...");
const pdp8 = new SoCDP8_1.SoCDP8();
class CoreMemoryService {
    async find() {
        return Array.from(pdp8.readCoreDump());
    }
}
class ConsoleService {
    async find() {
        return pdp8.readConsoleState();
    }
}
const app = express_1.default(feathers_1.default());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ 'extended': true }));
app.use(express_1.default.static(__dirname + '/static'));
app.configure(express_1.default.rest());
app.configure(socketio_1.default());
app.use('/core-memory', new CoreMemoryService());
app.use('/console', new ConsoleService());
app.use(express_1.default.errorHandler());
app.on('connection', connection => {
    app.channel('everybody').join(connection);
});
app.publish(data => app.channel('everybody'));
app.listen(8000).on('listening', () => {
    console.log('Service started');
});
