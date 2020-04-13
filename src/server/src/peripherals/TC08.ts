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

import { Peripheral, DeviceRegister, IOContext, DeviceID } from '../drivers/IO/Peripheral';
import { sleepMs, sleepUs } from '../sleep';

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
    unit: number;
    data: Buffer;
    curLine: number;
}

export class TC08 extends Peripheral {
    private readonly DEBUG = false;

    private ZONE_WORDS = 8192;          // number of words in start / end zone
    private ZONE_WSIZE = 6;             // number of lines per zone word
    private ZONE_LINES = this.ZONE_WORDS * this.ZONE_WSIZE;

    private SYNC_WORDS = 198            // number of sync words between zones and blocks
    private SYNC_WSIZE = 6;             // number of lines per sync word
    private SYNC_LINES = this.SYNC_WORDS * this.SYNC_WSIZE;

    private readonly HEADER_WORDS = 5;  // number of words in header and trailer
    private readonly HEADER_WSIZE = 6;  // number of lines in header words
    private readonly HEADER_LINES = this.HEADER_WORDS * this.HEADER_WSIZE;

    private readonly DATA_WORDS = 129;  // number of data words per block
    private readonly DATA_WSIZE = 4;    // number of lines per data word
    private readonly DATA_LINES = this.DATA_WORDS * this.DATA_WSIZE;

    private readonly BLOCK_LINES = 2 * this.HEADER_LINES + this.DATA_LINES;
    private readonly NUM_BLOCKS = 1474; // number of blocks on tape

    // a tape consists of a reverse end zone, a sync zone, a data zone, another sync zone and a forward end zone
    private readonly TAPE_LINES = 2 * this.ZONE_LINES + 2 * this.SYNC_LINES + this.NUM_BLOCKS * this.BLOCK_LINES;

    private REVERSE_ZONE_POS = this.ZONE_LINES;
    private FORWARD_ZONE_POS = this.TAPE_LINES - this.ZONE_LINES;

    private DATA_ZONE_START = this.REVERSE_ZONE_POS + this.SYNC_LINES;
    private DATA_ZONE_END = this.FORWARD_ZONE_POS - this.SYNC_LINES;

    private US_PER_LINE = 33;           // microseconds per line

    private readonly BRK_ADDR   = 0o7754;

    private tapes: TapeState[] = [];

    public getDeviceID(): DeviceID {
        return DeviceID.DEV_ID_TC08;
    }

    public getBusConnections(): number[] {
        return [0o76, 0o77];
    }

    public requestAction(action: string, data: any): void {
        switch (action) {
            case 'load-tape':
                this.loadTape(data.unit, data.tapeData);
                break;
        }
    }

    private loadTape(unit: number, data: Buffer) {
        console.log(`TC08: Tape loaded`);
        this.tapes[unit] = {
            unit: unit,
            data: data,
            curLine: 1000,
        }
    }

    private lastRegA: number = 0;

    public async run(io: IOContext): Promise<void> {
        while (this.keepAlive) {
            const regA = io.readRegister(DeviceRegister.REG_A);

            if (regA == this.lastRegA) {
                await sleepMs(1);
                continue;
            }

            this.lastRegA = regA;
            const state = this.decodeRegA(regA);

            if (this.DEBUG) {
                console.log(`TC08: DTXA ${regA.toString(8)}`);
            }

            if (state.run) {
                try {
                    await this.performFunction(io, state);
                } catch (e) {
                    console.log(`TC08: Error ${e}`);
                    this.setTimingError(io);
                    continue;
                }
            }
        }
    }

    private didRegAChange(io: IOContext): boolean {
        const regA = io.readRegister(DeviceRegister.REG_A);
        return regA != this.lastRegA;
    }

    private async performFunction(io: IOContext, state: StatusRegisterA) {
        const tape = this.tapes[state.transportUnit];

        if (!tape) {
            this.setSelectError(io);
            return;
        }

        if (this.DEBUG) {
            console.log(`TC08: Func ${TapeFunction[state.func]}, dir ${TapeDirection[state.direction]}, run ${state.run}, cont ${state.contMode}`);
        }

        switch (state.func) {
            case TapeFunction.MOVE:
                await this.doMove(io, tape, state.direction);
                break;
            case TapeFunction.SEARCH:
                await this.doSearch(io, tape, state.direction, state.contMode);
                break;
            case TapeFunction.READ:
                await this.doRead(io, tape, state.direction, state.contMode);
                break;
            case TapeFunction.WRITE:
                await this.doWrite(io, tape, state.direction, state.contMode);
                break;
            default:
                console.log(`TC08: Function ${TapeFunction[state.func]} not implemented`);
                this.setSelectError(io);
        }
    }

