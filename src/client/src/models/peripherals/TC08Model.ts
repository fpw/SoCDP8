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

import { TC08Configuration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { DECTape, TapeState } from "../DECTape";
import { PeripheralModel } from "./PeripheralModel";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface TC08Store {
    tapes: DECTape[];
    clear: () => void;
    setTapeState: (i: number, state: TapeState) => void;
}

export class TC08Model extends PeripheralModel {
    private store = create<TC08Store>()(immer(devtools(set => ({
        tapes: [
            new DECTape(), new DECTape(), new DECTape(), new DECTape(),
            new DECTape(), new DECTape(), new DECTape(), new DECTape(),
        ],
        clear: () => set(draft => {
            draft.tapes = [
                new DECTape(), new DECTape(), new DECTape(), new DECTape(),
                new DECTape(), new DECTape(), new DECTape(), new DECTape(),
            ];
        }),
        setTapeState: (i: number, state: TapeState) => set(draft => {
            draft.tapes[i].useTape.getState().setState(state);
        }),
    }))));


    constructor(backend: Backend, private conf: TC08Configuration) {
        super(backend);
    }

    public get connections(): number[] {
        return [0o76, 0o77];
    }

    public get config(): TC08Configuration {
        return this.conf;
    }

    public onPeripheralAction(action: string, data: any): void {
        if (action != "status") {
            return;
        }

        this.store.getState().clear();
        for (const state of (data.data as any[])) {
            const tape: TapeState = {
                loaded: state.loaded,
                address: state.address,
                selected: state.selected,
                moving: state.moving,
                reverse: state.reverse,
                writing: state.writing,
                normalizedPosition: state.normalizedPosition,
            };
            this.store.getState().setTapeState(tape.address, tape);
        }
    }

    public get useState() {
        return this.store;
    }

    public readonly loadTape = async(tape: File, unit: number): Promise<void> => {
        const data = await this.loadFile(tape);
        this.backend.sendPeripheralAction(this.conf.id, "load-tape", {
            unit: unit,
            tapeData: data
        });
    }
}
