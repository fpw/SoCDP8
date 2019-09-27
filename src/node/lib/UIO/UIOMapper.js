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
const fs_1 = require("fs");
const mmap = require("mmap-io");
class UIOMapper {
    constructor() {
        this.SYS_PATH = "/sys/class/uio/";
    }
    mapUio(name, region) {
        let uioName = this.findUIO(name);
        let regionPath = this.findRegion(uioName, region);
        let size = this.readNumber(regionPath, 'size');
        let buffer = this.openMap(uioName, size);
        return buffer;
    }
    findUIO(name) {
        const basePath = this.SYS_PATH;
        let uioDir = fs_1.readdirSync(basePath);
        for (let entry of uioDir) {
            let curDir = basePath + entry;
            let content = fs_1.readFileSync(curDir + '/name');
            let curName = content.toString().trim();
            if (curName == name) {
                return entry;
            }
        }
        throw new Error('UIO ' + name + ' not found');
    }
    findRegion(uioName, name) {
        let basePath = this.SYS_PATH + uioName + '/maps/';
        let mapsDir = fs_1.readdirSync(basePath);
        for (let entry of mapsDir) {
            let curDir = basePath + entry;
            let content = fs_1.readFileSync(curDir + '/name');
            let curName = content.toString().trim();
            if (curName == name) {
                return curDir + '/';
            }
        }
        throw new Error('UIO region ' + name + ' not found');
    }
    readNumber(regionPath, fileName) {
        let content = fs_1.readFileSync(regionPath + fileName);
        return parseInt(content.toString());
    }
    openMap(uioName, size) {
        let fd = fs_1.openSync('/dev/' + uioName, 'r+');
        let buf = mmap.map(size, mmap.PROT_READ | mmap.PROT_WRITE, mmap.MAP_SHARED, fd, 0);
        fs_1.closeSync(fd);
        return buf;
    }
}
exports.UIOMapper = UIOMapper;