    private async doMove(io: IOContext, tape: TapeState, dir: TapeDirection) {
        let stop = false;
        do {
            if (dir == TapeDirection.FORWARD) {
                if (tape.curLine > this.FORWARD_ZONE_POS) {
                    stop = true;
                }
            } else {
                if (tape.curLine < this.REVERSE_ZONE_POS) {
                    stop = true;
                }
            }

            await this.moveAndWaitLines(tape, dir, this.BLOCK_LINES);

            if (this.didRegAChange(io)) {
                return;
            }
        } while (!stop);

        console.log(`TC08: Move done, now ${tape.curLine}`);
        this.setEndOfTapeError(io);
    }

    private async doSearch(io: IOContext, tape: TapeState, dir: TapeDirection, contMode: boolean) {
        while (!this.didRegAChange(io)) {
            const [curBlock, curBlockPos] = this.calcBlockAddr(tape.curLine);

            if (dir == TapeDirection.FORWARD) {
                if (tape.curLine >= this.FORWARD_ZONE_POS) {
                    this.setEndOfTapeError(io);
                    continue;
                }

                if (tape.curLine >= this.DATA_ZONE_END) {
                    this.moveAndWaitLines(tape, dir, this.BLOCK_LINES);
                    continue;
                }

                if (tape.curLine < this.DATA_ZONE_START) {
                    await this.moveAndWaitLines(tape, dir, this.DATA_ZONE_START - tape.curLine);
                    continue;
                }

                if (curBlockPos != 0) {
                    // wait until tape is at the block header of the next block
                    await this.moveAndWaitLines(tape, dir, this.BLOCK_LINES - curBlockPos);
                    continue;
                }
            } else {
                if (tape.curLine < this.REVERSE_ZONE_POS) {
                    this.setEndOfTapeError(io);
                    continue;
                }

                if (tape.curLine < this.DATA_ZONE_START) {
                    this.moveAndWaitLines(tape, dir, this.BLOCK_LINES);
                    continue;
                }

                if (tape.curLine > this.DATA_ZONE_END) {
                    await this.moveAndWaitLines(tape, dir, tape.curLine - this.DATA_ZONE_END);
                    continue;
                }

                if (curBlockPos != this.BLOCK_LINES - 1) {
                    // wait until tape is at the reverse block header of the next block
                    await this.moveAndWaitLines(tape, dir, curBlockPos + 1);
                    continue;
                }
            }

            console.log(`TC08: Search -> ${tape.unit}.${curBlock}`);

            const memField = this.readMemField(io);
            const reply = await io.dataBreak({
                threeCycle: true,
                isWrite: true,
                data: curBlock,
                address: this.BRK_ADDR,
                field: memField,
                incMB: false,
                incCA: false
            });

            if (!contMode || reply.wordCountOverflow) {
                this.setDECTapeFlag(io);
            }

            // skip over header
            await this.moveAndWaitLines(tape, dir, this.HEADER_LINES);
        }
    }

    private async doRead(io: IOContext, tape: TapeState, dir: TapeDirection, contMode: boolean) {
        if (dir == TapeDirection.REVERSE) {
            throw Error("Reverse read not supported");
        }

        if (tape.curLine < this.DATA_ZONE_START) {
            await this.moveAndWaitLines(tape, dir, this.DATA_ZONE_START - tape.curLine);
        }

        while (!this.didRegAChange(io)) {
            if (tape.curLine >= this.DATA_ZONE_END) {
                await this.moveAndWaitLines(tape, dir, this.HEADER_LINES);
                continue;
            }

            if (tape.curLine >= this.FORWARD_ZONE_POS) {
                this.setEndOfTapeError(io);
                continue;
            }

            const [curBlock, curPos] = this.calcBlockAddr(tape.curLine);

            // move to beginning of block content
            if (curPos < this.HEADER_LINES) {
                // skip over header
                await this.moveAndWaitLines(tape, dir, this.HEADER_LINES - curPos);
                continue;
            } else if (curPos > this.HEADER_LINES) {
                // skip over trailer to next block
                await this.moveAndWaitLines(tape, dir, this.BLOCK_LINES + this.HEADER_LINES - curPos);
                continue;
            }

            console.log(`TC08: Read ${tape.unit}.${curBlock}`);
            let overflow = false;
            for (let i = 0; i < this.DATA_WORDS; i++) {
                const memField = this.readMemField(io);
                const data = tape.data.readUInt16LE((curBlock * this.DATA_WORDS + i) * 2);

                const brkReply = await io.dataBreak({
                    threeCycle: true,
                    isWrite: true,
                    data: data,
                    address: this.BRK_ADDR,
                    field: memField,
                    incMB: false,
                    incCA: true
                });

                if (brkReply.wordCountOverflow) {
                    overflow = true;
                    break;
                }

                await this.moveAndWaitLines(tape, dir, this.DATA_WSIZE);

                if (this.didRegAChange(io)) {
                    return;
                }
            }

            if (!contMode || overflow) {
                this.setDECTapeFlag(io);
            }
        }
    }

