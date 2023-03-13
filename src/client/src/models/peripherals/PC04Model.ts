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

import { PeripheralModel } from "./PeripheralModel";
import { observable, action, computed, makeObservable } from "mobx";
import { PC04Configuration } from "../../types/PeripheralTypes";
import { PaperTape } from "../PaperTape";
import { Backend } from "../backends/Backend";

export class PC04Model extends PeripheralModel {
    private conf: PC04Configuration;
    private readerTape_?: PaperTape;
    private readerActive_: boolean = false;
    private punchTape_: PaperTape = new PaperTape();
    private punchActive_: boolean = false;

    constructor(backend: Backend, conf: PC04Configuration) {
        super(backend);
        this.conf = conf;
        this.punchTape_.name = "Punch";

        makeObservable<PC04Model, "conf" | "readerTape_" | "readerActive_" | "punchTape_" | "punchActive_">(this, {
            conf: observable,
            readerTape_: observable,
            readerActive_: observable,
            punchTape_: observable,
            punchActive_: observable,

            updateConfig: action,
            onPeripheralAction: action,
            onPunch: action,
            setReaderTape: action,
            setReaderPos: action,
            addPunchLeader: action,
            clearPunch: action,
            setPunchActive: action,
            setReaderActive: action,

            readerActive: computed,
            punchTape: computed,
            punchActive: computed,
            readerPos: computed,
            readerTape: computed,

        });
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
        if (this.punchActive_) {
            this.punchTape.buffer.push(data);
        }
    }

    public async loadTape(file: File): Promise<void> {
        const tape = await PaperTape.fromFile(file);
        await this.backend.sendPeripheralAction(
            this.conf.id,
            "reader-tape-set",
            Uint8Array.from(tape.buffer).buffer
        );
        this.setReaderTape(tape);
    }

    public get readerActive(): boolean {
        return this.readerActive_;
    }

    public setReaderTape(tape: PaperTape) {
        this.readerTape_ = tape;
    }

    public setReaderPos(pos: number) {
        if (this.readerTape_) {
            this.readerTape_.pos = pos;
        }
    }

    public get readerTape(): PaperTape | undefined {
        return this.readerTape_;
    }

    public get readerPos(): number {
        return this.readerPos;
    }

    public get punchTape(): PaperTape {
        return this.punchTape_;
    }

    public get punchActive(): boolean {
        return this.punchActive_;
    }

    public addPunchLeader(): void {
        for (let i = 0; i < 10; i++) {
            this.punchTape.buffer.push(0);
        }
    }

    public clearPunch(): void {
        this.punchTape.buffer = []
    }

    public setPunchActive(active: boolean) {
        this.punchActive_ = active;
    }

    public setReaderActive(active: boolean) {
        this.readerActive_ = active;
        this.backend.sendPeripheralAction(this.conf.id, "reader-set-active", active);
    };
}
