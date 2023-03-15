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

import { DeviceID, TC08Configuration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { DECTape, TapeState } from "../DECTape";
import { PeripheralModel } from "./PeripheralModel";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { PeripheralInAction } from "../../types/PeripheralAction";

interface TC08Store {
    tapes: DECTape[];
    numTUs: number;
    clear: () => void;
    setTapeState: (i: number, state: TapeState) => void;
    setNumTUs: (num: number) => void;
}

export class TC08Model extends PeripheralModel {
    private store = create<TC08Store>()(immer(set => ({
        tapes: [],
        numTUs: 0,
        clear: () => set(draft => {
            draft.tapes = [
                new DECTape(), new DECTape(), new DECTape(), new DECTape(),
                new DECTape(), new DECTape(), new DECTape(), new DECTape(),
            ];
        }),
        setTapeState: (i: number, state: TapeState) => set(draft => {
            draft.tapes[i].useTape.getState().setTapeState(state);
        }),
        setNumTUs: (num: number) => set(draft => {
            draft.numTUs = num;
        }),
    })));

    constructor(backend: Backend, private conf: TC08Configuration) {
        super(backend);
        this.store.getState().clear();
        this.store.getState().setNumTUs(conf.numTapes);
    }

    public get connections(): number[] {
        return [0o76, 0o77];
    }

    public get id() {
        return this.conf.id;
    }

    public onPeripheralAction(id: DeviceID, action: PeripheralInAction) {
        if (action.type != "tapeStates") {
            return;
        }

        for (const state of action.states) {
            this.store.getState().setTapeState(state.address, state);
        }
    }

    public get useState() {
        return this.store;
    }

    public async loadTape(tape: File, unit: number) {
        const data = await this.loadFile(tape);
        await this.backend.sendPeripheralAction(this.conf.id, {
            type: "load-tape",
            unit: unit,
            data: new Uint8Array(data),
        });
    }
}
