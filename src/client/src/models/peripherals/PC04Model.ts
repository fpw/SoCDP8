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

import { PC04Configuration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { PaperTape } from "../PaperTape";
import { PeripheralModel } from "./PeripheralModel";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface PC04Store {
    readerActive: boolean;
    punchActive: boolean;
    setReader: (active: boolean) => void;
    setPunch: (active: boolean) => void;
}

export class PC04Model extends PeripheralModel {
    private conf: PC04Configuration;
    private readerTape_: PaperTape = new PaperTape();
    private punchTape_: PaperTape = new PaperTape();
    private store = create<PC04Store>()(immer(devtools(set => ({
        readerActive: false,
        punchActive: false,

        setReader: (active: boolean) => set(draft => {
            draft.readerActive = active;
        }),
        setPunch: (active: boolean) => set(draft => {
            draft.punchActive = active;
        }),
    }))));

    constructor(backend: Backend, conf: PC04Configuration) {
        super(backend);
        this.conf = conf;
    }

    public get connections(): number[] {
        return [0o01, 0o02];
    }

    public get config(): PC04Configuration {
        return this.conf;
    }

    public updateConfig(newConf: PC04Configuration) {
        this.conf = newConf;
        this.backend.changePeripheralConfig(this.conf.id, this.conf);
    }

    public onPeripheralAction(action: string, data: any): void {
        switch (action) {
            case "punch":
                this.onPunch(data.data);
                break;
            case "readerPos":
                this.setReaderPos(data.data);
                break;
        }
    }

    public onPunch(data: number) {
        if (this.store.getState().punchActive) {
            this.punchTape.useTape().pushChar(data);
        }
    }

    public async loadTape(file: File): Promise<void> {
        const tape = await PaperTape.fromFile(file);
        const buffer = tape.useTape.getState().state.buffer;
        await this.backend.sendPeripheralAction(
            this.conf.id,
            "reader-tape-set",
            Uint8Array.from(buffer).buffer
        );
        this.setReaderTape(tape);
    }

    public get useState() {
        return this.store;
    }

    public setReaderTape(tape: PaperTape) {
        this.readerTape.useTape.getState().setState(tape.useTape.getState().state);
    }

    public setReaderPos(pos: number) {
        this.readerTape_.useTape.getState().setPos(pos);
    }

    public get readerTape(): PaperTape {
        return this.readerTape_;
    }

    public get punchTape(): PaperTape {
        return this.punchTape_;
    }

    public addPunchLeader(): void {
        for (let i = 0; i < 10; i++) {
            this.punchTape.useTape.getState().pushChar(0);
        }
    }

    public clearPunch(): void {
        this.punchTape.useTape.getState().clear();
    }

    public setPunchActive(active: boolean) {
        this.store.getState().setPunch(active);
    }

    public setReaderActive(active: boolean) {
        this.store.getState().setReader(active);
        this.backend.sendPeripheralAction(this.conf.id, "reader-set-active", active);
    };
}