    private async doWrite(io: IOContext, tape: TapeState, dir: TapeDirection, contMode: boolean) {
        if (dir == TapeDirection.REVERSE) {
            throw Error("Reverse write not supported");
        }

        if (tape.curLine < this.DATA_ZONE_START) {
            await this.moveAndWaitLines(tape, dir, this.DATA_ZONE_START - tape.curLine);
        }

        while (!this.didRegAChange(io)) {
            if (tape.curLine >= this.DATA_ZONE_END) {
                await this.moveAndWaitLines(tape, dir, this.HEADER_LINES);
                continue;
            }

            if (tape.curLine >= this.FORWARD_ZONE_POS) {
                this.setEndOfTapeError(io);
                continue;
            }

            const [curBlock, curPos] = this.calcBlockAddr(tape.curLine);

            // move to beginning of block content
            if (curPos < this.HEADER_LINES) {
                // skip over header
                await this.moveAndWaitLines(tape, dir, this.HEADER_LINES - curPos);
                continue;
            } else if (curPos > this.HEADER_LINES) {
                // skip over trailer to next block
                await this.moveAndWaitLines(tape, dir, this.BLOCK_LINES + this.HEADER_LINES - curPos);
                continue;
            }

            console.log(`TC08: Write ${tape.unit}.${curBlock}`);
            let overflow = false;
            for (let i = 0; i < this.DATA_WORDS; i++) {
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

                tape.data.writeUInt16LE(brkReply.mb, (curBlock * this.DATA_WORDS + i) * 2);

                if (brkReply.wordCountOverflow) {
                    overflow = true;
                    break;
                }

                await this.moveAndWaitLines(tape, dir, this.DATA_WSIZE);

                if (this.didRegAChange(io)) {
                    return;
                }
            }

            if (!contMode || overflow) {
                this.setDECTapeFlag(io);
            }
        }
    }

    private async moveAndWaitLines(tape: TapeState, dir: TapeDirection, lines: number): Promise<void> {
        if (dir == TapeDirection.FORWARD) {
            tape.curLine += lines;
        } else {
            tape.curLine -= lines;
        }

        await sleepUs(lines * this.US_PER_LINE);
    }

    private calcBlockAddr(line: number): [number, number] {
        const block = Math.floor((line - this.DATA_ZONE_START) / this.BLOCK_LINES);
        const offset = (line - this.DATA_ZONE_START) % this.BLOCK_LINES;

        return [block, offset];
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

    private setTimingError(io: IOContext) {
        console.log(`TC08: Timing error`);
        this.clearMotionFlag(io);

        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 11) | (1 << 6));
    }

    private setSelectError(io: IOContext) {
        console.log(`TC08: Select error`);
        this.clearMotionFlag(io);

        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 11) | (1 << 8));
    }

    private setEndOfTapeError(io: IOContext) {
        console.log(`TC08: End of tape`);
        this.clearMotionFlag(io);

        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 11) | (1 << 9));
    }

    private clearMotionFlag(io: IOContext) {
        const regA = io.readRegister(DeviceRegister.REG_A);
        io.writeRegister(DeviceRegister.REG_A, regA & ~(1 << 7));
    }

    private setDECTapeFlag(io: IOContext) {
        const regB = io.readRegister(DeviceRegister.REG_B);
        io.writeRegister(DeviceRegister.REG_B, regB | (1 << 0));
    }
}
