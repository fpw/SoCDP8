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

import { Peripheral, DeviceRegister, DeviceType, IOContext } from './Peripheral';
import { readFileSync } from 'fs';
import { CoreMemory } from '../../CoreMemory/CoreMemory';

enum TapeDirection {
    FORWARD = 0,
    REVERSE = 1
}

enum TapeFunction {
    MOVE            = 0,
    SEARCH          = 1,
    READ            = 2,
    READ_ALL        = 3,
    WRITE           = 4,
    WRITE_ALL       = 5,
    WRITE_TIMING    = 6,
    RESERVED        = 7
}

interface StatusRegisterA {
    transportUnit: number;
    direction: TapeDirection;
    run: boolean;
    contMode: boolean;
    func: TapeFunction;
    irq: boolean;
    keepError: boolean;
    keepTapeFlag: boolean;
}

export class TC08 extends Peripheral {
    private readonly NUM_BLOCKS = 1474;
    private readonly BLOCK_SIZE = 129;
    private readonly ADDR_WC = 0o7754;
    private readonly ADDR_CA = 0o7755;

    private data: Buffer;
    private curBlock: number;
    private regA?: StatusRegisterA;

    constructor(private busNum: number, private mem: CoreMemory) {
        super();
        this.data = readFileSync('/home/socdp8/os8.tu56');
        this.curBlock = 0;
    }

    public getType(): DeviceType {
        return DeviceType.TC08;
    }

    public getBusConnections(): Map<number, number> {
        const map = new Map<number, number>();
        map.set(this.busNum, 0);
        map.set(this.busNum + 1, 1);
        return map;
    }

    public async onTick(io: IOContext): Promise<void> {
        const attn = io.readRegister(DeviceRegister.REG_C);
        if (attn != 0) {
            this.regA = this.decodeRegA(io.readRegister(DeviceRegister.REG_A));

            // clear notification
            io.writeRegister(DeviceRegister.REG_C, 0);
        } else if (this.regA) {
            if (this.regA.contMode) {
                console.log('Continuous mode not supported');
                return;
            }

            const regB = io.readRegister(DeviceRegister.REG_B);
            switch (this.regA.func) {
                case TapeFunction.MOVE:
                    if (this.regA.direction == TapeDirection.FORWARD) {
                        console.log('TC08: Moved forward');
                        this.curBlock = this.NUM_BLOCKS - 1;
                    } else {
                        console.log('TC08: Moved backward');
                        this.curBlock = 0;
                    }
                    io.writeRegister(DeviceRegister.REG_B, 1);
                    this.regA = undefined;
                    break;
                case TapeFunction.READ:
                    const memField = (regB & 0o0070) >> 3;

                    console.log(`TC08: Reading block ${this.curBlock}`);
                    for (let i = 0; i < this.BLOCK_SIZE; i++) {
                        let wordCount = this.mem.peekWord(this.ADDR_WC);
                        let currentAddr = this.mem.peekWord(this.ADDR_CA);

                        const data = this.data.readUInt16LE(this.curBlock * this.BLOCK_SIZE * 2 + i * 2);

                        wordCount = (wordCount + 1) & 0o7777;
                        currentAddr = (currentAddr + 1) & 0o7777;
                        this.mem.pokeWord(this.ADDR_WC, wordCount);
                        this.mem.pokeWord(this.ADDR_CA, currentAddr);
                        const memAddr = (memField << 14) | currentAddr;
                        console.log(`${memAddr.toString(8)} -> ${data.toString(8)}`);
                        this.mem.pokeWord(memAddr, data);
                    }
                    this.curBlock++;
                    io.writeRegister(DeviceRegister.REG_B, 1);
                    break;
                default:
                    console.log(`Function ${this.regA.func} not implemented`);
            }
            this.regA = undefined;
        }
    }

    private decodeRegA(regA: number): StatusRegisterA {
        return {
            transportUnit: (regA & 0o7000) >> 6,
            direction: (regA & (1 << 8)) >> 8,
            run: (regA & (1 << 7)) != 0,
            contMode: (regA & (1 << 6)) != 0,
            func: (regA & 0o0070) >> 3,
            irq: (regA & (1 << 2)) != 0,
            keepError: (regA & (1 << 1)) != 0,
            keepTapeFlag: (regA & (1 << 0)) != 0
        };
    }
}
