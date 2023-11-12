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

import { DeviceID, PC04Configuration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { PaperTape } from "../PaperTape";
import { PeripheralModel } from "./PeripheralModel";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { PeripheralInAction } from "../../types/PeripheralAction";

interface PC04Store {
    conf?: PC04Configuration;
    readerActive: boolean;
    punchActive: boolean;
    setConf: (conf: PC04Configuration) => void;
    setReader: (active: boolean) => void;
    setPunch: (active: boolean) => void;
}

export class PC04Model extends PeripheralModel {
    private readerTape_: PaperTape = new PaperTape();
    private punchTape_: PaperTape = new PaperTape();
    private store = create<PC04Store>()(immer(set => ({
        readerActive: false,
        punchActive: false,

        setConf: (newConf: PC04Configuration) => set(draft => {
            draft.conf = newConf;
        }),

        setReader: (active: boolean) => set(draft => {
            draft.readerActive = active;
        }),
        setPunch: (active: boolean) => set(draft => {
            draft.punchActive = active;
        }),
    })));

    constructor(backend: Backend, conf: PC04Configuration) {
        super(backend);
        this.store.getState().setConf(conf);
    }

    public get connections(): number[] {
        return [0o01, 0o02];
    }

    public get id() {
        return this.config.id;
    }

    private get config(): PC04Configuration {
        return this.store.getState().conf!;
    }

    public async updateConfig(newConf: PC04Configuration) {
        this.store.getState().setConf(newConf);
        await this.backend.changePeripheralConfig(this.config.id, this.config);
    }

    public onPeripheralAction(id: DeviceID, action: PeripheralInAction) {
        switch (action.type) {
            case "punch":
                this.onPunch(action.char);
                break;
            case "readerPos":
                this.setReaderPos(action.pos);
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
        const buffer = tape.useTape.getState().tapeState.buffer;
        await this.backend.sendPeripheralAction(
            this.config.id, {
                type: "reader-tape-set",
                tapeData: Uint8Array.from(buffer)
            }
        );
        this.setReaderTape(tape);
    }

    public get useState() {
        return this.store;
    }

    public setReaderTape(tape: PaperTape) {
        this.readerTape.useTape.getState().setPaperState(tape.useTape.getState().tapeState);
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

    public async setPunchActive(active: boolean) {
        this.store.getState().setPunch(active);
    }

    public async setReaderActive(active: boolean) {
        this.store.getState().setReader(active);
        await this.backend.sendPeripheralAction(this.config.id, { type: "reader-set-active", active });
    };
}
