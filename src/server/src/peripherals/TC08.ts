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

import { Peripheral, DeviceRegister, DeviceType, IOContext } from '../drivers/IO/Peripheral';
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
}

interface TapeState {
    data: Buffer;
    curBlock: number;
    blockFound: boolean;
    blockRead: boolean;

    moving: boolean;
    direction: TapeDirection;
    lastMotionAt: bigint;
}

export class TC08 extends Peripheral {
    private readonly DEBUG = false;
    private readonly NUM_BLOCKS = 1474;
    private readonly BLOCK_SIZE = 129;
    private readonly BRK_ADDR   = 0o7754;

    private tapes: TapeState[] = [];
    private state: StatusRegisterA;

    constructor(private busNum: number) {
        super();

        this.tapes[0] = {
            data: readFileSync('/home/socdp8/os8.tu56'),
            curBlock: 0,
            blockFound: false,
            blockRead: false,
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

    private lastRegA: number = 0;

    public async onTick(io: IOContext): Promise<void> {
        const [newBlockFound, newBlockReady] = this.doTapeMotion();
        const regA = io.readRegister(DeviceRegister.REG_A);

        if (this.lastRegA != regA) {
            // the program executed DTXA to change something
            if (this.DEBUG) {
                console.log(`TC08: DTXA ${regA.toString(8)}`);
            }

            this.state = this.decodeRegA(regA);
            if (this.DEBUG) {
                console.log(`TC08: Func ${TapeFunction[this.state.func]}, dir ${TapeDirection[this.state.direction]}, run ${this.state.run}, cont ${this.state.contMode}`);
            }
            io.writeRegister(DeviceRegister.REG_C, 0);
            this.lastRegA = regA;
        }

        if (this.state.transportUnit >= this.tapes.length) {
            console.error(`TC08: Invalid transport unit ${this.state.transportUnit}`);
            this.setSelectError(io);
            return;
        }

        const tape = this.tapes[this.state.transportUnit];

        if (tape.moving && ((tape.direction == TapeDirection.REVERSE && tape.curBlock < 0) || (tape.direction == TapeDirection.FORWARD && tape.curBlock >= this.NUM_BLOCKS))) {
            console.warn(`TC08: End of tape (${tape.curBlock})`);
            tape.moving = false;
            this.state.run = false;
            this.clearMotionFlag(io);
            this.setEndOfTapeError(io);
            tape.lastMotionAt = this.readSteadyClock();
            return;
        } else {
            tape.moving = this.state.run;
        }

        if (tape.direction != this.state.direction) {
            if (this.DEBUG) {
                console.log(`TC08: Change direction on block ${tape.curBlock}`);
            }
            tape.blockFound = true;
            tape.blockRead = true;
            tape.direction = this.state.direction;
            tape.lastMotionAt = this.readSteadyClock();
        }

        try {
            switch (this.state.func) {
                case TapeFunction.MOVE:     await this.doMove(io, tape, this.state.contMode); break;
                case TapeFunction.SEARCH:   await this.doSearch(io, tape, newBlockFound, this.state.contMode); break;
                case TapeFunction.READ:     await this.doRead(io, tape, newBlockReady, this.state.contMode); break;
                case TapeFunction.WRITE:    await this.doWrite(io, tape, newBlockReady, this.state.contMode); break;
                default:
                    console.error(`TC08: Function ${TapeFunction[this.state.func]} not implemented`);
                    this.setSelectError(io);
            }
        } catch (e) {
            console.warn(`TC08: Timing error: ${e}`);
            this.clearMotionFlag(io);
            this.setEndOfTapeError(io);
        }
    }

    private doTapeMotion(): [boolean, boolean] {
        const now = this.readSteadyClock();
        let blockFound = false;
        let blockRead = false;
        for (const tape of this.tapes) {
            if (tape.moving) {
                if (now - tape.lastMotionAt > 0.005e9) {
                    if (!tape.blockFound && tape.curBlock >= 0 && tape.curBlock < this.NUM_BLOCKS) {
                        tape.blockFound = true;
                        blockFound = true;
                    }
                }

                if (now - tape.lastMotionAt > 0.015e9) {
                    if (!tape.blockRead && tape.curBlock >= 0 && tape.curBlock < this.NUM_BLOCKS) {
                        tape.blockRead = true;
                        blockRead = true;
                    }
                }

                if (now - tape.lastMotionAt > 0.025e9) {
                    switch (tape.direction) {
                        case TapeDirection.FORWARD:
                            tape.curBlock++;
                            break;
                        case TapeDirection.REVERSE:
                            tape.curBlock--;
                            break;
                    }
                    tape.blockRead = false;
                    tape.blockFound = false;
                    tape.lastMotionAt = now;
                }
            }
        }
        return [blockFound, blockRead];
    }

    private async doMove(io: IOContext, tape: TapeState, contMode: boolean) {
    }

    private async doSearch(io: IOContext, tape: TapeState, blockFound: boolean, contMode: boolean) {
        if (!blockFound) {
            return;
        }

        console.log(`TC08: Search -> ${tape.curBlock}`);

        const memField = this.readMemField(io);
        const reply = await io.dataBreak({
            threeCycle: true,
            isWrite: true,
            data: tape.curBlock,
            address: this.BRK_ADDR,
            field: memField,
            incMB: false,
            incCA: false
        });

        if (!contMode || reply.wordCountOverflow) {
            this.setDECTapeFlag(io);
        }
    }

    private async doRead(io: IOContext, tape: TapeState, blockRead: boolean, contMode: boolean) {
        if (!blockRead) {
            return;
        }

        console.log(`TC08: Read ${tape.curBlock}`);
        let overflow = false;
        for (let i = 0; i < this.BLOCK_SIZE - 1; i++) {
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

            if (this.state.contMode && brkReply.wordCountOverflow) {
                overflow = true;
                break;
            }
        }

        if (!contMode || overflow) {
            this.setDECTapeFlag(io);
        }
    }

    private async doWrite(io: IOContext, tape: TapeState, blockRead: boolean, contMode: boolean) {
        if (!blockRead) {
            return;
        }

        console.log(`TC08: Write ${tape.curBlock}`);
        let overflow = false;
        for (let i = 0; i < this.BLOCK_SIZE - 1; i++) {
            const memField = this.readMemField(io);

            const brkReply = await io.dataBreak({
                threeCycle: true,
                isWrite: false,
                data: 0,
                address: this.BRK_ADDR,
                field: memField,
                incMB: false,
                incCA: true
            });

            tape.data.writeUInt16LE(brkReply.mb, (tape.curBlock * this.BLOCK_SIZE + i) * 2);

            if (brkReply.wordCountOverflow) {
                overflow = true;
                break;
            }
        }

        this.setDECTapeFlag(io);
    }

    private decodeRegA(regA: number): StatusRegisterA {
        return {
            transportUnit: (regA & 0o7000) >> 9,

            direction: (regA & (1 << 8)) >> 8,
            run: (regA & (1 << 7)) != 0,
            contMode: (regA & (1 << 6)) != 0,

            func: (regA & 0o0070) >> 3,

            irq: (regA & (1 << 2)) != 0,
        };
    }

    private readMemField(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        return (regB & 0o0070) >> 3;
    }

    private clearMotionFlag(io: IOContext) {
        const regA = io.readRegister(DeviceRegister.REG_A);
        io.writeRegister(DeviceRegister.REG_A, regA & ~(1 << 7));
    }

    private setTimingError(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 11) | (1 << 6));
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
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 0));
    }
}
