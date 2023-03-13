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
import { PT08Configuration, DeviceID } from "../../types/PeripheralTypes";
import { PaperTape } from "../PaperTape";
import { Terminal } from "xterm";
import { observable, computed, action, makeObservable } from "mobx";
import { Backend } from "../backends/Backend";

export class PT08Model extends PeripheralModel {
    private conf: PT08Configuration;
    private readerTape_?: PaperTape;
    private readerActive_: boolean = false;
    private punchTape_: PaperTape = new PaperTape();
    private punchActive_: boolean = false;

    private xterm: Terminal;

    constructor(backend: Backend, conf: PT08Configuration) {
        super(backend);
        this.conf = conf;
        this.punchTape_.name = "Punch";
        this.xterm = new Terminal();

        this.xterm.onData(data => {
            for (const c of data) {
                this.onRawKey(c);
            }
        });

        makeObservable<PT08Model, "conf" | "readerTape_" | "readerActive_" | "punchTape_" | "punchActive_">(this, {
            conf: observable,
            readerTape_: observable,
            readerActive_: observable,
            punchTape_: observable,
            punchActive_: observable,

            onRawKey: action,
            updateConfig: action,
            onPunch: action,
            setReaderTape: action,
            setReaderPos: action,
            addPunchLeader: action,
            setPunchActive: action,
            clearPunch: action,
            setReaderActive: action,

            config: computed,
            readerActive: computed,
            readerTape: computed,
            readerPos: computed,
            punchTape: computed,
            punchActive: computed,


        });
    }

    public onRawKey(key: string) {
        let chr = key.charCodeAt(0);

        if (this.conf.autoCaps) {
            if (chr >= 0x61 && chr <= 0x7A) {
                chr -= 0x20;
            }
        }

        if (this.conf.eightBit) {
            chr |= 0x80;
        }

        this.backend.sendPeripheralAction(this.conf.id, "key-press", chr);
    }

    public get connections(): number[] {
        switch (this.conf.id) {
            case DeviceID.DEV_ID_PT08: return [0o03, 0o04];
            case DeviceID.DEV_ID_TT1:  return [0o40, 0o41];
            case DeviceID.DEV_ID_TT2:  return [0o42, 0o43];
            case DeviceID.DEV_ID_TT3:  return [0o44, 0o45];
            case DeviceID.DEV_ID_TT4:  return [0o46, 0o47];
            default: return [];
        }
    }

    public get config(): PT08Configuration {
        return this.conf;
    }

    public updateConfig(newConf: PT08Configuration) {
        this.conf = newConf;
        this.backend.changePeripheralConfig(this.conf.id, this.conf);
    }

    public onPeripheralAction(action: string, data: any) {
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
        this.xterm.write(String.fromCodePoint(data & 0x7F));
        if (this.punchActive_) {
            this.punchTape.buffer.push(data);
        }
    }

    public get terminal(): Terminal {
        return this.xterm;
    }

    public async loadTape(file: File): Promise<void> {
        const tape = await PaperTape.fromFile(file);
        this.backend.sendPeripheralAction(
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
