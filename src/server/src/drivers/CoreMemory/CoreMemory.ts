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

import { DataBreakRequest, DataBreakReply } from "../IO/DataBreak";

export class CoreMemory {
    private buf: Buffer;

    public constructor(memBuf: Buffer) {
        this.buf = memBuf;
    }

    public getWordCount(): number {
        return this.buf.length / 4;
    }

    public peekWord(addr: number): number {
        return this.buf.readUInt16LE(addr * 4);
    }

    public pokeWord(addr: number, value: number): void {
        this.buf.writeUInt16LE(value, addr * 4);
    }

    public dumpCore(): Uint16Array {
        const numWords = this.getWordCount()
        let res = new Uint16Array(numWords);
        for (let i = 0; i < numWords; i++) {
            res[i] = this.peekWord(i);
        }
        return res;
    }

    public loadCore(data: Uint16Array): void {
        console.log(`Restoring ${data.length} words`);
        const numWords = Math.min(data.length, this.getWordCount());
        for (let i = 0; i < numWords; i++) {
            this.pokeWord(i, data[i]);
        }
    }

    public writeData(addr: number, data: number[]) {
        for (let i = 0; i < data.length; i++) {
            this.pokeWord(addr + i, data[i]);
        }
    }

    public clear(): void {
        const numWords = this.getWordCount();
        for (let i = 0; i < numWords; i++) {
            this.pokeWord(i, 0);
        }
    }

    public simulateDataBreak(req: DataBreakRequest): DataBreakReply {
        let ma = 0;
        let overflow = false;

        if (req.threeCycle) {
            let wc = this.peekWord(req.address);
            let ca = this.peekWord(req.address + 1);
            wc = (wc + 1) & 0o7777;
            overflow = (wc == 0);
            if (req.incCA) {
                ca = (ca + 1) & 0o7777;
            }
            this.pokeWord(req.address, wc);
            this.pokeWord(req.address + 1, ca);
            ma = (req.field << 12) | ca;
        } else {
            ma = (req.field << 12) | req.address;
        }

        let mb = 0;
        if (req.isWrite) {
            this.pokeWord(ma, req.data);
            mb = req.data;
        } else if (req.incMB) {
            mb = this.peekWord(ma);
            mb = (mb + 1) % 0o7777;
            this.pokeWord(ma, req.data);
        } else {
            mb = this.peekWord(ma);
        }
        return {
            mb: mb,
            wordCountOverflow: overflow
        }
    }
}
