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

export interface FrontPanelState {
    lamps: LampBrightness;
    switches: SwitchState;
};

export interface LampBrightness {
    dataField: number[];
    instField: number[];
    pc: number[];
    memAddr: number[];
    memBuf: number[];
    link: number;
    ac: number[];
    stepCounter: number[];
    mqr: number[];
    instruction: number[];
    state: number[];
    ion: number;
    pause: number;
    run: number;
}

export interface SwitchState {
    dataField: number;
    instField: number;
    swr: number;
    start: number;
    load: number;
    dep: number;
    exam: number;
    cont: number;
    stop: number;
    singStep: number;
    singInst: number;
}

export const FrontPanelDefaultState: FrontPanelState = {
    lamps: {
        dataField: new Array(3).fill(0),
        instField: new Array(3).fill(0),
        pc: new Array(12).fill(0),
        memAddr: new Array(12).fill(0),
        memBuf: new Array(12).fill(0),
        link: 0,
        ac: new Array(12).fill(0),
        stepCounter: new Array(5).fill(0),
        mqr: new Array(12).fill(0),
        instruction: new Array(8).fill(0),
        state: new Array(7).fill(6),
        ion: 0,
        pause: 0,
        run: 0,
    },

    switches: {
        dataField: 0,
        instField: 0,
        swr: 0,
        start: 0,
        load: 0,
        dep: 0,
        exam: 0,
        cont: 0,
        stop: 0,
        singStep: 0,
        singInst: 0,
    }
};
