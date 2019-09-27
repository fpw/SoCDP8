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
Object.defineProperty(exports, "__esModule", { value: true });
const UIOMapper_1 = require("../UIO/UIOMapper");
const Console_1 = require("./Console/Console");
const CoreMemory_1 = require("./CoreMemory/CoreMemory");
const IOController_1 = require("./IO/IOController");
const ASR33_1 = require("./IO/Peripherals/ASR33");
class SoCDP8 {
    constructor() {
        let uio = new UIOMapper_1.UIOMapper();
        let memBuf = uio.mapUio('socdp8_core', 'socdp8_core_mem');
        let consBuf = uio.mapUio('socdp8_console', 'socdp8_console');
        let ioBuf = uio.mapUio('socdp8_io', 'socdp8_io_ctrl');
        this.cons = new Console_1.Console(consBuf);
        this.mem = new CoreMemory_1.CoreMemory(memBuf);
        this.io = new IOController_1.IOController(ioBuf);
    }
    readCoreDump() {
        return this.mem.dumpCore();
    }
    async run() {
        let asr = new ASR33_1.ASR33(this.io);
        await this.io.runDeviceLoop();
    }
}
exports.SoCDP8 = SoCDP8;
