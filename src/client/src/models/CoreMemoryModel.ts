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

export class CoreMemoryModel {
    constructor(private socket: SocketIOClient.Socket) {
    }

    public clear() {
        this.socket.emit('core', {action: 'clear'});
    }

    public storeBlinker() {
        // source: http://dustyoldcomputers.com/pdp8/pdp8i/testprogs/acmqblinker.html
        const program = [
            0o2012, // isz   delay  / create a delay
            0o5000, // jmp   loop
            0o7200, // cla          / clear AC so we can load it
            0o1013, // tad   value  / get value
            0o7421, // mql          / stash AC into MQ
            0o1013, // tad   value  / fetch value again
            0o7040, // cma          / complement AC
            0o2013, // isz   value  / get to next value
            0o7000, // nop          / ignore possible "skip" from ISZ
            0o5000, // jmp   loop   / and do it all again
            0o0000, // delay
            0o0000, // value
        ];
        this.write(0, program);
    }

    public storeRIMLoader() {
        const program = [
            0o6032, // KCC         / clear keyboard flag and ac
            0o6031, // KSF         / skip if keyboard flag
            0o5357, // JMP 7757    / jmp -1
            0o6036, // KRB         / clear ac, or AC with data (8 bit), clear flag
            0o7106, // CLL RTL     / clear link, rotate left 2
            0o7006, // RTL         / rotate left 2
            0o7510, // SPA         / skip if ac > 0
            0o5357, // JMP 7757    / jmp back
            0o7006, // RTL         / rotate left 2
            0o6031, // KSF         / skip if keyboard flag
            0o5367, // JMP 7767    / jmp -1
            0o6034, // KRS         / or AC with keyboard (8 bit)
            0o7420, // SNL         / skip if link
            0o3776, // DCA I 7776  / store ac in [7776], clear ac
            0o3376, // DCA 7776    / store ac in 7776, clear ac
            0o5356, // JMP 7756
            0o0000, // address
        ];
        this.write(0o7756, program);
    }

    public storeOS8Loader() {
        const program = [
            0o6774, // 7613: DTLB        / set TC08 field to 0, clear AC
            0o1222, // 7614: TAD K0600   / set reverse and run
            0o6766, // 7615: DTCA!DTXA   / load status register A, clear AC
            0o6771, // 7616: DTSF        / wait until done
            0o5216, // 7617: JMP .-1
            0o1223, // 7620: TAD K0220   / set forward read
            0o5215, // 7621: JMP 7615    / execute - that loop will run until block loaded, but that won't happen before overwritten
            0o0600, // 7622: K0600
            0o0220, // 7623: K0220
        ];
        this.write(0o7613, program);

        const dataBreak = [
            0o7577, // 7754: data break word count
            0o7577, // 7755: data break current addr
        ]
        this.write(0o7754, dataBreak);
    }

    public write(addr: number, fragment: number[]) {
        this.socket.emit('core', {
            action: 'write',
            addr: addr,
            fragment: fragment
        });
    }
}
