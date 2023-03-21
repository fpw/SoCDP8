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
import { DumpMixin } from "./DumpMixin";
import { DiskModel } from "./DiskModel";

interface TC08Store {
    tapes: DECTape[];
    numTUs: number;
    clear: () => void;
    setTapeState: (i: number, state: TapeState) => void;
    setNumTUs: (num: number) => void;
}

export class TC08Model extends PeripheralModel implements DiskModel {
    private dumpHandler: DumpMixin;

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
        this.dumpHandler = new DumpMixin(backend, conf.id);
    }

    public get connections(): number[] {
        return [0o76, 0o77];
    }

    public get id() {
        return this.conf.id;
    }

    public getDumpExtension(): string {
        return "tu56";
    }

    public getDiskCount(): number {
        return this.conf.numTapes;
    }

    public getDiskSize(): number {
        return 380292;
    }

    public onPeripheralAction(id: DeviceID, action: PeripheralInAction) {
        if (action.type == "tapeStates") {
            for (const state of action.states) {
                this.store.getState().setTapeState(state.address, state);
            }
        } else {
            this.dumpHandler.onPeripheralAction(id, action);
        }
    }

    public get useState() {
        return this.store;
    }

    public async downloadDump(unit: number): Promise<Uint8Array> {
        return await this.dumpHandler.downloadDump(unit);
    }

    public async uploadDump(unit: number, dump: Uint8Array) {
        await this.dumpHandler.uploadDump(unit, dump);
    }
}
