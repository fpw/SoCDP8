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
class CoreMemory {
    constructor(memBuf) {
        this.buf = memBuf;
    }
    getWordCount() {
        return this.buf.length / 4;
    }
    dumpCore() {
        const numWords = this.buf.length / 4;
        let res = new Uint16Array(numWords);
        for (let i = 0; i < numWords; i++) {
            res[i] = this.buf.readUInt16LE(i * 4);
        }
        return res;
    }
    loadCore(data) {
        const numWords = Math.min(data.length, this.buf.length / 4);
        for (let i = 0; i < numWords; i++) {
            this.buf.writeUInt16LE(data[i], i * 4);
        }
    }
}
exports.CoreMemory = CoreMemory;
