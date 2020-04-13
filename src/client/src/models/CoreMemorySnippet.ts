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

export interface CoreMemorySnippet {
    label: string;
    desc: string;
    start: number,
    data: number[];
}

export const CoreMemorySnippets: CoreMemorySnippet[] = [
    {
        label: 'AC/MQ Blinker',
        desc: 'Lamp blink program from dustyoldcomputers.com, start at 0000',
        start: 0o0000,
        data: [
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
        ]
    },
    {
        label: 'RIM Loader (ASR)',
        desc: 'RIM Loader for ASR-33, start at 7756',
        start: 0o7756,
        data: [
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
        ],
    },
    {
        label: 'RIM Loader (HS)',
        desc: 'RIM Loader for PC04, start at 7756',
        start: 0o7756,
        data: [
            0o6014,
            0o6011,
            0o5357,
            0o6016,
            0o7106,
            0o7006,
            0o7510,
            0o5374,
            0o7006,
            0o6011,
            0o5367,
            0o6016,
            0o7420,
            0o3776,
            0o3376,
            0o5357,
            0o0000,
        ],
    },
    {
        label: 'OS/8 TC08 Loader',
        desc: 'OS/8 for TC08, start at 7613',
        start: 0o7613,
        data: [
            0o6774, // 7613: DTLB        / set TC08 field to 0, clear AC
            0o1222, // 7614: TAD K0600   / set reverse and run
            0o6766, // 7615: DTCA!DTXA   / load status register A, clear AC
            0o6771, // 7616: DTSF        / wait until done
            0o5216, // 7617: JMP .-1
            0o1223, // 7620: TAD K0220   / set forward read
            0o5215, // 7621: JMP 7615    / execute - that loop will run until block loaded, but that won't happen before overwritten
            0o0600, // 7622: K0600
            0o0220, // 7623: K0220
        ],
    },
    {
        label: 'OS/8 RF08 Loader',
        desc: 'OS/8 for RF08, start at 7750',
        start: 0o7750,
        data: [
            0o7600,
            0o6603,
            0o6622,
            0o5352,
            0o5752
        ],
    },
    {
        label: 'Monitor TC08 Loader',
        desc: 'TC08 Loader for Monitor, start at 0200',
        start: 0o0200,
        data: [
            0o07600,    /* 200, CLA CLL */
            0o01216,    /*      TAD MVB         ; move back */
            0o04210,    /*      JMS DO          ; action */
            0o01217,    /*      TAD K7577       ; addr */
            0o03620,    /*      DCA I CA */
            0o01222,    /*      TAD RDF         ; read fwd */
            0o04210,    /*      JMS DO          ; action */
            0o05600,    /*      JMP I 200       ; enter boot */
            0o00000,    /* DO,  0 */
            0o06766,    /*      DTCA!DTXA       ; start tape */
            0o03621,    /*      DCA I WC        ; clear wc */
            0o06771,    /*      DTSF            ; wait */
            0o05213,    /*      JMP .-1 */
            0o05610,    /*      JMP I DO */
            0o00600,    /* MVB, 0600 */
            0o07577,    /* K7577, 7757 */
            0o07755,    /* CA,  7755 */
            0o07754,    /* WC,  7754 */
            0o00220     /* RF,  0220 */
        ],
    },
];
