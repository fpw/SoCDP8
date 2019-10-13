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

 import { readdirSync, readFileSync, openSync, closeSync } from 'fs';
import { O_SYNC, O_RDWR } from 'constants';
const mmap = require("mmap-io");

export class UIOMapper {
    private SYS_PATH = "/sys/class/uio/";

    public mapUio(name: string, region: string): Buffer {
        let uioName = this.findUIO(name);
        let regionPath = this.findRegion(uioName, region);
        let size = this.readNumber(regionPath, 'size');
        let buffer = this.openMap(uioName, size);
        return buffer;
    }

    private findUIO(name: string): string {
        const basePath = this.SYS_PATH;
        let uioDir = readdirSync(basePath);
        for (let entry of uioDir) {
            let curDir = basePath + entry;
            let content = readFileSync(curDir + '/name');
            let curName = content.toString().trim();
            if (curName == name) {
                return entry;
            }
        }
        throw new Error('UIO ' + name + ' not found');
    }

    private findRegion(uioName: string, name: string): string {
        let basePath =  this.SYS_PATH + uioName + '/maps/';
        let mapsDir = readdirSync(basePath);
        for (let entry of mapsDir) {
            let curDir = basePath + entry;
            let content = readFileSync(curDir + '/name');
            let curName = content.toString().trim();
            if (curName == name) {
                return curDir + '/';
            }
        }
        throw new Error('UIO region ' + name + ' not found');
    }

    private readNumber(regionPath: string, fileName: string): number {
        let content = readFileSync(regionPath + fileName);
        return parseInt(content.toString());
    }

    private openMap(uioName: string, size: number): Buffer {
        let fd = openSync('/dev/' + uioName, O_SYNC | O_RDWR);
        let buf = mmap.map(size, mmap.PROT_READ | mmap.PROT_WRITE, mmap.MAP_SHARED, fd, 0);
        closeSync(fd);
        return buf;
    }
}
