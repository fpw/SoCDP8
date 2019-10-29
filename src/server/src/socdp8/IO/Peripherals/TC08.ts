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

interface TapeState {
    data: Buffer;
    curBlock: number;

    moving: boolean;
    direction: TapeDirection;
    lastMotionAt: bigint;
}

export class TC08 extends Peripheral {
    private readonly NUM_BLOCKS = 1474;
    private readonly BLOCK_SIZE = 129;
    private readonly BRK_ADDR   = 0o7754;

    private tapes: TapeState[] = [];
    private state: StatusRegisterA;

    constructor(private busNum: number) {
        super();

        this.tapes[0] = {
            data: readFileSync('/home/socdp8/os8.tu56'),
            curBlock: -1,
            moving: false,
            direction: TapeDirection.FORWARD,
            lastMotionAt: 0n
        }

        this.state = {
            transportUnit: 0,
            direction: TapeDirection.FORWARD,
            run: false,
            contMode: false,
            func: TapeFunction.MOVE,
            irq: false,
            keepError: false,
            keepTapeFlag: false,
        }
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
        const tapesMoved = this.doTapeMotion();

        const attn = io.readRegister(DeviceRegister.REG_C);
        if (attn) {
            // the program executed DTXA to change something
            const regA = io.readRegister(DeviceRegister.REG_A);
            this.state = this.decodeRegA(regA);
            console.log(`TC08: Func ${TapeFunction[this.state.func]}, dir ${TapeDirection[this.state.direction]}, run ${this.state.run}, cont ${this.state.contMode}`);
            io.writeRegister(DeviceRegister.REG_C, 0);
        }

        if (this.state.transportUnit >= this.tapes.length) {
            console.log(`TC08: Invalid transport unit ${this.state.transportUnit}`);
            this.setSelectError(io);
            return;
        }

        const tape = this.tapes[this.state.transportUnit];

        if (tape.moving && ((tape.direction == TapeDirection.REVERSE && tape.curBlock < 0) || (tape.direction == TapeDirection.FORWARD && tape.curBlock >= this.NUM_BLOCKS))) {
            console.log(`TC08: End of tape (${tape.curBlock})`);
            tape.moving = false;
            this.state.run = false;
            this.state.func = TapeFunction.MOVE;
            this.setEndOfTapeError(io);
            return;
        }

        if (tape.direction != this.state.direction) {
            console.log(`TC08: Change direction on block ${tape.curBlock}`);
            tape.direction = this.state.direction;
            tape.lastMotionAt = this.readSteadyClock();
        }
        
        tape.moving = this.state.run;

        const newBlock = tapesMoved[this.state.transportUnit];

        switch (this.state.func) {
            case TapeFunction.MOVE:     await this.doMove(io, tape, newBlock, this.state.contMode); break;
            case TapeFunction.SEARCH:   await this.doSearch(io, tape, newBlock, this.state.contMode); break;
            case TapeFunction.READ:     await this.doRead(io, tape, newBlock, this.state.contMode); break;
            default:
                console.log(`TC08: Function ${TapeFunction[this.state.func]} not implemented`);
                this.setSelectError(io);
        }
    }

    private doTapeMotion(): boolean[] {
        let moves: boolean[] = []
        const now = this.readSteadyClock();
        for (const tape of this.tapes) {
            let moved = false;
            if (tape.moving) {
                if (now - tape.lastMotionAt > 0.025e9) {
                    switch (tape.direction) {
                        case TapeDirection.FORWARD:
                            tape.curBlock++;
                            break;
                        case TapeDirection.REVERSE:
                            tape.curBlock--;
                            break;
                    }
                    moved = true;
                    tape.lastMotionAt = now;
                }
            }
            moves.push(moved);
        }
        return moves;
    }

    private async doMove(io: IOContext, tape: TapeState, newBlock: boolean, contMode: boolean) {
    }

    private async doSearch(io: IOContext, tape: TapeState, newBlock: boolean, contMode: boolean) {
        if (!newBlock) {
            return;
        }

        console.log(`TC08: Search block ${tape.curBlock}`);
        let num = tape.curBlock;
        const memField = this.readMemField(io);
        const reply = await io.dataBreak({
            threeCycle: true,
            isWrite: true,
            data: num,
            address: this.BRK_ADDR,
            field: memField,
            incMB: false,
            incCA: false
        });

        if (!contMode || reply.wordCountOverflow) {
            this.setDECTapeFlag(io);
        }
    }

    private async doRead(io: IOContext, tape: TapeState, newBlock: boolean, contMode: boolean) {
        if (!newBlock) {
            return;
        }

        console.log(`TC08: Read block ${tape.curBlock}`);
        let overflow = false;
        for (let i = 0; i < this.BLOCK_SIZE; i++) {
            const memField = this.readMemField(io);
            const data = tape.data.readUInt16LE((tape.curBlock * this.BLOCK_SIZE + i) * 2);

            const brkReply = await io.dataBreak({
                threeCycle: true,
                isWrite: true,
                data: data,
                address: this.BRK_ADDR,
                field: memField,
                incMB: false,
                incCA: true
            });

            const brkCA = await io.dataBreak({
                threeCycle: false,
                isWrite: false,
                data: 0,
                address: this.BRK_ADDR + 1,
                field: 0,
                incMB: false,
                incCA: false
            });

            // console.log(`TC08: ${memField.toString(8)}.${brkCA.mb.toString(8)} -> ${data.toString(8)}`);

            if (this.state.contMode && brkReply.wordCountOverflow) {
                overflow = true;
                break;
            }
        }
        
        if (!contMode || overflow) {
            this.setDECTapeFlag(io);
        }
    }

    private decodeRegA(regA: number): StatusRegisterA {
        return {
            transportUnit: (regA & 0o7000) >> 9,
            
            direction: (regA & (1 << 8)) >> 8,
            run: (regA & (1 << 7)) != 0,
            contMode: (regA & (1 << 6)) != 0,
            
            func: (regA & 0o0070) >> 3,

            irq: (regA & (1 << 2)) != 0,
            keepError: (regA & (1 << 1)) != 0,
            keepTapeFlag: (regA & (1 << 0)) != 0
        };
    }

    private readMemField(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        return (regB & 0o0070) >> 3;
    }

    private setSelectError(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 11) | (1 << 8));
    }

    private setEndOfTapeError(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 11) | (1 << 9));
    }

    private setDECTapeFlag(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | 1);
}
}
