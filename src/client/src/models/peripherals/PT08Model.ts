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

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { PeripheralInAction } from "../../types/PeripheralAction";
import { DeviceID, PT08Configuration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { PaperTape } from "../PaperTape";
import { PeripheralModel } from "./PeripheralModel";

interface PT08Store {
    conf?: PT08Configuration;
    readerActive: boolean;
    punchActive: boolean;
    outBuf: number[];
    setConf: (conf: PT08Configuration) => void;
    setReader: (active: boolean) => void;
    setPunch: (active: boolean) => void;
    addOutput: (chr: number) => void;
    clearOutput: () => void;
}

export class PT08Model extends PeripheralModel {
    private readerTape_: PaperTape = new PaperTape();
    private punchTape_: PaperTape = new PaperTape();
    private store = create<PT08Store>()(immer(set => ({
        readerActive: false,
        punchActive: false,
        outBuf: [],

        setConf: (newConf: PT08Configuration) => set(draft => {
            draft.conf = newConf;
        }),
        setReader: (active: boolean) => set(draft => {
            draft.readerActive = active;
        }),
        setPunch: (active: boolean) => set(draft => {
            draft.punchActive = active;
        }),
        addOutput: (chr: number) => set(draft => {
            draft.outBuf.push(chr);
        }),
        clearOutput: () => set(draft => {
            draft.outBuf = [];
        }),
    })));

    constructor(backend: Backend, conf: PT08Configuration) {
        super(backend);
        this.store.getState().setConf(conf);
    }

    public get useState() {
        return this.store;
    }

    public async onRawKey(key: string) {
        let chr = key.charCodeAt(0);

        if (this.config.autoCaps) {
            if (chr >= 0x61 && chr <= 0x7A) {
                chr -= 0x20;
            }
        }

        if (this.config.eightBit) {
            chr |= 0x80;
        }

        await this.backend.sendPeripheralAction(this.config.id, {type: "key-press", key: chr});
    }

    public get connections(): number[] {
        switch (this.config.id) {
            case DeviceID.DEV_ID_PT08: return [0o03, 0o04];
            case DeviceID.DEV_ID_TT1:  return [0o40, 0o41];
            case DeviceID.DEV_ID_TT2:  return [0o42, 0o43];
            case DeviceID.DEV_ID_TT3:  return [0o44, 0o45];
            case DeviceID.DEV_ID_TT4:  return [0o46, 0o47];
            default: return [];
        }
    }

    public get id() {
        return this.config.id;
    }

    private get config(): PT08Configuration {
        return this.store.getState().conf!;
    }

    public async updateConfig(newConf: PT08Configuration) {
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
        this.store.getState().addOutput(data);
        if (this.store.getState().punchActive) {
            this.punchTape.useTape.getState().pushChar(data);
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
        await this.backend.sendPeripheralAction(this.config.id, {type: "reader-set-active", active});
    };
}
